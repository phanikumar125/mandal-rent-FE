"use client";

import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type NotificationItem = { id: string; type: string; title: string; message: string; entity_type: string | null; entity_id: string | null; is_read: boolean; created_at: string };

function relativeTime(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notificationHref(item: NotificationItem, role: string) {
  if (item.type === "admin_payment_failed") return "/admin/payments";
  if (item.type === "admin_payout_eligible") return "/admin/payments";
  if (item.type === "payout_paid" || item.type === "payout_eligible" || item.type === "new_booking" || item.type === "payment_received") return "/owner";
  if (item.type === "booking_cancelled") return role === "owner" ? "/owner" : "/dashboard";
  return "/dashboard";
}

export function NotificationBell({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [role, setRole] = useState("farmer");
  const containerRef = useRef<HTMLDivElement>(null);

  async function load() {
    const response = await fetch("/api/notifications?limit=8", { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { notifications?: NotificationItem[]; unreadCount?: number };
    setItems(body.notifications ?? []);
    setUnread(body.unreadCount ?? 0);
  }

  // The bell owns a polling subscription; the initial request is intentionally started here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    void fetch("/api/auth/session", { cache: "no-store" }).then((response) => response.json()).then((body: { profile?: { role?: string } }) => setRole(body.profile?.role ?? "farmer")).catch(() => undefined);
    const timer = window.setInterval(() => void load(), 60_000);
    const close = (event: PointerEvent) => { if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => { window.clearInterval(timer); document.removeEventListener("pointerdown", close); };
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isRead: true }) });
    await load();
  }

  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    await load();
  }

  return <div className={`notification-bell ${className}`} ref={containerRef}>
    <button type="button" className="notification-bell-button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={() => { setOpen((value) => !value); if (!open) void load(); }}><Bell size={19} />{unread ? <span className="notification-count">{unread > 9 ? "9+" : unread}</span> : null}</button>
    {open ? <div className="notification-popover" role="dialog" aria-label="Notifications">
      <div className="notification-popover-heading"><div><strong>Notifications</strong><small>{unread ? `${unread} unread` : "All caught up"}</small></div>{unread ? <button type="button" onClick={() => void markAll()}><CheckCheck size={15} /> Mark all read</button> : null}</div>
      {items.length ? <div className="notification-list">{items.map((item) => <div className={item.is_read ? "notification-item" : "notification-item is-unread"} key={item.id}><Link href={notificationHref(item, role)} onClick={() => { if (!item.is_read) void markRead(item.id); setOpen(false); }}><span className="notification-item-title">{item.title}{!item.is_read ? <i /> : null}</span><span>{item.message}</span><time>{relativeTime(item.created_at)}</time></Link>{!item.is_read ? <button type="button" aria-label="Mark as read" onClick={() => void markRead(item.id)}><Check size={14} /></button> : null}</div>)}</div> : <p className="notification-empty">No notifications yet.</p>}
      <Link className="notification-view-all" href="/notifications" onClick={() => setOpen(false)}>View all notifications</Link>
    </div> : null}
  </div>;
}
