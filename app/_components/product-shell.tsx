"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Search, Tractor, UserRound } from "lucide-react";
import { productCopy } from "../_data/product";
import { useLanguage } from "./language-toggle";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="MandalRent home">
      <span className="brand-mark" aria-hidden="true">
        <Tractor size={24} strokeWidth={2.2} />
      </span>
      <span className="brand-name">
        Mandal<span>Rent</span>
      </span>
    </Link>
  );
}

export function ProductHeader({
  activeVersion,
}: {
  activeVersion: "v1" | "v2";
}) {
  const { language, toggleLanguage } = useLanguage();
  const copy = productCopy[language];

  return (
    <header className="product-header">
      <div className="product-header-inner">
        <Brand />

        <nav className="version-switch" aria-label="Product version">
          <Link
            href="/"
            className={activeVersion === "v1" ? "is-active" : undefined}
            aria-current={activeVersion === "v1" ? "page" : undefined}
          >
            {copy.v1}
          </Link>
          <Link
            href="/v2"
            className={activeVersion === "v2" ? "is-active" : undefined}
            aria-current={activeVersion === "v2" ? "page" : undefined}
          >
            {copy.v2}
          </Link>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="language-button"
            onClick={toggleLanguage}
          >
            {copy.languageButton}
          </button>
          <Link href="/login" className="signin-link">
            <UserRound size={18} aria-hidden="true" />
            <span>{copy.login}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MobileBottomNav({
  active = "discover",
}: {
  active?: "home" | "discover" | "favorites" | "profile";
}) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const copy = productCopy[language];
  const items = [
    { id: "home", label: copy.home, href: "/", icon: Home },
    {
      id: "discover",
      label: copy.discover,
      href: pathname === "/v2" ? "/v2" : "/",
      icon: Search,
    },
    {
      id: "favorites",
      label: copy.favorites,
      href: "/marketplace",
      icon: Heart,
    },
    { id: "profile", label: copy.profile, href: "/profile", icon: UserRound },
  ] as const;

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={active === item.id ? "is-active" : undefined}
            aria-current={active === item.id ? "page" : undefined}
          >
            <Icon
              size={22}
              strokeWidth={active === item.id ? 2.5 : 1.9}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
