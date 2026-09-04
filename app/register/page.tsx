"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Languages, Tractor, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  isValidPin,
  isWeakPin,
  normalizeIndianPhone,
} from "@/lib/auth-validation";
import { saveSessionProfile, type SessionRole } from "@/app/_data/session";
import { useLanguage } from "@/app/_components/language-toggle";

const registerHeroImage =
  "https://images.unsplash.com/photo-1703922055661-2168ea8b80a9?auto=format&fit=crop&w=1600&q=85";

type LocationItem = { code: string; name: string; count?: number };

const copy = {
  en: {
    eyebrow: "Create your MandalRent account",
    title: "Register",
    intro: "Your location helps us show the nearest equipment.",
    name: "Full name",
    city: "City",
    district: "District",
    mandal: "Mandal",
    village: "Village",
    pincode: "Pincode",
    phone: "Mobile number",
    pin: "Create a 6-digit PIN",
    confirmPin: "Confirm PIN",
    farmer: "Farmer",
    owner: "Equipment owner",
    submit: "Create account",
    login: "Already have an account? Login",
    language: "తెలుగు",
    selectDistrict: "Select district",
    selectMandal: "Select mandal",
    selectVillage: "Select village",
    loading: "Loading...",
  },
  te: {
    eyebrow: "మండల్‌రెంట్ ఖాతా సృష్టించండి",
    title: "నమోదు",
    intro: "మీ దగ్గరలోని పరికరాలను చూపించడానికి మీ ప్రాంత వివరాలు ఉపయోగపడతాయి.",
    name: "పూర్తి పేరు",
    city: "నగరం",
    district: "జిల్లా",
    mandal: "మండలం",
    village: "గ్రామం",
    pincode: "పిన్‌కోడ్",
    phone: "మొబైల్ నంబర్",
    pin: "6 అంకెల PIN సృష్టించండి",
    confirmPin: "PIN నిర్ధారించండి",
    farmer: "రైతు",
    owner: "యంత్ర యజమాని",
    submit: "ఖాతా సృష్టించండి",
    login: "ఇప్పటికే ఖాతా ఉందా? లాగిన్",
    language: "English",
    selectDistrict: "జిల్లాను ఎంచుకోండి",
    selectMandal: "మండలాన్ని ఎంచుకోండి",
    selectVillage: "గ్రామాన్ని ఎంచుకోండి",
    loading: "లోడ్ అవుతోంది...",
  },
} as const;

