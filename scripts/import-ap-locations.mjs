/**
 * Import the Andhra Pradesh administrative hierarchy into the existing UUID
 * location tables without adding source-code columns to the application
 * schema.
 *
 * Source: Local Government Directory (LGD), Ministry of Panchayati Raj,
 * Government of India, published through data.gov.in:
 * https://ap.data.gov.in/resource/local-government-directory-lgd-villages
 *
 * Run from frontend with:
 *   node --env-file=.env.local scripts/import-ap-locations.mjs
 *
 * The source codes are used only in memory to resolve parent relationships.
 * The database stores UUID ids and names only.
 */

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const SOURCE_PATH = new URL("../data/andhra-pradesh-villages-lgd.csv", import.meta.url);
const PAGE_SIZE = 1000;
const BATCH_SIZE = 500;

function cleanName(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizedName(value) {
  return cleanName(value).normalize("NFKC").toLocaleLowerCase("en-US");
}

function districtKey(value) {
  const key = normalizedName(value);
  // Preserve the existing UUIDs for the old seed names that correspond to
  // current LGD names.
  return new Map([
    ["anantapur", "ananthapuramu"],
    ["kadapa", "y.s.r. kadapa"],
  ]).get(key) ?? key;
}

function parseCsv(text) {
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (character === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n") {
      record.push(field.replace(/\r$/, ""));
      records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field.replace(/\r$/, ""));
    records.push(record);
  }
  return records;
}

function sourceDate(value) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(cleanName(value));
  return match ? Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : 0;
}

function chooseLatest(current, candidate) {
  if (!current || candidate.updated > current.updated) return candidate;
  if (candidate.updated === current.updated && candidate.name.localeCompare(current.name) < 0) return candidate;
  return current;
}

function parseSource(text) {
  const records = parseCsv(text);
  const districtByCode = new Map();
  const mandalBySourceKey = new Map();
  const villageBySourceKey = new Map();
  let malformedRows = 0;
  let usableRows = 0;

  for (const row of records.slice(1)) {
    if (row.length < 17) {
      malformedRows += 1;
      continue;
    }

    const villageSourceCode = cleanName(row[0]);
    const villageName = cleanName(row[1]);
    const mandalSourceCode = cleanName(row[4]);
    const mandalName = cleanName(row[5]);
    const districtSourceCode = cleanName(row[8]);
    const districtName = cleanName(row[9]);
    const updated = sourceDate(row[16]);

    if (!villageSourceCode || !villageName || !mandalSourceCode || !mandalName || !districtSourceCode || !districtName) {
      malformedRows += 1;
      continue;
    }
    usableRows += 1;

    districtByCode.set(
      districtSourceCode,
      chooseLatest(districtByCode.get(districtSourceCode), {
        code: districtSourceCode,
        name: districtName,
        updated,
      }),
    );

    const mandalSourceKey = `${districtSourceCode}|${mandalSourceCode}`;
    mandalBySourceKey.set(
      mandalSourceKey,
      chooseLatest(mandalBySourceKey.get(mandalSourceKey), {
        sourceKey: mandalSourceKey,
        districtSourceCode,
        code: mandalSourceCode,
        name: mandalName,
        updated,
      }),
    );

    const villageSourceKey = `${mandalSourceKey}|${normalizedName(villageName)}`;
    villageBySourceKey.set(
      villageSourceKey,
      chooseLatest(villageBySourceKey.get(villageSourceKey), {
        sourceKey: villageSourceKey,
        mandalSourceKey,
        code: villageSourceCode,
        name: villageName,
        updated,
      }),
    );
  }

  return {
    districts: [...districtByCode.values()],
    mandals: [...mandalBySourceKey.values()],
    villages: [...villageBySourceKey.values()],
    usableRows,
    malformedRows,
    duplicateVillageRows: usableRows - villageBySourceKey.size,
  };
}

function indexUnique(rows, keyFor) {
  const index = new Map();
  const duplicates = [];
  for (const row of rows) {
    const key = keyFor(row);
    if (index.has(key)) duplicates.push(key);
    else index.set(key, row);
  }
  if (duplicates.length > 0) {
    throw new Error(`Existing duplicate location keys detected: ${[...new Set(duplicates)].slice(0, 10).join(", ")}`);
  }
  return index;
}

async function fetchAll(supabase, table, columns) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

