"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";

type Item = { code: string; name: string; count?: number };

export type LocationValue = {
  districtCode: string;
  district: string;
  mandalCode: string;
  mandal: string;
  villageCode: string;
  village: string;
};

const emptyLocation: LocationValue = {
  districtCode: "",
  district: "",
  mandalCode: "",
  mandal: "",
  villageCode: "",
  village: "",
};

export function LocationPicker({
  value,
  onChange,
  compact = false,
}: {
  value?: LocationValue;
  onChange: (value: LocationValue) => void;
  compact?: boolean;
}) {
  const current = value ?? emptyLocation;
  const [districts, setDistricts] = useState<Item[]>([]);
  const [mandals, setMandals] = useState<Item[]>([]);
  const [villages, setVillages] = useState<Item[]>([]);
  const [mandalDistrictCode, setMandalDistrictCode] = useState("");
  const [villageMandalCode, setVillageMandalCode] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/locations?level=districts", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setDistricts(data.items ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!current.districtCode) return;
    const controller = new AbortController();
    fetch(`/api/locations?level=mandals&districtId=${current.districtCode}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        setMandals(data.items ?? []);
        setMandalDistrictCode(current.districtCode);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [current.districtCode]);

  useEffect(() => {
    if (!current.districtCode || !current.mandalCode) return;
    const controller = new AbortController();
    fetch(
      `/api/locations?level=villages&districtId=${current.districtCode}&mandalId=${current.mandalCode}`,
      { signal: controller.signal },
    )
      .then((response) => response.json())
      .then((data) => {
        setVillages(data.items ?? []);
        setVillageMandalCode(current.mandalCode);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [current.districtCode, current.mandalCode]);

  const columnClass = compact
    ? "location-field location-field--compact"
    : "location-field";
  const chosenDistrict = useMemo(
    () => districts.find((item) => item.code === current.districtCode),
    [districts, current.districtCode],
  );
  const availableMandals =
    mandalDistrictCode === current.districtCode ? mandals : [];
  const availableVillages =
    villageMandalCode === current.mandalCode ? villages : [];

  return (
    <div className="location-grid">
      <Field className={columnClass}>
        <FieldLabel htmlFor="district">
          జిల్లా <span>District</span>
        </FieldLabel>
        <select
          id="district"
          value={current.districtCode}
          onChange={(event) => {
            const selected = districts.find(
              (item) => item.code === event.target.value,
            );
            onChange({
              ...emptyLocation,
              districtCode: event.target.value,
              district: selected?.name ?? "",
            });
          }}
        >
          <option value="">జిల్లా ఎంచుకోండి</option>
          {districts.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name} ({item.count})
            </option>
          ))}
        </select>
      </Field>
      <Field className={columnClass}>
        <FieldLabel htmlFor="mandal">
          మండలం <span>Mandal</span>
        </FieldLabel>
        <select
          id="mandal"
          disabled={!chosenDistrict}
          value={current.mandalCode}
          onChange={(event) => {
            const selected = mandals.find(
              (item) => item.code === event.target.value,
            );
            onChange({
              ...current,
              mandalCode: event.target.value,
              mandal: selected?.name ?? "",
              villageCode: "",
              village: "",
            });
          }}
        >
          <option value="">మండలం ఎంచుకోండి</option>
          {availableMandals.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name} ({item.count})
            </option>
          ))}
        </select>
      </Field>
      <Field className={columnClass}>
        <FieldLabel htmlFor="village">
          గ్రామం <span>Village</span>
        </FieldLabel>
        <div className="select-with-icon">
          <MapPin aria-hidden="true" />
          <select
            id="village"
            disabled={!current.mandalCode}
            value={current.villageCode}
            onChange={(event) => {
              const selected = villages.find(
                (item) => item.code === event.target.value,
              );
              onChange({
                ...current,
                villageCode: event.target.value,
                village: selected?.name ?? "",
              });
            }}
          >
            <option value="">గ్రామం ఎంచుకోండి</option>
            {availableVillages.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </Field>
    </div>
  );
}