export default function RegisterPage() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const text = copy[language];
  const [role, setRole] = useState<SessionRole>("farmer");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [district, setDistrict] = useState("");
  const [mandalCode, setMandalCode] = useState("");
  const [mandal, setMandal] = useState("");
  const [villageCode, setVillageCode] = useState("");
  const [village, setVillage] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [mandals, setMandals] = useState<LocationItem[]>([]);
  const [villages, setVillages] = useState<LocationItem[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingMandals, setLoadingMandals] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    async function loadDistricts() {
      setLoadingDistricts(true);
      try {
        const response = await fetch("/api/locations?level=districts");
        if (!response.ok) throw new Error("Unable to load districts");
        const data = (await response.json()) as { items?: LocationItem[] };
        setDistricts(data.items ?? []);
      } catch {
        toast.error("Unable to load districts");
      } finally {
        setLoadingDistricts(false);
      }
    }
    void loadDistricts();
  }, []);

  useEffect(() => {
    if (!districtCode) return;
    async function loadMandals() {
      setLoadingMandals(true);
      try {
        const response = await fetch(
          `/api/locations?level=mandals&districtId=${encodeURIComponent(districtCode)}`,
        );
        if (!response.ok) throw new Error("Unable to load mandals");
        const data = (await response.json()) as { items?: LocationItem[] };
        setMandals(data.items ?? []);
      } catch {
        toast.error("Unable to load mandals");
      } finally {
        setLoadingMandals(false);
      }
    }
    void loadMandals();
  }, [districtCode]);

  useEffect(() => {
    if (!districtCode || !mandalCode) return;
    async function loadVillages() {
      setLoadingVillages(true);
      try {
        const response = await fetch(
          `/api/locations?level=villages&districtId=${encodeURIComponent(districtCode)}&mandalId=${encodeURIComponent(mandalCode)}`,
        );
        if (!response.ok) throw new Error("Unable to load villages");
        const data = (await response.json()) as { items?: LocationItem[] };
        setVillages(data.items ?? []);
      } catch {
        toast.error("Unable to load villages");
      } finally {
        setLoadingVillages(false);
      }
    }
    void loadVillages();
  }, [districtCode, mandalCode]);

  async function register() {
    const normalizedPhone = normalizeIndianPhone(phone);
    if (!fullName.trim()) return toast.error("Full name is required");
    if (!normalizedPhone) return toast.error("Invalid mobile number");
    if (!district) return toast.error("Please select a district");
    if (!mandal) return toast.error("Please select a mandal");
    if (!village) return toast.error("Please select a village");
    if (!city.trim()) return toast.error("City is required");
    if (!/^\d{6}$/.test(pincode))
      return toast.error("Pincode must be 6 digits");
    if (!isValidPin(pin)) return toast.error("PIN must be 6 digits");
    if (isWeakPin(pin)) return toast.error("Choose a less predictable PIN");
    if (pin !== confirmPin) return toast.error("PINs do not match");

    setWorking(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          pin,
          confirmPin,
          fullName: fullName.trim(),
          role,
          language,
          city: city.trim(),
          pincode,
          districtCode,
          mandalCode,
          villageCode,
        }),
      });
      const result = (await response.json()) as {
        profile?: Record<string, unknown>;
        error?: string;
        message?: string;
      };
      if (!response.ok || !result.profile) {
        return toast.error(
          result.error === "ACCOUNT_EXISTS"
            ? "Account already exists. Please login instead."
            : (result.message ?? "Unable to create your profile"),
        );
      }

      const profile = result.profile;
      saveSessionProfile({
        authenticated: true,
        entryType: "register",
        role: profile.role === "owner" ? "owner" : "farmer",
        fullName: String(profile.full_name ?? fullName),
        phone: String(profile.phone ?? normalizedPhone),
        city,
        pincode,
        district,
        mandal,
        village,
        language,
      });
      toast.success("Account created successfully");
      router.push(profile.role === "owner" ? "/owner" : "/dashboard");
    } catch {
      toast.error("Unable to create account");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-photo" aria-label="MandalRent registration">
        <img
          src={registerHeroImage}
          alt="Indian farmer working in a green agricultural field"
        />
        <div className="login-photo-overlay" />
        <Link href="/" className="photo-brand">
          <span className="brand-mark">
            <Tractor />
          </span>
          <span>
            Mandal<span>Rent</span>
          </span>
        </Link>
        <div className="photo-copy">
          <span className="eyebrow-light">{text.eyebrow}</span>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <button
            type="button"
            className="language-button"
            onClick={toggleLanguage}
          >
            <Languages size={18} /> {text.language}
          </button>
          <p className="eyebrow">MandalRent</p>
          <h2>{text.title}</h2>
          <p className="login-intro">{text.intro}</p>
          <FieldGroup className="login-fields">
            <Field>
              <FieldLabel htmlFor="register-phone">{text.phone}</FieldLabel>
              <div className="phone-input">
                <span>+91</span>
                <Input
                  id="register-phone"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
            </Field>
            <div className="two-fields">
              <Field>
                <FieldLabel htmlFor="pin">{text.pin}</FieldLabel>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="new-password"
                  value={pin}
                  onChange={(event) =>
                    setPin(event.target.value.replace(/\D/g, ""))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-pin">{text.confirmPin}</FieldLabel>
                <Input
                  id="confirm-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="new-password"
                  value={confirmPin}
                  onChange={(event) =>
                    setConfirmPin(event.target.value.replace(/\D/g, ""))
                  }
                />
              </Field>
            </div>
            <ToggleGroup
              value={[role]}
              onValueChange={(values) =>
                values[0] && setRole(values[0] as SessionRole)
              }
              className="role-toggle"
              spacing={10}
            >
              <ToggleGroupItem value="farmer" className="role-choice">
                <span className="role-icon">
                  <UserRound />
                </span>
                <strong>{text.farmer}</strong>
              </ToggleGroupItem>
              <ToggleGroupItem value="owner" className="role-choice">
                <span className="role-icon">
                  <Tractor />
                </span>
                <strong>{text.owner}</strong>
              </ToggleGroupItem>
            </ToggleGroup>
            <Field>
              <FieldLabel htmlFor="full-name">{text.name}</FieldLabel>
              <Input
                id="full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="district">{text.district}</FieldLabel>
              <select
                id="district"
                value={districtCode}
                onChange={(event) => {
                  const item = districts.find(
                    (entry) => entry.code === event.target.value,
                  );
                  setDistrictCode(event.target.value);
                  setDistrict(item?.name ?? "");
                  setMandalCode("");
                  setMandal("");
                  setVillageCode("");
                  setVillage("");
                  setMandals([]);
                  setVillages([]);
                }}
                disabled={loadingDistricts}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">
                  {loadingDistricts ? text.loading : text.selectDistrict}
                </option>
                {districts.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="mandal">{text.mandal}</FieldLabel>
              <select
                id="mandal"
                value={mandalCode}
                onChange={(event) => {
                  const item = mandals.find(
                    (entry) => entry.code === event.target.value,
                  );
                  setMandalCode(event.target.value);
                  setMandal(item?.name ?? "");
                  setVillageCode("");
                  setVillage("");
                  setVillages([]);
                }}
                disabled={!districtCode || loadingMandals}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">
                  {loadingMandals ? text.loading : text.selectMandal}
                </option>
                {mandals.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="village">{text.village}</FieldLabel>
              <select
                id="village"
                value={villageCode}
                onChange={(event) => {
                  const item = villages.find(
                    (entry) => entry.code === event.target.value,
                  );
                  setVillageCode(event.target.value);
                  setVillage(item?.name ?? "");
                }}
                disabled={!mandalCode || loadingVillages}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">
                  {loadingVillages ? text.loading : text.selectVillage}
                </option>
                {villages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="two-fields">
              <Field>
                <FieldLabel htmlFor="city">{text.city}</FieldLabel>
                <Input
                  id="city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="pincode">{text.pincode}</FieldLabel>
                <Input
                  id="pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(event) =>
                    setPincode(event.target.value.replace(/\D/g, ""))
                  }
                />
              </Field>
            </div>
            <ShimmerButton
              type="button"
              onClick={register}
              disabled={working}
              background="#075b2b"
              className="login-submit"
            >
              {working ? "…" : text.submit}
            </ShimmerButton>
          </FieldGroup>
          <div className="secure-note">
            <Link href="/login">{text.login}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
