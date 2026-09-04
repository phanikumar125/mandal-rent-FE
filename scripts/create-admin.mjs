/**
 * Provision an administrator through the existing atomic MandalRent account RPC.
 *
 * Required environment variables:
 *   ADMIN_PHONE, ADMIN_PIN, ADMIN_NAME
 * Optional: ADMIN_LANGUAGE (en|te), ADMIN_CITY, ADMIN_PINCODE
 *
 * Run from frontend:
 *   node --env-file=.env.local scripts/create-admin.mjs
 *
 * The PIN is hashed in memory and is never logged or written directly to a
 * table. This script is intentionally separate from the public registration
 * route; public registration accepts only farmer and owner roles.
 */

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const WEAK_PINS = new Set(["000000", "111111", "123456", "654321"]);

function normalizeIndianPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  const nationalNumber = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(nationalNumber) ? `+91${nationalNumber}` : null;
}

function isWeakPin(value) {
  if (WEAK_PINS.has(value) || /^([0-9])\1{5}$/.test(value)) return true;
  const digits = value.split("").map(Number);
  return digits.every((digit, index) => index === 0 || digit === digits[index - 1] + 1)
    || digits.every((digit, index) => index === 0 || digit === digits[index - 1] - 1);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const phone = normalizeIndianPhone(process.env.ADMIN_PHONE);
  const pin = String(process.env.ADMIN_PIN ?? "");
  const fullName = String(process.env.ADMIN_NAME ?? "").trim();
  const language = process.env.ADMIN_LANGUAGE === "te" ? "te" : "en";
  const city = String(process.env.ADMIN_CITY ?? "").trim();
  const pincode = String(process.env.ADMIN_PINCODE ?? "");

  if (!url || !serviceKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  if (!phone) throw new Error("ADMIN_PHONE must be a valid Indian mobile number");
  if (!/^\d{6}$/.test(pin) || isWeakPin(pin)) throw new Error("ADMIN_PIN must be a strong 6-digit PIN");
  if (!fullName) throw new Error("ADMIN_NAME is required");
  if (pincode && !/^\d{6}$/.test(pincode)) throw new Error("ADMIN_PINCODE must be empty or 6 digits");

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const pinHash = await bcrypt.hash(pin, 12);
  const { data, error } = await supabase.rpc("create_mandalrent_account", {
    p_profile_id: randomUUID(),
    p_full_name: fullName,
    p_phone: phone,
    p_role: "admin",
    p_preferred_language: language,
    p_city: city,
    p_pincode: pincode,
    p_district_id: null,
    p_mandal_id: null,
    p_village_id: null,
    p_pin_hash: pinHash,
  });
  if (error) {
    if (error.code === "23505" || error.message.includes("ACCOUNT_EXISTS")) {
      throw new Error("An account with this mobile number already exists; no admin account was created.");
    }
    throw error;
  }
  if (!data?.id) throw new Error("The database did not return the created admin profile");
  console.log(`Admin account ready for mobile ending ${phone.slice(-4)}. Sign in at /login, then open /admin.`);
}

main().catch((error) => {
  console.error(`Admin provisioning failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
});
