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

  useEffect(() => {
    fetch("/api/locations?level=districts")
      .then((response) => response.json())
      .then((data) => setDistricts(data.items ?? []));
  }, []);

  useEffect(() => {
    if (!current.districtCode) return;
    fetch(`/api/locations?level=mandals&districtId=${current.districtCode}`)
      .then((response) => response.json())
      .then((data) => setMandals(data.items ?? []));
  }, [current.districtCode]);

  useEffect(() => {
    if (!current.districtCode || !current.mandalCode) return;
    fetch(`/api/locations?level=villages&districtId=${current.districtCode}&mandalId=${current.mandalCode}`)
      .then((response) => response.json())
      .then((data) => setVillages(data.items ?? []));
  }, [current.districtCode, current.mandalCode]);

  const columnClass = compact ? "location-field location-field--compact" : "location-field";
  const chosenDistrict = useMemo(() => districts.find((item) => item.code === current.districtCode), [districts, current.districtCode]);

  return (
    <div className="location-grid">
      <Field className={columnClass}>
        <FieldLabel htmlFor="district">జిల్లా <span>District</span></FieldLabel>
        <select
          id="district"
          value={current.districtCode}
          onChange={(event) => {
            const selected = districts.find((item) => item.code === event.target.value);
            onChange({ ...emptyLocation, districtCode: event.target.value, district: selected?.name ?? "" });
          }}
        >
          <option value="">జిల్లా ఎంచుకోండి</option>
          {districts.map((item) => <option key={item.code} value={item.code}>{item.name} ({item.count})</option>)}
        </select>
      </Field>
      <Field className={columnClass}>
        <FieldLabel htmlFor="mandal">మండలం <span>Mandal</span></FieldLabel>
        <select
          id="mandal"
          disabled={!chosenDistrict}
          value={current.mandalCode}
          onChange={(event) => {
            const selected = mandals.find((item) => item.code === event.target.value);
            onChange({ ...current, mandalCode: event.target.value, mandal: selected?.name ?? "", villageCode: "", village: "" });
          }}
        >
          <option value="">మండలం ఎంచుకోండి</option>
          {mandals.map((item) => <option key={item.code} value={item.code}>{item.name} ({item.count})</option>)}
        </select>
      </Field>
      <Field className={columnClass}>
        <FieldLabel htmlFor="village">గ్రామం <span>Village</span></FieldLabel>
        <div className="select-with-icon">
          <MapPin aria-hidden="true" />
          <select
            id="village"
            disabled={!current.mandalCode}
            value={current.villageCode}
            onChange={(event) => {
              const selected = villages.find((item) => item.code === event.target.value);
              onChange({ ...current, villageCode: event.target.value, village: selected?.name ?? "" });
            }}
          >
            <option value="">గ్రామం ఎంచుకోండి</option>
            {villages.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </div>
      </Field>
    </div>
  );
}
