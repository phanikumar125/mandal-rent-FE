"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Block = { id: string; start_date: string; end_date: string; reason: string | null };
type Booking = { id: string; rental_start: string | null; rental_end: string | null; rental_status: "confirmed" | "in_progress" };
type CalendarData = { listing?: { title: string }; blocks?: Block[]; bookings?: Booking[] };

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function monthKey(date: Date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function includes(start: string | null, end: string | null, day: string) { return Boolean(start && end && start <= day && end >= day); }

export function OwnerAvailabilityCalendar({ listingId }: { listingId: string }) {
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)); });
  const [data, setData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const key = monthKey(month);

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/listings/${listingId}/availability?month=${key}`, { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as CalendarData & { message?: string };
    if (response.ok) setData(body); else toast.error(body.message ?? "Unable to load availability");
    setLoading(false);
  }

  // The calendar synchronizes its visible month with the server availability feed.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, key]);

  const days = useMemo(() => {
    const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
    const count = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
    return [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: count }, (_, index) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index + 1)))];
  }, [month]);
  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(month);

  function status(day: string) {
    if (data.bookings?.some((booking) => booking.rental_status === "in_progress" && includes(booking.rental_start, booking.rental_end, day))) return "in-progress";
    if (data.bookings?.some((booking) => includes(booking.rental_start, booking.rental_end, day))) return "booked";
    if (data.blocks?.some((block) => includes(block.start_date, block.end_date, day))) return "unavailable";
    return "available";
  }

  function clearForm() { setStartDate(""); setEndDate(""); setReason(""); setEditingId(""); }
  function editBlock(block: Block) { setEditingId(block.id); setStartDate(block.start_date); setEndDate(block.end_date); setReason(block.reason ?? ""); }

  async function saveBlock(event: FormEvent) {
    event.preventDefault();
    if (!startDate || !endDate || endDate < startDate) return toast.error("Choose a valid date range");
    setSaving(true);
    const endpoint = editingId ? `/api/owner/listings/${listingId}/availability/${editingId}` : `/api/owner/listings/${listingId}/availability`;
    const response = await fetch(endpoint, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ startDate, endDate, reason }) });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    setSaving(false);
    if (!response.ok) return toast.error(body.message ?? "Unable to save unavailable dates");
    toast.success(editingId ? "Unavailable dates updated" : "Unavailable dates saved");
    clearForm();
    void load();
  }

  async function removeBlock(id: string) {
    const response = await fetch(`/api/owner/listings/${listingId}/availability/${id}`, { method: "DELETE" });
    if (!response.ok) { const body = (await response.json().catch(() => ({}))) as { message?: string }; return toast.error(body.message ?? "Unable to remove dates"); }
    if (editingId === id) clearForm();
    toast.success("Unavailable dates removed");
    void load();
  }

  function move(offset: number) { setMonth((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 1))); }

  return <main className="availability-page"><Link className="availability-back" href="/owner"><ArrowLeft size={16} /> Back to owner dashboard</Link><div className="availability-heading"><div><p className="eyebrow">Equipment availability</p><h1>{data.listing?.title ?? "Equipment calendar"}</h1><p>Review bookings and block dates for maintenance or personal use.</p></div><CalendarDays size={34} /></div><div className="availability-layout"><section className="availability-calendar-card"><div className="availability-calendar-toolbar"><button type="button" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button><h2>{monthLabel}</h2><div><Button variant="outline" size="sm" onClick={() => { const now = new Date(); setMonth(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))); }}>Current month</Button><button type="button" onClick={() => move(1)} aria-label="Next month"><ChevronRight size={18} /></button></div></div><div className="availability-legend"><span><i className="available" /> Available</span><span><i className="unavailable" /> Unavailable</span><span><i className="booked" /> Booked</span><span><i className="in-progress" /> In progress</span></div><div className="availability-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div><div className="availability-grid">{days.map((date, index) => date ? <div className={`availability-day ${status(isoDate(date))}`} key={isoDate(date)}><strong>{date.getUTCDate()}</strong><small>{status(isoDate(date)) === "in-progress" ? "In progress" : status(isoDate(date)) === "unavailable" ? "Unavailable" : status(isoDate(date)) === "booked" ? "Booked" : "Available"}</small></div> : <div className="availability-day is-empty" key={`empty-${index}`} />)}</div>{loading ? <p className="availability-loading">Loading calendar…</p> : null}</section><aside className="availability-side"><form className="availability-block-form" onSubmit={saveBlock}><h2>{editingId ? "Edit blocked dates" : "Block dates"}</h2><p>Blocked dates cannot receive new rental requests.</p><label>Start date<Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>End date<Input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label><label>Reason <span>(optional)</span><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Maintenance, repair…" maxLength={200} /></label><Button type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Update block" : "Mark unavailable"}</Button>{editingId ? <button className="availability-cancel-edit" type="button" onClick={clearForm}>Cancel edit</button> : null}</form><div className="availability-blocks"><h2>Manual blocks</h2>{data.blocks?.length ? data.blocks.map((block) => <div className="availability-block" key={block.id}><div><strong>{block.start_date} → {block.end_date}</strong><span>{block.reason ?? "No reason provided"}</span></div><div className="availability-block-actions"><button type="button" aria-label="Edit unavailable dates" onClick={() => editBlock(block)}><Pencil size={15} /></button><button type="button" aria-label="Remove unavailable dates" onClick={() => void removeBlock(block.id)}><Trash2 size={16} /></button></div></div>) : <p>No manual blocks this month.</p>}</div></aside></div></main>;
}
