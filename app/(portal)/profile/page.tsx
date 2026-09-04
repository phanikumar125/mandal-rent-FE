"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MapPin, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "../../_components/language-toggle";
import {
  readSessionProfile,
  saveSessionProfile,
  type ProfileSession,
} from "../../_data/session";

type LocationItem = { code: string; name: string; count?: number };
type ApiProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: "farmer" | "owner" | "admin";
  preferred_language: "en" | "te";
  city: string;
  pincode: string;
  district_id: string | null;
  mandal_id: string | null;
  village_id: string | null;
  district?: string;
  mandal?: string;
  village?: string;
};

export default function ProfilePage() {
  const { language, toggleLanguage, setLanguage } = useLanguage();
  const [savedProfile, setSavedProfile] = useState<ProfileSession>(() =>
    readSessionProfile(),
  );
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [role, setRole] = useState<"farmer" | "owner">("farmer");
  const [districtId, setDistrictId] = useState("");
  const [district, setDistrict] = useState("");
  const [mandalId, setMandalId] = useState("");
  const [mandal, setMandal] = useState("");
  const [villageId, setVillageId] = useState("");
  const [village, setVillage] = useState("");
  const [landSize, setLandSize] = useState("");
  const [cropType, setCropType] = useState("");
  const [machineryNeed, setMachineryNeed] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [machineCount, setMachineCount] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [mandals, setMandals] = useState<LocationItem[]>([]);
  const [villages, setVillages] = useState<LocationItem[]>([]);
  const [loadedMandalDistrictId, setLoadedMandalDistrictId] = useState("");
  const [loadedVillageMandalId, setLoadedVillageMandalId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const [profileResponse, districtsResponse] = await Promise.all([
          fetch("/api/profile", { cache: "no-store" }),
          fetch("/api/locations?level=districts", { cache: "no-store" }),
        ]);
        if (!profileResponse.ok || !districtsResponse.ok)
          throw new Error("Unable to load profile");
        const profileData = (await profileResponse.json()) as {
          profile: ApiProfile;
        };
        const districtsData = (await districtsResponse.json()) as {
          items?: LocationItem[];
        };
        if (!active) return;
        const remote = profileData.profile;
        const local = readSessionProfile();
        setSavedProfile(local);
        setFullName(remote.full_name || local.fullName);
        setPhone(remote.phone ?? local.phone);
        setCity(remote.city);
        setPincode(remote.pincode);
        setRole(remote.role === "owner" ? "owner" : "farmer");
        setDistrictId(remote.district_id ?? local.districtId ?? "");
        setDistrict(remote.district ?? local.district);
        setMandalId(remote.mandal_id ?? local.mandalId ?? "");
        setMandal(remote.mandal ?? local.mandal);
        setVillageId(remote.village_id ?? local.villageId ?? "");
        setVillage(remote.village ?? local.village);
        setLandSize(local.farmerProfile?.landSize ?? "");
        setCropType(local.farmerProfile?.cropType ?? "");
        setMachineryNeed(local.farmerProfile?.machineryNeed ?? "");
        setEquipmentType(local.ownerProfile?.equipmentType ?? "");
        setMachineCount(local.ownerProfile?.machineCount ?? "");
        setServiceArea(local.ownerProfile?.serviceArea ?? "");
        setDistricts(districtsData.items ?? []);
      } catch {
        toast.error("Unable to load your profile details");
      }
    }
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!districtId) return;
    const controller = new AbortController();
    fetch(
      `/api/locations?level=mandals&districtId=${encodeURIComponent(districtId)}`,
      { signal: controller.signal },
    )
      .then((response) => response.json())
      .then((data) => {
        setMandals(data.items ?? []);
        setLoadedMandalDistrictId(districtId);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [districtId]);

  useEffect(() => {
    if (!districtId || !mandalId) return;
    const controller = new AbortController();
    fetch(
      `/api/locations?level=villages&districtId=${encodeURIComponent(districtId)}&mandalId=${encodeURIComponent(mandalId)}`,
      { signal: controller.signal },
    )
      .then((response) => response.json())
      .then((data) => {
        setVillages(data.items ?? []);
        setLoadedVillageMandalId(mandalId);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [districtId, mandalId]);

  const mandalOptions = useMemo(
    () => (loadedMandalDistrictId === districtId ? mandals : []),
    [districtId, loadedMandalDistrictId, mandals],
  );
  const villageOptions = useMemo(
    () => (loadedVillageMandalId === mandalId ? villages : []),
    [loadedVillageMandalId, mandalId, villages],
  );
  const isTelugu = language === "te";
  const text = {
    title: isTelugu ? "Profile and location" : "Profile and location",
    subtitle: isTelugu
      ? "Update your account details"
      : "Set up your account details",
    toggle: isTelugu ? "English" : "తెలుగు",
    name: isTelugu ? "Full name" : "Full name",
    phone: isTelugu ? "Phone number" : "Phone number",
    city: isTelugu ? "City" : "City",
    pincode: isTelugu ? "Pincode" : "Pincode",
    role: isTelugu ? "You are" : "You are",
    language: isTelugu ? "Language" : "Language",
    district: isTelugu ? "District" : "District",
    mandal: isTelugu ? "Mandal" : "Mandal",
    village: isTelugu ? "Village" : "Village",
    farmer: isTelugu ? "Farmer" : "Farmer",
    owner: isTelugu ? "Owner" : "Equipment owner",
    save: "Save profile details",
    saved: "Profile details saved",
    location: "Saved location",
    summary: "Account summary",
    noLocation: "Select your farm location",
  };

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim()) return toast.error("Full name is required");
    if (!/^\d{6}$/.test(pincode))
      return toast.error("Pincode must be 6 digits");
    if (!districtId || !mandalId || !villageId)
      return toast.error("Select a valid district, mandal, and village");
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          city,
          pincode,
          language,
          districtId,
          mandalId,
          villageId,
        }),
      });
      const data = (await response.json()) as {
        profile?: ApiProfile;
        message?: string;
      };
      if (!response.ok || !data.profile)
        throw new Error(data.message ?? "Unable to save profile");
      const actualRole = data.profile.role === "owner" ? "owner" : "farmer";
      const updated = saveSessionProfile({
        authenticated: savedProfile.authenticated,
        role: actualRole,
        fullName: fullName.trim(),
        phone,
        city: city.trim(),
        pincode,
        language,
        districtId,
        district,
        mandalId,
        mandal,
        villageId,
        village,
        farmerProfile:
          role === "farmer" ? { landSize, cropType, machineryNeed } : undefined,
        ownerProfile:
          role === "owner"
            ? { equipmentType, machineCount, serviceArea }
            : undefined,
        entryType: savedProfile.entryType,
      });
      setSavedProfile(updated);
      setSaved(true);
      toast.success(text.saved);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save your profile",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="profile-page" onSubmit={handleSave}>
      <section className="profile-main-card">
        <div className="profile-heading">
          <div>
            <p className="eyebrow">{text.title}</p>
            <h1>{text.subtitle}</h1>
          </div>
          <button
            type="button"
            className="profile-language-button"
            onClick={toggleLanguage}
          >
            {text.toggle}
          </button>
        </div>
        <Card className="profile-location-banner">
          <CardContent>
            <span className="profile-banner-icon">
              <MapPin size={19} />
            </span>
            <div>
              <p>Location details</p>
              <strong>
                {district && mandal && village
                  ? `${village} / ${mandal} / ${district}`
                  : text.noLocation}
              </strong>
              <small>
                Your location controls which nearby equipment is shown.
              </small>
            </div>
          </CardContent>
        </Card>
        <div className="profile-form-grid">
          <label className="profile-field">
            <span>{text.name}</span>
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
          <label className="profile-field">
            <span>{text.phone}</span>
            <Input value={phone} readOnly />
          </label>
          <label className="profile-field">
            <span>{text.city}</span>
            <Input
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </label>
          <label className="profile-field">
            <span>{text.pincode}</span>
            <Input
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(event) =>
                setPincode(event.target.value.replace(/\D/g, ""))
              }
            />
          </label>
          <label className="profile-field">
            <span>{text.role}</span>
            <select
              value={role}
              disabled
            >
              <option value="farmer">{text.farmer}</option>
              <option value="owner">{text.owner}</option>
            </select>
          </label>
          <label className="profile-field">
            <span>{text.language}</span>
            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as "en" | "te")
              }
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
            </select>
          </label>
        </div>
        <div className="profile-section-label">
          <UserRound size={18} />
          <h2>{role === "farmer" ? "Farmer details" : "Owner details"}</h2>
        </div>
        <div className="profile-form-grid profile-form-grid--three">
          {role === "farmer" ? (
            <>
              <label className="profile-field">
                <span>Land size</span>
                <Input
                  value={landSize}
                  onChange={(event) => setLandSize(event.target.value)}
                />
              </label>
              <label className="profile-field">
                <span>Crop type</span>
                <Input
                  value={cropType}
                  onChange={(event) => setCropType(event.target.value)}
                />
              </label>
              <label className="profile-field">
                <span>Machinery need</span>
                <Input
                  value={machineryNeed}
                  onChange={(event) => setMachineryNeed(event.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <label className="profile-field">
                <span>Equipment type</span>
                <Input
                  value={equipmentType}
                  onChange={(event) => setEquipmentType(event.target.value)}
                />
              </label>
              <label className="profile-field">
                <span>Machine count</span>
                <Input
                  value={machineCount}
                  onChange={(event) => setMachineCount(event.target.value)}
                />
              </label>
              <label className="profile-field">
                <span>Service area</span>
                <Input
                  value={serviceArea}
                  onChange={(event) => setServiceArea(event.target.value)}
                />
              </label>
            </>
          )}
        </div>
        <div className="profile-section-label">
          <MapPin size={18} />
          <h2>Farm location</h2>
        </div>
        <div className="profile-form-grid profile-form-grid--three">
          <label className="profile-field">
            <span>{text.district}</span>
            <select
              value={districtId}
              onChange={(event) => {
                const item = districts.find(
                  (entry) => entry.code === event.target.value,
                );
                setDistrictId(event.target.value);
                setDistrict(item?.name ?? "");
                setMandalId("");
                setMandal("");
                setVillageId("");
                setVillage("");
              }}
            >
              <option value="">Select district</option>
              {districts.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="profile-field">
            <span>{text.mandal}</span>
            <select
              value={mandalId}
              disabled={!districtId}
              onChange={(event) => {
                const item = mandalOptions.find(
                  (entry) => entry.code === event.target.value,
                );
                setMandalId(event.target.value);
                setMandal(item?.name ?? "");
                setVillageId("");
                setVillage("");
              }}
            >
              <option value="">Select mandal</option>
              {mandalOptions.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="profile-field">
            <span>{text.village}</span>
            <select
              value={villageId}
              disabled={!mandalId}
              onChange={(event) => {
                const item = villageOptions.find(
                  (entry) => entry.code === event.target.value,
                );
                setVillageId(event.target.value);
                setVillage(item?.name ?? "");
              }}
            >
              <option value="">Select village</option>
              {villageOptions.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="profile-save-row">
          <span>
            {saved ? (
              <>
                <Check size={16} /> {text.saved}
              </>
            ) : (
              "Changes are saved to your MandalRent profile."
            )}
          </span>
          <button
            type="submit"
            className="profile-save-button"
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving..." : text.save}
          </button>
        </div>
      </section>
      <aside className="profile-sidebar">
        <Card>
          <CardHeader>
            <p className="eyebrow">{text.summary}</p>
            <CardTitle>What this profile enables</CardTitle>
          </CardHeader>
          <CardContent className="profile-summary-list">
            <p>Personalized equipment discovery near your saved location.</p>
            <p>Farmer and owner access in one account.</p>
            <p>English and Telugu language preference.</p>
            <p>Mobile number remains protected as your login identity.</p>
          </CardContent>
        </Card>
        <Card className="profile-saved-card">
          <CardHeader>
            <p className="eyebrow">{text.location}</p>
            <CardTitle>Your saved details</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <small>Full name</small>
              <strong>{fullName || "Not added"}</strong>
            </div>
            <div>
              <small>Role</small>
              <strong>{role === "farmer" ? text.farmer : text.owner}</strong>
            </div>
            <div>
              <small>Location</small>
              <strong>
                {district && mandal && village
                  ? `${district} / ${mandal} / ${village}`
                  : text.noLocation}
              </strong>
            </div>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
