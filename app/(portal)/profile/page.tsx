"use client";

import { useMemo, useState } from "react";
import { districtLocations, getMandals, getVillages, languagePhrases } from "../../_data/mandalrent";

export default function ProfilePage() {
  const [language, setLanguage] = useState<"en" | "te">("en");
  const [district, setDistrict] = useState("Krishna");
  const [mandal, setMandal] = useState("Kanchikacherla");
  const [village, setVillage] = useState("Moguluru");
  const [role, setRole] = useState("farmer");

  const mandalOptions = useMemo(() => getMandals(district), [district]);
  const villageOptions = useMemo(() => getVillages(district, mandal), [district, mandal]);
  const copy = languagePhrases[language];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Profile and location</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Set up your account details</h2>
          </div>
          <button
            type="button"
            onClick={() => setLanguage((current) => (current === "en" ? "te" : "en"))}
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold"
          >
            {language === "en" ? "Switch to Telugu mode" : "Switch to English"}
          </button>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
          {copy.subtitle}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Full name</span>
            <input defaultValue="Anil Reddy" className="mt-2 w-full bg-transparent text-sm outline-none" />
          </label>
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Phone</span>
            <input defaultValue="9876543210" className="mt-2 w-full bg-transparent text-sm outline-none" />
          </label>
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Role</span>
            <select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 w-full bg-transparent text-sm outline-none">
              <option value="farmer">Farmer</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Preferred language</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value as "en" | "te")} className="mt-2 w-full bg-transparent text-sm outline-none">
              <option value="en">English</option>
              <option value="te">Telugu</option>
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">District</span>
            <select
              value={district}
              onChange={(event) => {
                const nextDistrict = event.target.value;
                const nextMandal = getMandals(nextDistrict)[0]?.name ?? "";
                const nextVillage = getVillages(nextDistrict, nextMandal)[0] ?? "";
                setDistrict(nextDistrict);
                setMandal(nextMandal);
                setVillage(nextVillage);
              }}
              className="mt-2 w-full bg-transparent text-sm outline-none"
            >
              {districtLocations.map((entry) => (
                <option key={entry.district}>{entry.district}</option>
              ))}
            </select>
          </label>
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Mandal</span>
            <select
              value={mandal}
              onChange={(event) => {
                const nextMandal = event.target.value;
                const nextVillage = getVillages(district, nextMandal)[0] ?? "";
                setMandal(nextMandal);
                setVillage(nextVillage);
              }}
              className="mt-2 w-full bg-transparent text-sm outline-none"
            >
              {mandalOptions.map((entry) => (
                <option key={entry.name}>{entry.name}</option>
              ))}
            </select>
          </label>
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Village</span>
            <select value={village} onChange={(event) => setVillage(event.target.value)} className="mt-2 w-full bg-transparent text-sm outline-none">
              {villageOptions.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-[24px] border border-[color:var(--line)] bg-[color:var(--accent-soft)] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">Location context</p>
          <h3 className="mt-1 text-lg font-black">Dependent selects are wired</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            The district, mandal, and village fields update together, which is the base we need for the PRD&apos;s
            location master data.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Account summary</p>
          <h3 className="mt-1 text-xl font-black">What this profile enables</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--muted)]">
            <li>Role-based dashboard access for farmer, owner, and admin flows.</li>
            <li>Language preference for English and Telugu-ready UI strings.</li>
            <li>Location-specific listings, search, and lead routing.</li>
            <li>Future Supabase sync for persisted profiles and settings.</li>
          </ul>
        </div>

        <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Saved configuration</p>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-[18px] bg-white px-4 py-3">
              <span className="block text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Role</span>
              <span className="mt-1 block font-semibold capitalize">{role}</span>
            </div>
            <div className="rounded-[18px] bg-white px-4 py-3">
              <span className="block text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Location</span>
              <span className="mt-1 block font-semibold">
                {district} / {mandal} / {village}
              </span>
            </div>
            <div className="rounded-[18px] bg-white px-4 py-3">
              <span className="block text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Language</span>
              <span className="mt-1 block font-semibold">{language === "en" ? "English" : "Telugu"}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
