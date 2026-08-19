"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Languages, Phone, Tractor, UserRound } from "lucide-react";
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
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { saveSessionProfile, type SessionRole } from "@/app/_data/session";
import { useLanguage } from "@/app/_components/language-toggle";

const copy = {
  en: {
    eyebrow: "One login · two services",
    title: "Login",
    intro: "Choose your role to continue.",
    farmer: "Farmer",
    farmerHint: "Find or rent equipment",
    owner: "Equipment owner",
    ownerHint: "List equipment and manage requests",
    phone: "Mobile number",
    send: "Send OTP",
    verify: "Login",
    change: "Change number",
    otp: "Enter the 6-digit OTP",
    register: "New here? Register",
    language: "తెలుగు",
  },
  te: {
    eyebrow: "ఒక లాగిన్ · రెండు సేవలు",
    title: "లాగిన్",
    intro: "కొనసాగించడానికి మీ పాత్రను ఎంచుకోండి.",
    farmer: "రైతు",
    farmerHint: "పరికరాలను కనుగొని అద్దెకు తీసుకోండి",
    owner: "యంత్ర యజమాని",
    ownerHint: "పరికరాలను జాబితా చేసి అభ్యర్థనలు నిర్వహించండి",
    phone: "మొబైల్ నంబర్",
    send: "OTP పంపండి",
    verify: "లాగిన్",
    change: "నంబర్ మార్చండి",
    otp: "6 అంకెల OTP నమోదు చేయండి",
    register: "కొత్తవారా? నమోదు చేయండి",
    language: "English",
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const text = copy[language];
  const [role, setRole] = useState<SessionRole>("farmer");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [working, setWorking] = useState(false);

  async function sendOtp() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10)
      return toast.error(
        language === "te"
          ? "10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి"
          : "Enter a valid 10-digit mobile number",
      );
    setWorking(true);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${digits}`,
        options: { data: { role, preferred_language: language } },
      });
      if (error) {
        setWorking(false);
        return toast.error(error.message);
      }
    }
    setWorking(false);
    setStep("otp");
    toast.success(supabase ? "OTP sent" : "Demo OTP: 123456");
  }

  async function verifyOtp() {
    if (otp.length !== 6)
      return toast.error(
        language === "te"
          ? "6 అంకెల OTP నమోదు చేయండి"
          : "Enter the 6-digit OTP",
      );
    setWorking(true);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+91${phone.replace(/\D/g, "")}`,
        token: otp,
        type: "sms",
      });
      if (error) {
        setWorking(false);
        return toast.error(error.message);
      }
    } else if (otp !== "123456") {
      setWorking(false);
      return toast.error("Demo OTP is 123456");
    }
    saveSessionProfile({
      authenticated: true,
      entryType: "login",
      role,
      phone: phone.replace(/\D/g, ""),
      language,
    });
    setWorking(false);
    router.push(role === "owner" ? "/owner" : "/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-photo" aria-label="MandalRent login">
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
          <h1>
            {language === "te"
              ? "మీ పొలానికి కావాల్సిన యంత్రం, మీ దగ్గరలోనే."
              : "The right machine for your farm, nearby."}
          </h1>
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
            <Languages size={60} /> {text.language}
          </button>
          <p className="eyebrow">{text.eyebrow}</p>
          <h2>{text.title}</h2>
          <p className="login-intro">{text.intro}</p>
          <ToggleGroup
            value={[role]}
            onValueChange={(values) =>
              values[0] && setRole(values[0] as SessionRole)
            }
            className="role-toggle"
            spacing={2}
          >
            <ToggleGroupItem value="farmer" className="role-choice">
              <span className="role-icon">
                <UserRound />
              </span>
              <span>
                <strong>{text.farmer}</strong>
                <small>{text.farmerHint}</small>
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem value="owner" className="role-choice">
              <span className="role-icon">
                <Tractor />
              </span>
              <span>
                <strong>{text.owner}</strong>
                <small>{text.ownerHint}</small>
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
          {step === "phone" ? (
            <FieldGroup className="login-fields">
              <Field>
                <FieldLabel htmlFor="phone">{text.phone}</FieldLabel>
                <div className="phone-input">
                  <span>+91</span>
                  <Phone />
                  <Input
                    id="phone"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
              </Field>
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
          ) : (
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
              <ShimmerButton
                type="button"
                onClick={verifyOtp}
                disabled={working}
                background="#075b2b"
                className="login-submit"
              >
                {working ? "…" : text.verify}
              </ShimmerButton>
              <button
                type="button"
                className="text-button"
                onClick={() => setStep("phone")}
              >
                <ArrowLeft /> {text.change}
              </button>
            </FieldGroup>
          )}
          <div className="secure-note">
            <Link href="/register">{text.register}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
