"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Languages, Phone, Tractor } from "lucide-react";
import { toast } from "sonner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { normalizeIndianPhone, isValidPin } from "@/lib/auth-validation";
import { saveSessionProfile } from "@/app/_data/session";
import { useLanguage } from "@/app/_components/language-toggle";

const copy = {
  en: {
    eyebrow: "One login · two services",
    title: "Login",
    intro: "Use your mobile number and 6-digit PIN to continue.",
    phone: "Mobile number",
    pin: "6-digit PIN",
    login: "Login",
    register: "New here? Register",
    language: "తెలుగు",
  },
  te: {
    eyebrow: "ఒక లాగిన్ · రెండు సేవలు",
    title: "లాగిన్",
    intro: "మీ మొబైల్ నంబర్ మరియు 6 అంకెల PIN తో కొనసాగండి.",
    phone: "మొబైల్ నంబర్",
    pin: "6 అంకెల PIN",
    login: "లాగిన్",
    register: "కొత్తవారా? నమోదు చేయండి",
    language: "English",
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const text = copy[language];
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [working, setWorking] = useState(false);

  async function login() {
    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return toast.error(language === "te" ? "చెల్లుబాటు అయ్యే మొబైల్ నంబర్ నమోదు చేయండి" : "Invalid mobile number");
    }
    if (!isValidPin(pin)) {
      return toast.error(language === "te" ? "PIN 6 అంకెలుగా ఉండాలి" : "PIN must be 6 digits");
    }

    setWorking(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, pin }),
      });
      const result = (await response.json()) as { profile?: { full_name?: string; phone?: string; role?: string; preferred_language?: string; city?: string; pincode?: string }; message?: string };
      if (!response.ok || !result.profile) {
        return toast.error(language === "te" ? "మొబైల్ నంబర్ లేదా PIN తప్పు" : "Invalid mobile number or PIN");
      }
      const profile = result.profile;

      saveSessionProfile({
        authenticated: true,
        entryType: "login",
        role: profile.role === "owner" ? "owner" : "farmer",
        fullName: profile.full_name ?? "",
        phone: profile.phone ?? normalizedPhone,
        city: profile.city ?? "",
        pincode: profile.pincode ?? "",
        language: profile.preferred_language === "te" ? "te" : language,
      });

      toast.success(language === "te" ? "విజయవంతంగా లాగిన్ అయ్యారు" : "Login successful");
      router.push(profile.role === "owner" ? "/owner" : profile.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      toast.error(language === "te" ? "మొబైల్ నంబర్ లేదా PIN తప్పు" : "Invalid mobile number or PIN");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-photo" aria-label="MandalRent login">
        <div className="login-photo-overlay" />
        <Link href="/" className="photo-brand">
          <span className="brand-mark"><Tractor /></span>
          <span>Mandal<span>Rent</span></span>
        </Link>
        <div className="photo-copy">
          <span className="eyebrow-light">{text.eyebrow}</span>
          <h1>{language === "te" ? "మీ పొలానికి కావాల్సిన యంత్రం, మీ దగ్గరలోనే." : "The right machine for your farm, nearby."}</h1>
          <p>{text.intro}</p>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <button type="button" className="language-button" onClick={toggleLanguage}>
            <Languages size={18} /> {text.language}
          </button>
          <p className="eyebrow">{text.eyebrow}</p>
          <h2>{text.title}</h2>
          <p className="login-intro">{text.intro}</p>
          <FieldGroup className="login-fields">
            <Field>
              <FieldLabel htmlFor="phone">{text.phone}</FieldLabel>
              <div className="phone-input">
                <span>+91</span><Phone />
                <Input id="phone" inputMode="numeric" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))} />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="pin">{text.pin}</FieldLabel>
              <Input id="pin" type="password" inputMode="numeric" maxLength={6} autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} />
            </Field>
            <ShimmerButton type="button" onClick={login} disabled={working} background="#075b2b" className="login-submit">
              {working ? "…" : text.login}
            </ShimmerButton>
          </FieldGroup>
          <div className="secure-note"><Link href="/register">{text.register}</Link></div>
        </div>
      </section>
    </main>
  );
}
