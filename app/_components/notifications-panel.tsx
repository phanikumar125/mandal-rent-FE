"use client";

import Link from "next/link";
import { Bell, Check, CheckCheck, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import type { NotificationItem } from "./notification-bell";

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function href(item: NotificationItem, role: string) {
  if (item.type === "admin_payment_failed") return "/admin/payments";
  if (item.type === "admin_payout_eligible") return "/admin/payments";
  if (item.type.includes("payout")) return role === "admin" ? "/admin/payments" : "/owner";
  if (["new_booking", "payment_received"].includes(item.type)) return "/owner";
  if (item.type === "booking_cancelled") return role === "owner" ? "/owner" : "/dashboard";
  return "/dashboard";
}

export function NotificationsPanel() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [backHref, setBackHref] = useState("/dashboard");

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/notifications?limit=50${filter === "unread" ? "&unread=true" : ""}`, { cache: "no-store" });
    if (response.ok) {
      const body = (await response.json()) as { notifications?: NotificationItem[]; unreadCount?: number };
      setItems(body.notifications ?? []);
      setUnread(body.unreadCount ?? 0);
    }
    setLoading(false);
  }

  // This effect synchronizes the page with the current filter and session.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    void fetch("/api/auth/session", { cache: "no-store" }).then((response) => response.json()).then((body: { profile?: { role?: string } }) => setBackHref(body.profile?.role === "admin" ? "/admin" : body.profile?.role === "owner" ? "/owner" : "/dashboard")).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function mark(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isRead: true }) });
    await load();
  }

  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    await load();
  }

  return <section className="notifications-page">
    <div className="notifications-page-top"><Link href={backHref}><ChevronLeft size={17} /> Back to dashboard</Link><div className="notifications-heading"><span><Bell size={21} /></span><div><p className="eyebrow">MandalRent</p><h1>Notifications</h1><p>Stay up to date with your bookings, rentals and payouts.</p></div></div></div>
    <div className="notifications-toolbar"><div className="notification-tabs"><button className={filter === "all" ? "is-active" : ""} type="button" onClick={() => setFilter("all")}>All</button><button className={filter === "unread" ? "is-active" : ""} type="button" onClick={() => setFilter("unread")}>Unread <span>{unread}</span></button></div>{unread ? <button className="notification-mark-all" type="button" onClick={() => void markAll()}><CheckCheck size={16} /> Mark all read</button> : null}</div>
    {loading ? <div className="notification-page-empty">Loading notifications…</div> : items.length ? <div className="notifications-page-list">{items.map((item) => <article className={item.is_read ? "notification-page-item" : "notification-page-item is-unread"} key={item.id}><div className="notification-page-icon"><Bell size={17} /></div><div><h2>{item.title}{!item.is_read ? <i /> : null}</h2><p>{item.message}</p><time>{timeLabel(item.created_at)}</time>{item.entity_id ? <Link href={href(item, backHref === "/admin" ? "admin" : backHref === "/owner" ? "owner" : "farmer")} onClick={() => { if (!item.is_read) void mark(item.id); }}>Open related activity</Link> : null}</div>{!item.is_read ? <button type="button" onClick={() => void mark(item.id)}><Check size={16} /> Read</button> : null}</article>)}</div> : <div className="notification-page-empty"><Bell size={23} /><strong>{filter === "unread" ? "No unread notifications" : "No notifications yet"}</strong><span>Important activity will appear here.</span></div>}
  </section>;
}
