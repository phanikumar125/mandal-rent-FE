"use client";

import Link from "next/link";
import { Languages, LogIn, Sprout, Tractor, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "./language-toggle";

const landingImages = {
  farmer:
    "https://images.unsplash.com/photo-1703922055661-2168ea8b80a9?auto=format&fit=crop&w=900&q=82",
  owner:
    "https://images.unsplash.com/photo-1624547481160-d564f43324f9?auto=format&fit=crop&w=900&q=82",
} as const;

const copy = {
  en: {
    eyebrow: "Local farm equipment marketplace",
    title: "Rent or buy the right machine near your farm.",
    body: "MandalRent connects farmers with nearby equipment owners. Create an account to see machines available in your district.",
    login: "Login",
    register: "Register",
    farmer: "Farmer",
    farmerBody: "Find tractors, harvesters, and implements near your city.",
    owner: "Equipment owner",
    ownerBody: "List your machinery and receive requests from nearby farmers.",
    language: "తెలుగు",
  },
  te: {
    eyebrow: "స్థానిక వ్యవసాయ పరికరాల మార్కెట్",
    title: "మీ పొలానికి దగ్గరలో సరైన యంత్రాన్ని అద్దెకు తీసుకోండి లేదా కొనండి.",
    body: "మండల్‌రెంట్ రైతులను దగ్గరలోని యంత్ర యజమానులతో కలుపుతుంది. మీ జిల్లాలోని పరికరాలను చూడటానికి ఖాతా సృష్టించండి.",
    login: "లాగిన్",
    register: "నమోదు",
    farmer: "రైతు",
    farmerBody:
      "మీ నగరానికి దగ్గరలో ట్రాక్టర్లు, హార్వెస్టర్లు, ఇతర పరికరాలను కనుగొనండి.",
    owner: "యంత్ర యజమాని",
    ownerBody: "మీ పరికరాలను జాబితా చేసి దగ్గరలోని రైతుల అభ్యర్థనలు పొందండి.",
    language: "English",
  },
} as const;

export function PublicLanding() {
  const { language, toggleLanguage } = useLanguage();
  const text = copy[language];

  return (
    <main className="public-landing">
      <header className="public-landing-header">
        <Link href="/" className="site-brand">
          <span className="brand-mark">
            <Tractor />
          </span>
          <span>
            Mandal<span>Rent</span>
          </span>
        </Link>
        <button
          type="button"
          className="language-button"
          onClick={toggleLanguage}
        >
          <Languages size={18} /> {text.language}
        </button>
      </header>
      <section className="public-landing-hero">
        <div className="public-landing-copy">
          <span className="hero-kicker">
            <Sprout /> {text.eyebrow}
          </span>
          <h1>{text.title}</h1>
          <p>{text.body}</p>
          <div className="public-landing-actions">
            <Link href="/login" className="landing-primary">
              <LogIn size={18} /> {text.login}
            </Link>
            <Link href="/register" className="landing-secondary">
              <UserPlus size={18} /> {text.register}
            </Link>
          </div>
        </div>
        <div className="public-landing-cards">
          <Card className="landing-role-card">
            <div className="landing-card-image">
              <img
                src={landingImages.farmer}
                alt="Indian farmer working in a green field"
                loading="lazy"
              />
            </div>
            <span className="landing-card-icon">
              <Tractor />
            </span>
            <h2>{text.farmer}</h2>
            <p>{text.farmerBody}</p>
          </Card>
          <Card className="landing-role-card">
            <div className="landing-card-image">
              <img
                src={landingImages.owner}
                alt="Farmers using a tractor in a green field"
                loading="lazy"
              />
            </div>
            <span className="landing-card-icon">
              <Sprout />
            </span>
            <h2>{text.owner}</h2>
            <p>{text.ownerBody}</p>
          </Card>
        </div>
      </section>
    </main>
  );
}