async function insertMissing(supabase, table, rows, conflictTarget) {
  for (let from = 0; from < rows.length; from += BATCH_SIZE) {
    const batch = rows.slice(from, from + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(batch, {
      onConflict: conflictTarget,
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }
}

function countNormalizedDuplicates(rows, keyFor) {
  const counts = new Map();
  for (const row of rows) counts.set(keyFor(row), (counts.get(keyFor(row)) ?? 0) + 1);
  return [...counts.values()].filter((count) => count > 1).length;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const source = parseSource(await readFile(SOURCE_PATH, "utf8"));
  if (source.malformedRows > 0) throw new Error(`Source validation failed: ${source.malformedRows} malformed rows`);
  if (source.districts.length === 0 || source.mandals.length === 0 || source.villages.length === 0) throw new Error("Source validation failed: the hierarchy is empty");

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const existingDistricts = await fetchAll(supabase, "districts", "id, name");
  const districtIndex = indexUnique(existingDistricts, (row) => districtKey(row.name));
  const missingDistricts = source.districts
    .filter((row) => !districtIndex.has(districtKey(row.name)))
    .map((row) => ({ name: row.name }));
  await insertMissing(supabase, "districts", missingDistricts, "name");

  const districts = await fetchAll(supabase, "districts", "id, name");
  const districtByKey = indexUnique(districts, (row) => districtKey(row.name));
  const districtIdBySourceCode = new Map();
  for (const sourceDistrict of source.districts) {
    const district = districtByKey.get(districtKey(sourceDistrict.name));
    if (!district) throw new Error(`Unable to resolve district: ${sourceDistrict.name}`);
    districtIdBySourceCode.set(sourceDistrict.code, district.id);
  }

  const existingMandals = await fetchAll(supabase, "mandals", "id, name, district_id");
  const mandalIndex = indexUnique(existingMandals, (row) => `${row.district_id}|${normalizedName(row.name)}`);
  const missingMandals = [];
  for (const sourceMandal of source.mandals) {
    const districtId = districtIdBySourceCode.get(sourceMandal.districtSourceCode);
    if (!districtId) throw new Error(`Unable to resolve parent district for mandal: ${sourceMandal.name}`);
    const keyForMandal = `${districtId}|${normalizedName(sourceMandal.name)}`;
    if (!mandalIndex.has(keyForMandal)) missingMandals.push({ district_id: districtId, name: sourceMandal.name });
  }
  await insertMissing(supabase, "mandals", missingMandals, "district_id,name");

  const mandals = await fetchAll(supabase, "mandals", "id, name, district_id");
  const mandalByDatabaseKey = indexUnique(mandals, (row) => `${row.district_id}|${normalizedName(row.name)}`);
  const mandalIdBySourceKey = new Map();
  for (const sourceMandal of source.mandals) {
    const districtId = districtIdBySourceCode.get(sourceMandal.districtSourceCode);
    const databaseMandal = mandalByDatabaseKey.get(`${districtId}|${normalizedName(sourceMandal.name)}`);
    if (!databaseMandal) throw new Error(`Unable to resolve mandal: ${sourceMandal.name}`);
    mandalIdBySourceKey.set(sourceMandal.sourceKey, databaseMandal.id);
  }

  const existingVillages = await fetchAll(supabase, "villages", "id, name, mandal_id");
  const villageIndex = indexUnique(existingVillages, (row) => `${row.mandal_id}|${normalizedName(row.name)}`);
  const missingVillages = [];
  for (const sourceVillage of source.villages) {
    const mandalId = mandalIdBySourceKey.get(sourceVillage.mandalSourceKey);
    if (!mandalId) throw new Error(`Unable to resolve parent mandal for village: ${sourceVillage.name}`);
    const keyForVillage = `${mandalId}|${normalizedName(sourceVillage.name)}`;
    if (!villageIndex.has(keyForVillage)) missingVillages.push({ mandal_id: mandalId, name: sourceVillage.name });
  }
  await insertMissing(supabase, "villages", missingVillages, "mandal_id,name");

  const finalDistricts = await fetchAll(supabase, "districts", "id, name");
  const finalMandals = await fetchAll(supabase, "mandals", "id, name, district_id");
  const finalVillages = await fetchAll(supabase, "villages", "id, name, mandal_id");
  const districtIds = new Set(finalDistricts.map((row) => row.id));
  const mandalIds = new Set(finalMandals.map((row) => row.id));
  const orphanMandals = finalMandals.filter((row) => !districtIds.has(row.district_id)).length;
  const orphanVillages = finalVillages.filter((row) => !mandalIds.has(row.mandal_id)).length;
  const duplicateMandals = countNormalizedDuplicates(finalMandals, (row) => `${row.district_id}|${normalizedName(row.name)}`);
  const duplicateVillages = countNormalizedDuplicates(finalVillages, (row) => `${row.mandal_id}|${normalizedName(row.name)}`);
  if (orphanMandals || orphanVillages || duplicateMandals || duplicateVillages) {
    throw new Error(`Hierarchy validation failed: orphanMandals=${orphanMandals}, orphanVillages=${orphanVillages}, duplicateMandals=${duplicateMandals}, duplicateVillages=${duplicateVillages}`);
  }

  console.log(JSON.stringify({
    source: "Government of India LGD via data.gov.in",
    sourceRows: source.usableRows,
    sourceDistricts: source.districts.length,
    sourceMandals: source.mandals.length,
    sourceUniqueVillages: source.villages.length,
    duplicateSourceVillageRows: source.duplicateVillageRows,
    inserted: {
      districts: missingDistricts.length,
      mandals: missingMandals.length,
      villages: missingVillages.length,
    },
    final: {
      districts: finalDistricts.length,
      mandals: finalMandals.length,
      villages: finalVillages.length,
      orphanMandals,
      orphanVillages,
      duplicateMandals,
      duplicateVillages,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error("AP location import failed", error);
  process.exitCode = 1;
});
