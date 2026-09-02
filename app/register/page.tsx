"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Languages, Tractor, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  resetRecaptcha,
  sendPhoneOTP,
  verifyPhoneOTP,
} from "@/lib/firebase-auth";
import { saveSessionProfile, type SessionRole } from "@/app/_data/session";
import { useLanguage } from "@/app/_components/language-toggle";
import { log } from "console";

type LocationItem = {
  code: string;
  name: string;
  count?: number;
};

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
    farmer: "Farmer",
    owner: "Equipment owner",
    send: "Send OTP",
    verify: "Create account",
    change: "Change number",
    login: "Already have an account? Login",
    otp: "Enter the 6-digit OTP",
    language: "తెలుగు",
    selectDistrict: "Select district",
    selectMandal: "Select mandal",
    selectVillage: "Select village",
    loading: "Loading...",
  },

  te: {
    eyebrow: "మండల్‌రెంట్ ఖాతా సృష్టించండి",
    title: "నమోదు",
    intro:
      "మీకు దగ్గరలోని పరికరాలను చూపించడానికి మీ ప్రాంత వివరాలు ఉపయోగిస్తాము.",
    name: "పూర్తి పేరు",
    city: "నగరం",
    district: "జిల్లా",
    mandal: "మండలం",
    village: "గ్రామం",
    pincode: "పిన్‌కోడ్",
    phone: "మొబైల్ నంబర్",
    farmer: "రైతు",
    owner: "యంత్ర యజమాని",
    send: "OTP పంపండి",
    verify: "ఖాతా సృష్టించండి",
    change: "నంబర్ మార్చండి",
    login: "ఇప్పటికే ఖాతా ఉందా? లాగిన్",
    otp: "6 అంకెల OTP నమోదు చేయండి",
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

  // --------------------------------------------------
  // Registration fields
  // --------------------------------------------------

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

  const [otp, setOtp] = useState("");

  // --------------------------------------------------
  // Location dropdown data
  // --------------------------------------------------

  const [districts, setDistricts] = useState<LocationItem[]>([]);

  const [mandals, setMandals] = useState<LocationItem[]>([]);

  const [villages, setVillages] = useState<LocationItem[]>([]);

  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [loadingMandals, setLoadingMandals] = useState(false);

  const [loadingVillages, setLoadingVillages] = useState(false);

  // --------------------------------------------------
  // OTP state
  // --------------------------------------------------

  const [step, setStep] = useState<"details" | "otp">("details");

  const [working, setWorking] = useState(false);

  const [confirmationResult, setConfirmationResult] = useState<Awaited<
    ReturnType<typeof sendPhoneOTP>
  > | null>(null);

  // ==================================================
  // LOAD DISTRICTS
  // ==================================================

  useEffect(() => {
    async function loadDistricts() {
      setLoadingDistricts(true);

      try {
        const response = await fetch("/api/locations?level=districts");

        if (!response.ok) {
          throw new Error("Failed to load districts");
        }

        const data = await response.json();

        setDistricts(data.items ?? []);
      } catch (error) {
        console.error("District loading error:", error);

        toast.error(
          language === "te"
            ? "జిల్లాలను లోడ్ చేయలేకపోయాము"
            : "Unable to load districts",
        );
      } finally {
        setLoadingDistricts(false);
      }
    }

    loadDistricts();
  }, [language]);

  // ==================================================
  // LOAD MANDALS WHEN DISTRICT CHANGES
  // ==================================================

  useEffect(() => {
    setMandalCode("");
    setMandal("");
    setVillageCode("");
    setVillage("");
    setMandals([]);
    setVillages([]);

    if (!districtCode) return;

    async function loadMandals() {
      setLoadingMandals(true);

      try {
        const response = await fetch(
          `/api/locations?level=mandals&district=${encodeURIComponent(
            districtCode,
          )}`,
        );

        const data = await response.json();

        setMandals(data.items ?? []);
      } catch (error) {
        console.error("Mandal loading error:", error);
        toast.error("Unable to load mandals");
      } finally {
        setLoadingMandals(false);
      }
    }

    loadMandals();
  }, [districtCode]);

  // ==================================================
  // LOAD VILLAGES WHEN MANDAL CHANGES
  // ==================================================

  useEffect(() => {
    setVillageCode("");
    setVillage("");
    setVillages([]);

    if (!districtCode || !mandalCode) return;

    async function loadVillages() {
      setLoadingVillages(true);

      try {
        const response = await fetch(
          `/api/locations?level=villages&district=${encodeURIComponent(
            districtCode,
          )}&mandal=${encodeURIComponent(mandalCode)}`,
        );

        const data = await response.json();

        setVillages(data.items ?? []);
      } catch (error) {
        console.error("Village loading error:", error);
        toast.error("Unable to load villages");
      } finally {
        setLoadingVillages(false);
      }
    }

    loadVillages();
  }, [districtCode, mandalCode]);

  // ==================================================
  // SEND OTP
  // ==================================================

  //   console.log("SUPABASE URL:", process.env.local);
  // console.log(
  //   "SERVICE ROLE KEY EXISTS:",
  //   Boolean(supabaseServiceRoleKey)
  // );

  async function sendOtp() {
    const digits = phone.replace(/\D/g, "");

    if (
      !fullName.trim() ||
      !city.trim() ||
      !district ||
      !mandal ||
      !village ||
      !/^\d{6}$/.test(pincode)
    ) {
      return toast.error(
        language === "te"
          ? "పేరు, నగరం, జిల్లా, మండలం, గ్రామం మరియు 6 అంకెల పిన్‌కోడ్ పూర్తి చేయండి"
          : "Enter your name, city, district, mandal, village, and a 6-digit pincode",
      );
    }

    if (digits.length !== 10) {
      return toast.error(
        language === "te"
          ? "10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి"
          : "Enter a valid 10-digit mobile number",
      );
    }

    setWorking(true);

    try {
      const result = await sendPhoneOTP(
        `+91${digits}`,
        "register-recaptcha-container",
      );

      setConfirmationResult(result);
      setStep("otp");

      toast.success(
        language === "te" ? "OTP పంపబడింది" : "OTP sent successfully",
      );
    } catch (error) {
      console.error("Firebase registration OTP error:", error);

      toast.error(
        error instanceof Error ? error.message : "Unable to send OTP",
      );
    } finally {
      setWorking(false);
    }
  }

  // ==================================================
  // COMPLETE REGISTRATION
  // ==================================================

  async function completeRegistration() {
    if (otp.length !== 6) {
      return toast.error(
        language === "te"
          ? "6 అంకెల OTP నమోదు చేయండి"
          : "Enter the 6-digit OTP",
      );
    }

    if (!confirmationResult) {
      return toast.error(
        language === "te"
          ? "ముందుగా OTP పంపండి"
          : "Please request an OTP first",
      );
    }

    setWorking(true);

    try {
      // -----------------------------------------------
      // 1. Verify Firebase OTP
      // -----------------------------------------------

      const result = await verifyPhoneOTP(confirmationResult, otp);

      const firebaseUser = result.user;

      console.log("Firebase registration user:", firebaseUser);

      // -----------------------------------------------
      // 2. Get Firebase ID token
      // -----------------------------------------------

      const idToken = await firebaseUser.getIdToken();

      // -----------------------------------------------
      // 3. Send profile data to our API
      // -----------------------------------------------

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: "register",
          role,
          fullName,
          phone: `+91${phone.replace(/\D/g, "")}`,
          city,
          pincode,
          district,
          mandal,
          village,
          language,
        }),
      });

      const responseText = await response.text();

      console.log("PROFILE API STATUS:", response.status);
      console.log("PROFILE API RESPONSE:", responseText);

      let data: any = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.error("Invalid JSON from /api/profile:", error);
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Profile API failed with status ${response.status}`,
        );
      }

      console.log("PROFILE CREATED:", data);

      // -----------------------------------------------
      // 4. Handle API errors
      // -----------------------------------------------

      if (!response.ok) {
        if (data.error === "PROFILE_EXISTS") {
          toast.error(
            language === "te"
              ? "ఈ నంబర్‌తో ఖాతా ఇప్పటికే ఉంది. లాగిన్ చేయండి."
              : "An account already exists with this number. Please login.",
          );

          router.push("/login");

          return;
        }

        throw new Error(
          data.message || data.error || "Unable to create profile",
        );
      }

      // -----------------------------------------------
      // 5. Save UI session
      // -----------------------------------------------

      const profile = data.profile;

      saveSessionProfile({
        authenticated: true,

        entryType: "register",

        role: profile.role === "owner" ? "owner" : "farmer",

        fullName: profile.full_name ?? fullName,

        phone: profile.phone ?? phone.replace(/\D/g, ""),

        city,

        district,

        mandal,

        village,

        pincode,

        language,
      });

      // -----------------------------------------------
      // 6. Success
      // -----------------------------------------------

      toast.success(
        language === "te"
          ? "ఖాతా విజయవంతంగా సృష్టించబడింది"
          : "Account created successfully",
      );

      // -----------------------------------------------
      // 7. Redirect based on server role
      // -----------------------------------------------

      router.push(profile.role === "owner" ? "/owner" : "/dashboard");
    } catch (error) {
      console.error("Registration error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : language === "te"
            ? "ఖాతా సృష్టించలేకపోయాము"
            : "Unable to create account",
      );
    } finally {
      setWorking(false);
    }
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <main className="login-page">
      {/* ==============================================
          LEFT IMAGE SECTION
      =============================================== */}

      <section className="login-photo" aria-label="MandalRent registration">
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

      {/* ==============================================
          RIGHT REGISTER PANEL
      =============================================== */}

      <section className="login-panel">
        <div id="register-recaptcha-container" />

        <div className="login-card">
          {/* Language */}

          <button
            type="button"
            className="language-button"
            onClick={toggleLanguage}
          >
            <Languages size={18} />

            {text.language}
          </button>

          <p className="eyebrow">MandalRent</p>

          <h2>{text.title}</h2>

          <p className="login-intro">{text.intro}</p>

          {/* =========================================
              DETAILS STEP
          ========================================== */}

          {step === "details" ? (
            <>
              {/* Role */}

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

                  <span>
                    <strong>{text.farmer}</strong>
                  </span>
                </ToggleGroupItem>

                <ToggleGroupItem value="owner" className="role-choice">
                  <span className="role-icon">
                    <Tractor />
                  </span>

                  <span>
                    <strong>{text.owner}</strong>
                  </span>
                </ToggleGroupItem>
              </ToggleGroup>

              <FieldGroup className="login-fields">
                {/* Full Name */}

                <Field>
                  <FieldLabel htmlFor="full-name">{text.name}</FieldLabel>

                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </Field>

                {/* District */}

                <Field>
                  <FieldLabel htmlFor="district">{text.district}</FieldLabel>

                  <select
                    id="district"
                    value={districtCode}
                    onChange={(event) => {
                      const selectedCode = event.target.value;

                      const selectedDistrict = districts.find(
                        (item) => item.code === selectedCode,
                      );

                      setDistrictCode(selectedCode);
                      setDistrict(selectedDistrict?.name ?? "");

                      setMandalCode("");
                      setMandal("");

                      setVillageCode("");
                      setVillage("");
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

                {/* Mandal */}

                <Field>
                  <FieldLabel htmlFor="mandal">{text.mandal}</FieldLabel>

                  <select
                    id="mandal"
                    value={mandalCode}
                    onChange={(event) => {
                      const selectedCode = event.target.value;

                      const selectedMandal = mandals.find(
                        (item) => item.code === selectedCode,
                      );

                      setMandalCode(selectedCode);
                      setMandal(selectedMandal?.name ?? "");

                      setVillageCode("");
                      setVillage("");
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

                {/* Village */}

                <Field>
                  <FieldLabel htmlFor="village">{text.village}</FieldLabel>

                  <select
                    id="village"
                    value={villageCode}
                    onChange={(event) => {
                      const selectedCode = event.target.value;

                      const selectedVillage = villages.find(
                        (item) => item.code === selectedCode,
                      );

                      setVillageCode(selectedCode);
                      setVillage(selectedVillage?.name ?? "");
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

                {/* City + Pincode */}

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

                {/* Phone */}

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

                {/* Send OTP */}

                <ShimmerButton
                  type="button"
                  onClick={sendOtp}
                  disabled={working}
                  background="#075b2b"
                  className="login-submit"
                >
                  {working ? "…" : text.send}
                </ShimmerButton>
              </FieldGroup>
            </>
          ) : (
            /* =========================================
               OTP STEP
            ========================================== */

            <FieldGroup className="login-fields">
              <Field>
                <FieldLabel>{text.otp}</FieldLabel>

                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="otp-slot"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </Field>

              {/* Create account */}

              <ShimmerButton
                type="button"
                onClick={completeRegistration}
                disabled={working}
                background="#075b2b"
                className="login-submit"
              >
                {working ? "…" : text.verify}
              </ShimmerButton>

              {/* Change number */}

              <button
                type="button"
                className="text-button"
                onClick={() => {
                  resetRecaptcha();

                  setStep("details");

                  setOtp("");

                  setConfirmationResult(null);
                }}
              >
                <ArrowLeft />

                {text.change}
              </button>
            </FieldGroup>
          )}

          <div className="secure-note">
            <Link href="/login">{text.login}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
