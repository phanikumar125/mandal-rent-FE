"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Sprout,
  Tractor,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { NotificationBell } from "@/app/_components/notification-bell";

type ActiveSection = "dashboard" | "users" | "listings" | "bookings" | "payments" | "reports" | "settings";
type Locations = { districts: number; mandals: number; villages: number };

const navigation: Array<{ label: string; icon: LucideIcon; href: string; section?: ActiveSection; disabled?: boolean }> = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", section: "dashboard" },
  { label: "Users", icon: Users, href: "/admin/users", section: "users" },
  { label: "Listings", icon: Tractor, href: "/admin/listings", section: "listings" },
  { label: "Bookings", icon: ClipboardList, href: "/admin/bookings", section: "bookings" },
  { label: "Payments", icon: WalletCards, href: "/admin/payments", section: "payments" },
  { label: "Reports", icon: FileBarChart, href: "/admin/reports", section: "reports" },
  { label: "Settings", icon: Settings, href: "/admin/settings", section: "settings" },
];

async function secureLogout(router: ReturnType<typeof useRouter>) {
  await fetch("/api/auth/logout", { method: "POST" });
  router.replace("/login");
}

export function AdminSidebar({ active, open, onClose }: { active: ActiveSection; open: boolean; onClose: () => void }) {
  const router = useRouter();
  return (
    <aside className={open ? "admin-sidebar is-open" : "admin-sidebar"}>
      <div className="admin-brand"><span className="admin-brand-mark"><Tractor size={27} /></span><span><strong>Mandal<span>Rent</span></strong><small>Farm Together. Grow Together.</small></span></div>
      <nav className="admin-sidebar-nav" aria-label="Admin navigation">{navigation.map(({ label, icon: Icon, href, section, disabled }) => disabled ? <span key={label} className="admin-nav-item is-disabled" aria-disabled="true"><Icon size={20} />{label}</span> : <Link key={label} href={href} className={active === section ? "admin-nav-item is-active" : "admin-nav-item"} onClick={onClose}><Icon size={20} />{label}</Link>)}</nav>
      <div className="admin-sidebar-grow" />
      <div className="admin-sidebar-art"><div className="admin-art-sun" /><Tractor size={79} strokeWidth={1.1} /><div className="admin-art-hills" /></div>
      <div className="admin-sidebar-telugu"><Leaf size={28} />మన రైతు<br />మన భవిష్యత్తు</div>
      <button type="button" className="admin-sidebar-logout" onClick={() => void secureLogout(router)}><LogOut size={17} /> Logout</button>
      <div className="admin-sidebar-footer"><Sprout size={15} /> Version 1.0.0 · MandalRent Admin</div>
    </aside>
  );
}

export function AdminProfileMenu({ adminName }: { adminName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayName = adminName || "MandalRent Admin";
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A";

  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => { if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOnOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, []);

  return (
    <div className="admin-profile-menu" ref={containerRef}>
      <button type="button" className="admin-profile-trigger" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}><span className="admin-avatar">{initials}</span><span><strong>{displayName}</strong></span><ChevronDown size={16} /></button>
      {open ? <div className="admin-profile-dropdown" role="menu"><Link href="/admin/settings#profile" role="menuitem" onClick={() => setOpen(false)}><UserRound size={16} /> My Profile</Link><Link href="/admin/settings" role="menuitem" onClick={() => setOpen(false)}><Settings size={16} /> Settings</Link><div className="admin-dropdown-divider" /><button type="button" role="menuitem" className="admin-dropdown-logout" onClick={() => { setOpen(false); void secureLogout(router); }}><LogOut size={16} /> Logout</button></div> : null}
    </div>
  );
}

export function AdminHeader({ title, subtitle, adminName, locations, onMenu }: { title: string; subtitle: string; adminName: string; locations?: Locations; onMenu: () => void }) {
  return (
    <header className="admin-main-header"><button type="button" className="admin-mobile-menu" aria-label="Open navigation" onClick={onMenu}><Menu size={21} /></button><div><h1>{title}</h1><p className="admin-subtitle">{subtitle}</p></div><div className="admin-header-actions"><label className="admin-period"><CalendarDays size={17} /><select aria-label="Date range" defaultValue="today"><option value="today">Today</option></select><ChevronDown size={15} /></label>{locations ? <div className="admin-location-chip"><MapPin size={14} /><span><strong>Andhra Pradesh</strong><small>{locations.districts} Districts · {locations.mandals} Mandals · {locations.villages} Villages</small></span></div> : null}<NotificationBell /><AdminProfileMenu adminName={adminName} /></div></header>
  );
}

export function AdminSidebarBackdrop({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <button type="button" className="admin-sidebar-scrim" aria-label="Close navigation" onClick={onClose} /> : null;
}

export function AdminSectionIcon({ children }: { children: React.ReactNode }) {
  return <span className="admin-section-icon">{children}</span>;
}
