"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Leaf, LockKeyhole, MapPin, Save, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { AdminHeader, AdminSidebar, AdminSidebarBackdrop } from "../admin-chrome";

type SettingsData = {
  profile: { full_name: string; phone: string | null; role: string };
  commissionPercent: number;
  payment: { razorpayConfigured: boolean; razorpayMode: string; webhookConfigured: boolean };
  locations: { districts: number; mandals: number; villages: number };
  system: { application: string; environment: string; authentication: string; paymentGateway: string; version: string };
};

const maskPhone = (phone: string | null) => phone ? `${phone.slice(0, 3)} ******${phone.slice(-4)}` : "Not set";

export default function AdminSettings({ adminName }: { adminName: string }) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState(adminName);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPins, setShowPins] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [pinMessage, setPinMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => { let active = true; fetch("/api/admin/settings", { cache: "no-store" }).then(async (response) => { const body = (await response.json()) as SettingsData & { message?: string }; if (!response.ok) throw new Error(body.message ?? "Unable to load settings"); if (active) { setSettings(body); setName(body.profile.full_name); } }).catch((error: unknown) => { if (active) setProfileError(error instanceof Error ? error.message : "Unable to load settings"); }); return () => { active = false; }; }, []);

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setProfileMessage(""); setProfileError("");
    const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: name }) });
    const body = (await response.json()) as { profile?: SettingsData["profile"]; message?: string };
    if (!response.ok || !body.profile) { setProfileError(body.message ?? "Unable to save profile"); return; }
    setSettings((previous) => previous ? { ...previous, profile: body.profile! } : previous); setName(body.profile.full_name); setProfileMessage("Profile updated successfully.");
  }

  async function changePin(event: FormEvent) {
    event.preventDefault(); setPinMessage(""); setPinError("");
    const response = await fetch("/api/admin/change-pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPin, newPin, confirmPin }) });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) { setPinError(body.message ?? "Unable to change PIN"); return; }
    setCurrentPin(""); setNewPin(""); setConfirmPin(""); setPinMessage(body.message ?? "PIN changed successfully.");
  }

  return <div className="admin-dashboard admin-settings-page" id="profile"><AdminSidebarBackdrop open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><AdminSidebar active="settings" open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><main className="admin-main"><AdminHeader title="Settings" subtitle="Manage your MandalRent administrator account and platform preferences." adminName={settings?.profile.full_name ?? adminName} locations={settings?.locations} onMenu={() => setSidebarOpen(true)} />
    <div className="admin-settings-grid">
      <section className="admin-settings-card admin-settings-profile"><div className="admin-settings-heading"><div className="admin-settings-icon settings-icon-blue"><UserRound size={20} /></div><div><p className="admin-eyebrow">Account</p><h2>Profile Settings</h2><span>Update the name shown across the admin workspace.</span></div></div><form onSubmit={saveProfile} className="admin-settings-form"><label>Full Name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={120} required /></label><label>Mobile Number<input value={maskPhone(settings?.profile.phone ?? null)} readOnly aria-readonly="true" /></label><label>Role<input value="Administrator" readOnly aria-readonly="true" /></label><div className="admin-settings-actions"><button type="submit" className="admin-primary-button"><Save size={16} /> Save Profile</button>{profileMessage ? <span className="admin-success"><CheckCircle2 size={15} />{profileMessage}</span> : null}{profileError ? <span className="admin-form-error">{profileError}</span> : null}</div></form></section>
      <section className="admin-settings-card"><div className="admin-settings-heading"><div className="admin-settings-icon settings-icon-purple"><LockKeyhole size={20} /></div><div><p className="admin-eyebrow">Account protection</p><h2>Security</h2><span>Change the six-digit PIN used to sign in.</span></div></div><form onSubmit={changePin} className="admin-settings-form"><label>Current PIN<div className="admin-pin-input"><input type={showPins ? "text" : "password"} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={currentPin} onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, ""))} autoComplete="current-password" required /> <button type="button" aria-label={showPins ? "Hide PINs" : "Show PINs"} onClick={() => setShowPins((value) => !value)}>{showPins ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><label>New 6-digit PIN<input type={showPins ? "text" : "password"} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ""))} autoComplete="new-password" required /></label><label>Confirm New PIN<input type={showPins ? "text" : "password"} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, ""))} autoComplete="new-password" required /></label><div className="admin-settings-actions"><button type="submit" className="admin-primary-button"><KeyRound size={16} /> Change PIN</button>{pinMessage ? <span className="admin-success"><CheckCircle2 size={15} />{pinMessage}</span> : null}{pinError ? <span className="admin-form-error">{pinError}</span> : null}</div></form><p className="admin-security-note"><ShieldCheck size={15} /> Other active sessions are signed out after a successful PIN change.</p></section>
      <section className="admin-settings-card"><div className="admin-settings-heading"><div className="admin-settings-icon settings-icon-green"><Leaf size={20} /></div><div><p className="admin-eyebrow">Business rules</p><h2>Platform Settings</h2><span>Centralized commission configuration used for new transactions.</span></div></div><div className="admin-readonly-row"><div><strong>Platform Commission</strong><span>Current commission applied to rental amounts</span></div><b>{settings?.commissionPercent ?? "—"}%</b></div><p className="admin-readonly-note">Read-only in V1. Existing payment accounting is never recalculated.</p></section>
      <section className="admin-settings-card"><div className="admin-settings-heading"><div className="admin-settings-icon settings-icon-orange"><WalletCards size={20} /></div><div><p className="admin-eyebrow">Gateway health</p><h2>Payment Configuration</h2><span>Only safe configuration status is shown here.</span></div></div><div className="admin-status-list"><div><span>Razorpay</span><strong className={settings?.payment.razorpayConfigured ? "status-configured" : "status-missing"}>{settings?.payment.razorpayConfigured ? "Configured" : "Not configured"}</strong></div><div><span>Mode</span><strong>{settings?.payment.razorpayMode ?? "—"} Mode</strong></div><div><span>Webhook</span><strong className={settings?.payment.webhookConfigured ? "status-configured" : "status-missing"}>{settings?.payment.webhookConfigured ? "Configured" : "Not configured"}</strong></div></div></section>
      <section className="admin-settings-card"><div className="admin-settings-heading"><div className="admin-settings-icon settings-icon-blue"><MapPin size={20} /></div><div><p className="admin-eyebrow">Location master data</p><h2>Andhra Pradesh Coverage</h2><span>Live UUID-linked location hierarchy.</span></div></div><div className="admin-settings-coverage">{[["Districts", settings?.locations.districts], ["Mandals", settings?.locations.mandals], ["Villages", settings?.locations.villages]].map(([label, value]) => <div key={label}><b>{value ?? "—"}</b><span>{label}</span></div>)}</div></section>
      <section className="admin-settings-card"><div className="admin-settings-heading"><div className="admin-settings-icon settings-icon-gray"><ShieldCheck size={20} /></div><div><p className="admin-eyebrow">Application details</p><h2>System Information</h2><span>Non-sensitive runtime information.</span></div></div><dl className="admin-system-list">{[["Application", settings?.system.application], ["Environment", settings?.system.environment], ["Authentication", settings?.system.authentication], ["Payment Gateway", settings?.system.paymentGateway], ["Version", settings?.system.version]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "—"}</dd></div>)}</dl></section>
    </div>
  </main></div>;
}
