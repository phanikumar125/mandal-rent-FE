"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Languages, LogOut, Menu, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "../_components/language-toggle";
import { Brand } from "../_components/product-shell";
import { clearSessionProfile, readSessionProfile } from "../_data/session";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

const labels = {
  en: { dashboard: "Dashboard", marketplace: "Find equipment", listings: "My equipment", profile: "Profile", admin: "Admin", v2: "V2 booking", menu: "Menu", logout: "Log out", language: "తెలుగు" },
  te: { dashboard: "డాష్‌బోర్డ్", marketplace: "పరికరాలు వెతకండి", listings: "నా పరికరాలు", profile: "ప్రొఫైల్", admin: "అడ్మిన్", v2: "V2 బుకింగ్", menu: "మెను", logout: "లాగ్ అవుట్", language: "English" },
} as const;

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const profile = useMemo(() => readSessionProfile(), []);
  const [menuOpen, setMenuOpen] = useState(false);
  const text = labels[language];
  const nav = [{ href: "/dashboard", label: text.dashboard }, { href: "/marketplace", label: text.marketplace }, ...(profile.role === "owner" ? [{ href: "/listings", label: text.listings }] : []), { href: "/profile", label: text.profile }, { href: "/admin", label: text.admin }];
  async function logout() { clearSessionProfile(); await getSupabaseBrowserClient()?.auth.signOut(); router.push("/login"); }
  return <div className="portal-shell"><header className="portal-header"><div className="portal-header-inner"><Brand /><button type="button" className="portal-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label={text.menu}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button><nav className={menuOpen ? "portal-nav is-open" : "portal-nav"} aria-label="Portal navigation">{nav.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? "is-active" : undefined} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}<Link href="/v2" className="portal-v2-link">{text.v2}</Link></nav><div className="portal-actions"><button type="button" onClick={toggleLanguage}><Languages size={18} /> {text.language}</button><button type="button" onClick={logout}><LogOut size={17} /><span>{text.logout}</span></button></div></div></header><main className="portal-content">{children}</main></div>;
}
