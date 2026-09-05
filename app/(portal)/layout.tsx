"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Languages, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../_components/language-toggle";
import { Brand } from "../_components/product-shell";
import { clearSessionProfile, type SessionRole } from "../_data/session";
import { NotificationBell } from "../_components/notification-bell";

type PortalRole = SessionRole | "admin";

const labels = {
  en: {
    dashboard: "Dashboard",
    marketplace: "Find equipment",
    listings: "My equipment",
    profile: "Profile",
    admin: "Admin",
    v2: "V2 booking",
    menu: "Menu",
    logout: "Log out",
    language: "తెలుగు",
  },
  te: {
    dashboard: "డాష్‌బోర్డ్",
    marketplace: "పరికరాలు వెతకండి",
    listings: "నా పరికరాలు",
    profile: "ప్రొఫైల్",
    admin: "అడ్మిన్",
    v2: "V2 బుకింగ్",
    menu: "మెను",
    logout: "లాగ్ అవుట్",
    language: "English",
  },
} as const;

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const [role, setRole] = useState<PortalRole>("farmer");
  const [authorized, setAuthorized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const adminRoute = pathname.startsWith("/admin");
  const text = labels[language];
  useEffect(() => {
    let active = true;
    async function checkAuth() {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (!response.ok) return router.replace("/login");
      const data = (await response.json()) as { profile?: { role?: string } };
      const profile = data.profile;
      if (!profile) return router.replace("/login");
      const nextRole: PortalRole =
        profile.role === "owner" || profile.role === "admin"
          ? profile.role
          : "farmer";
      if (adminRoute && nextRole !== "admin")
        return router.replace("/dashboard");
      if (active) {
        setRole(nextRole);
        setAuthorized(true);
      }
    }
    void checkAuth();
    return () => {
      active = false;
    };
  }, [adminRoute, pathname, router]);
  const nav = [
    { href: "/dashboard", label: text.dashboard },
    { href: "/marketplace", label: text.marketplace },
    ...(role === "owner" ? [{ href: "/listings", label: text.listings }] : []),
    { href: "/profile", label: text.profile },
    ...(role === "admin" ? [{ href: "/admin", label: text.admin }] : []),
  ];
  async function logout() {
    clearSessionProfile();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  return (
    <div className="portal-shell">
      {!adminRoute ? <header className="portal-header">
        <div className="portal-header-inner">
          <Brand href={role === "owner" ? "/owner" : role === "admin" ? "/admin" : "/dashboard"} />
          <button
            type="button"
            className="portal-menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label={text.menu}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav
            className={menuOpen ? "portal-nav is-open" : "portal-nav"}
            aria-label="Portal navigation"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "is-active" : undefined}
                aria-current={pathname === item.href ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="portal-actions">
            <NotificationBell />
            <button type="button" onClick={toggleLanguage}>
              <Languages size={18} /> {text.language}
            </button>
            <button type="button" onClick={logout}>
              <LogOut size={17} />
              <span>{text.logout}</span>
            </button>
          </div>
        </div>
      </header> : null}
      <main className={adminRoute ? "portal-content admin-portal-content" : "portal-content"}>{authorized ? children : null}</main>
    </div>
  );
}
