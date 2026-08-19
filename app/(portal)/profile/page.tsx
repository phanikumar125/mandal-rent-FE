"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "../../_components/language-toggle";
import {
  districtLocations,
  getMandals,
  getVillages,
} from "../../_data/mandalrent";
import { readSessionProfile, saveSessionProfile } from "../../_data/session";

export default function ProfilePage() {
  const { language: uiLanguage, toggleLanguage, setLanguage } = useLanguage();
  const savedProfile = useMemo(() => readSessionProfile(), []);
  const [district, setDistrict] = useState(savedProfile.district);
  const [mandal, setMandal] = useState(savedProfile.mandal);
  const [village, setVillage] = useState(savedProfile.village);
  const [role, setRole] = useState<"farmer" | "owner">(savedProfile.role);
  const [fullName, setFullName] = useState(
    savedProfile.fullName || "Anil Reddy",
  );
  const [phone, setPhone] = useState(savedProfile.phone || "9876543210");
  const [landSize, setLandSize] = useState(
    savedProfile.farmerProfile?.landSize ?? "",
  );
  const [cropType, setCropType] = useState(
    savedProfile.farmerProfile?.cropType ?? "",
  );
  const [machineryNeed, setMachineryNeed] = useState(
    savedProfile.farmerProfile?.machineryNeed ?? "",
  );
  const [equipmentType, setEquipmentType] = useState(
    savedProfile.ownerProfile?.equipmentType ?? "",
  );
  const [machineCount, setMachineCount] = useState(
    savedProfile.ownerProfile?.machineCount ?? "",
  );
  const [serviceArea, setServiceArea] = useState(
    savedProfile.ownerProfile?.serviceArea ?? "",
  );

  const mandalOptions = useMemo(() => getMandals(district), [district]);
  const villageOptions = useMemo(
    () => getVillages(district, mandal),
    [district, mandal],
  );

  function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveSessionProfile({
      role,
      fullName,
      phone,
      language: uiLanguage,
      district,
      mandal,
      village,
      entryType: "register",
      farmerProfile:
        role === "farmer" ? { landSize, cropType, machineryNeed } : undefined,
      ownerProfile:
        role === "owner"
          ? { equipmentType, machineCount, serviceArea }
          : undefined,
    });
  }

  const text =
    uiLanguage === "te"
      ? {
          title: "ప్రొఫైల్ మరియు స్థానం",
          subtitle: "మీ ఖాతా వివరాలను సెట్ చేయండి",
          toggle: "English",
          name: "పూర్తి పేరు",
          phone: "ఫోన్ నంబర్",
          role: "మీరు ఎవరు",
          language: "భాష",
          district: "జిల్లా",
          mandal: "మండలం",
          village: "గ్రామం",
          locationCardTitle: "ఎంచుకున్న స్థానం",
          summaryTitle: "ఖాతా సారాంశం",
          savedTitle: "సేవ్ చేసిన సెట్టింగ్స్",
          locationTitle: "స్థానం వివరాలు",
          summaryItems: [
            "రైతు, యజమాని, మరియు లిస్టింగ్‌ల కోసం పాత్ర ఆధారిత access.",
            "English మరియు తెలుగు UI preference.",
            "స్థానాన్ని బట్టి machinery discovery మరియు enquiry routing.",
            "తర్వాత Supabase sync ద్వారా profile persistence.",
          ],
          roleOptions: { farmer: "రైతు", owner: "యజమాని" },
          languageOptions: { en: "English", te: "తెలుగు" },
          locationMode: "తెలుగు మోడ్",
          dependentTitle: "Dependent selects పని చేస్తున్నాయి",
          dependentCopy:
            "జిల్లా, మండలం, గ్రామం fields కలిసి update అవుతాయి. ఇది location master data కి base.",
          profileSummary: "ఈ profile తో ఏం సాధ్యం",
          locationLabel: "స్థానం",
          languageLabel: "భాష",
          languageValue: "తెలుగు",
        }
      : {
          title: "Profile and location",
          subtitle: "Set up your account details",
          toggle: "తెలుగు",
          name: "Full name",
          phone: "Phone number",
          role: "You are",
          language: "Language",
          district: "District",
          mandal: "Mandal",
          village: "Village",
          locationCardTitle: "Saved location",
          summaryTitle: "Account summary",
          savedTitle: "Saved settings",
          locationTitle: "Location details",
          summaryItems: [
            "Role-based access for farmer and owner equipment flows.",
            "English and Telugu UI preference.",
            "Location-aware machinery discovery and enquiry routing.",
            "Future Supabase sync for persisted profiles.",
          ],
          roleOptions: { farmer: "Farmer", owner: "Owner" },
          languageOptions: { en: "English", te: "Telugu" },
          locationMode: "English mode",
          dependentTitle: "Dependent selects are wired",
          dependentCopy:
            "The district, mandal, and village fields update together, which is the base for location master data.",
          profileSummary: "What this profile enables",
          locationLabel: "Location",
          languageLabel: "Language",
          languageValue: "English",
        };

  return (
    <form
      className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"
      onSubmit={handleSaveProfile}
    >
      <section className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              {text.title}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">
              {text.subtitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold"
          >
            {text.toggle}
          </button>
        </div>

        <div className="mt-4 rounded-[24px] border border-[color:var(--line)] bg-[linear-gradient(135deg,_rgba(15,23,42,1),_rgba(51,65,85,1))] p-5 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
            {text.locationMode}
          </p>
          <h3 className="mt-2 text-lg font-black">{text.locationTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-white/80">
            {text.dependentCopy}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {text.name}
            </span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {text.phone}
            </span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-2 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {text.role}
            </span>
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as "farmer" | "owner")
              }
              className="mt-2 w-full bg-transparent text-sm outline-none"
            >
              <option value="farmer">{text.roleOptions.farmer}</option>
              <option value="owner">{text.roleOptions.owner}</option>
            </select>
          </label>
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {text.language}
            </span>
            <select
              value={uiLanguage}
              onChange={(event) =>
                setLanguage(event.target.value as "en" | "te")
              }
              className="mt-2 w-full bg-transparent text-sm outline-none"
            >
              <option value="en">{text.languageOptions.en}</option>
              <option value="te">{text.languageOptions.te}</option>
            </select>
          </label>
        </div>

        {role === "farmer" ? (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Land size
              </span>
              <input
                value={landSize}
                onChange={(event) => setLandSize(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm outline-none"
              />
            </label>
            <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Crop type
              </span>
              <input
                value={cropType}
                onChange={(event) => setCropType(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm outline-none"
              />
            </label>
            <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Machinery need
              </span>
              <input
                value={machineryNeed}
                onChange={(event) => setMachineryNeed(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm outline-none"
              />
            </label>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Equipment type
              </span>
              <input
                value={equipmentType}
                onChange={(event) => setEquipmentType(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm outline-none"
              />
            </label>
            <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Machine count
              </span>
              <input
                value={machineCount}
                onChange={(event) => setMachineCount(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm outline-none"
              />
            </label>
            <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Service area
              </span>
              <input
                value={serviceArea}
                onChange={(event) => setServiceArea(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm outline-none"
              />
            </label>
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {text.district}
            </span>
            <select
              value={district}
              onChange={(event) => {
                const nextDistrict = event.target.value;
                const nextMandal = getMandals(nextDistrict)[0]?.name ?? "";
                const nextVillage =
                  getVillages(nextDistrict, nextMandal)[0] ?? "";
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
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {text.mandal}
            </span>
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
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {text.village}
            </span>
            <select
              value={village}
              onChange={(event) => setVillage(event.target.value)}
              className="mt-2 w-full bg-transparent text-sm outline-none"
            >
              {villageOptions.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-[24px] border border-[color:var(--line)] bg-[color:var(--accent-soft)] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">
            {text.locationCardTitle}
          </p>
          <h3 className="mt-1 text-lg font-black">{text.dependentTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            {text.dependentCopy}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm"
          >
            Save profile details
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            {text.summaryTitle}
          </p>
          <h3 className="mt-1 text-xl font-black">{text.profileSummary}</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--muted)]">
            {text.summaryItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            {text.savedTitle}
          </p>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-[18px] bg-white px-4 py-3">
              <span className="block text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                {text.role}
              </span>
              <span className="mt-1 block font-semibold capitalize">
                {role}
              </span>
            </div>
            <div className="rounded-[18px] bg-white px-4 py-3">
              <span className="block text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                {text.locationLabel}
              </span>
              <span className="mt-1 block font-semibold">
                {district} / {mandal} / {village}
              </span>
            </div>
            <div className="rounded-[18px] bg-white px-4 py-3">
              <span className="block text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                {text.languageLabel}
              </span>
              <span className="mt-1 block font-semibold">
                {uiLanguage === "en"
                  ? text.languageOptions.en
                  : text.languageValue}
              </span>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}
