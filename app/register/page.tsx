"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Languages, Tractor, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { saveSessionProfile, type SessionRole } from "@/app/_data/session";
import { useLanguage } from "@/app/_components/language-toggle";

const copy = {
  en: { eyebrow: "Create your MandalRent account", title: "Register", intro: "Your city and district help us show the nearest equipment.", name: "Full name", city: "City", district: "District", pincode: "Pincode", phone: "Mobile number", farmer: "Farmer", owner: "Equipment owner", send: "Send OTP", verify: "Create account", change: "Change number", login: "Already have an account? Login", otp: "Enter the 6-digit OTP", demo: "Demo mode OTP: 123456", language: "తెలుగు" },
  te: { eyebrow: "మండల్‌రెంట్ ఖాతా సృష్టించండి", title: "నమోదు", intro: "మీకు దగ్గరలోని పరికరాలను చూపించడానికి నగరం, జిల్లా ఉపయోగిస్తాము.", name: "పూర్తి పేరు", city: "నగరం", district: "జిల్లా", pincode: "పిన్‌కోడ్", phone: "మొబైల్ నంబర్", farmer: "రైతు", owner: "యంత్ర యజమాని", send: "OTP పంపండి", verify: "ఖాతా సృష్టించండి", change: "నంబర్ మార్చండి", login: "ఇప్పటికే ఖాతా ఉందా? లాగిన్", otp: "6 అంకెల OTP నమోదు చేయండి", demo: "డెమో OTP: 123456", language: "English" },
} as const;

export default function RegisterPage() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const text = copy[language];
  const [role, setRole] = useState<SessionRole>("farmer");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [working, setWorking] = useState(false);

  async function sendOtp() {
    const digits = phone.replace(/\D/g, "");
    if (!fullName.trim() || !city.trim() || !district.trim() || !/^\d{6}$/.test(pincode)) return toast.error(language === "te" ? "పేరు, నగరం, జిల్లా, 6 అంకెల పిన్‌కోడ్ పూర్తి చేయండి" : "Enter your name, city, district, and a 6-digit pincode");
    if (digits.length !== 10) return toast.error(language === "te" ? "10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి" : "Enter a valid 10-digit mobile number");
    setWorking(true);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({ phone: `+91${digits}`, options: { data: { role, full_name: fullName, city, district, pincode, preferred_language: language } } });
      if (error) { setWorking(false); return toast.error(error.message); }
    }
    setWorking(false);
    setStep("otp");
    toast.success(supabase ? "OTP sent" : text.demo);
  }

  async function completeRegistration() {
    if (otp.length !== 6) return toast.error(language === "te" ? "6 అంకెల OTP నమోదు చేయండి" : "Enter the 6-digit OTP");
    setWorking(true);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({ phone: `+91${phone.replace(/\D/g, "")}`, token: otp, type: "sms" });
      if (error) { setWorking(false); return toast.error(error.message); }
    } else if (otp !== "123456") {
      setWorking(false);
      return toast.error("Demo OTP is 123456");
    }
    if (supabase) {
      const { data: auth } = await supabase.auth.getUser();
      const { data: districtRow } = await supabase.from("districts").select("id").ilike("name", district.trim()).maybeSingle();
      if (auth.user) await supabase.from("profiles").update({ city, pincode, district_id: districtRow?.id ?? null }).eq("id", auth.user.id);
    }
    saveSessionProfile({ authenticated: true, entryType: "register", role, fullName, phone: phone.replace(/\D/g, ""), city, district, pincode, language });
    setWorking(false);
    toast.success(language === "te" ? "ఖాతా సృష్టించబడింది" : "Account created");
    router.push(role === "owner" ? "/owner" : "/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-photo" aria-label="MandalRent registration">
        <div className="login-photo-overlay" />
        <Link href="/" className="photo-brand"><span className="brand-mark"><Tractor /></span><span>Mandal<span>Rent</span></span></Link>
        <div className="photo-copy"><span className="eyebrow-light">{text.eyebrow}</span><h1>{text.title}</h1><p>{text.intro}</p></div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <button type="button" className="language-button" onClick={toggleLanguage}><Languages size={18} /> {text.language}</button>
          <p className="eyebrow">MandalRent</p><h2>{text.title}</h2><p className="login-intro">{text.intro}</p>
          {step === "details" ? <>
            <ToggleGroup value={[role]} onValueChange={(values) => values[0] && setRole(values[0] as SessionRole)} className="role-toggle" spacing={10}>
              <ToggleGroupItem value="farmer" className="role-choice"><span className="role-icon"><UserRound /></span><span><strong>{text.farmer}</strong></span></ToggleGroupItem>
              <ToggleGroupItem value="owner" className="role-choice"><span className="role-icon"><Tractor /></span><span><strong>{text.owner}</strong></span></ToggleGroupItem>
            </ToggleGroup>
            <FieldGroup className="login-fields">
              <Field><FieldLabel htmlFor="full-name">{text.name}</FieldLabel><Input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} /></Field>
              <div className="two-fields"><Field><FieldLabel htmlFor="city">{text.city}</FieldLabel><Input id="city" value={city} onChange={(event) => setCity(event.target.value)} /></Field><Field><FieldLabel htmlFor="district">{text.district}</FieldLabel><Input id="district" value={district} onChange={(event) => setDistrict(event.target.value)} /></Field></div>
              <Field><FieldLabel htmlFor="pincode">{text.pincode}</FieldLabel><Input id="pincode" inputMode="numeric" maxLength={6} value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))} /></Field>
              <Field><FieldLabel htmlFor="register-phone">{text.phone}</FieldLabel><div className="phone-input"><span>+91</span><Input id="register-phone" inputMode="numeric" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))} /></div></Field>
              <ShimmerButton type="button" onClick={sendOtp} disabled={working} background="#075b2b" className="login-submit">{working ? "…" : text.send}</ShimmerButton>
            </FieldGroup>
          </> : <FieldGroup className="login-fields"><Field><FieldLabel>{text.otp}</FieldLabel><InputOTP maxLength={6} value={otp} onChange={setOtp}><InputOTPGroup>{Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} className="otp-slot" />)}</InputOTPGroup></InputOTP></Field><ShimmerButton type="button" onClick={completeRegistration} disabled={working} background="#075b2b" className="login-submit">{working ? "…" : text.verify}</ShimmerButton><button type="button" className="text-button" onClick={() => setStep("details")}><ArrowLeft /> {text.change}</button></FieldGroup>}
          <div className="secure-note"><Link href="/login">{text.login}</Link></div>
        </div>
      </section>
    </main>
  );
}
