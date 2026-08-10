"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categories, equipmentListings } from "../../_data/mandalrent";

const districtOptions = ["All districts", "Krishna", "Guntur", "West Godavari"] as const;

export default function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState<(typeof districtOptions)[number]>("All districts");
  const [category, setCategory] = useState("All");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number>(equipmentListings[0]?.id ?? 0);

  const filtered = useMemo(() => {
    return equipmentListings.filter((listing) => {
      const matchesQuery =
        listing.title.toLowerCase().includes(query.toLowerCase()) ||
        listing.owner.toLowerCase().includes(query.toLowerCase()) ||
        listing.village.toLowerCase().includes(query.toLowerCase());
      const matchesDistrict = district === "All districts" || listing.district === district;
      const matchesCategory = category === "All" || listing.category === category;
      const matchesAvailability = !availableOnly || listing.available;
      const matchesVerified = !verifiedOnly || listing.verified;
      return matchesQuery && matchesDistrict && matchesCategory && matchesAvailability && matchesVerified;
    });
  }, [availableOnly, category, district, query, verifiedOnly]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? equipmentListings[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-5">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Marketplace</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Search equipment near your mandal</h2>
            </div>
            <Link href="/listings" className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white">
              List equipment
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_repeat(3,minmax(0,0.8fr))]">
            <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tractor, rotavator, drone, owner..."
                className="mt-2 w-full bg-transparent text-sm outline-none"
              />
            </label>
            <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">District</span>
              <select
                value={district}
                onChange={(event) => setDistrict(event.target.value as (typeof districtOptions)[number])}
                className="mt-2 w-full bg-transparent text-sm outline-none"
              >
                {districtOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full bg-transparent text-sm outline-none">
                <option>All</option>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <button
                type="button"
                onClick={() => setAvailableOnly((value) => !value)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                  availableOnly
                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                    : "border-[color:var(--line)] bg-white text-[color:var(--ink)]"
                }`}
              >
                Available only
              </button>
              <button
                type="button"
                onClick={() => setVerifiedOnly((value) => !value)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                  verifiedOnly
                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                    : "border-[color:var(--line)] bg-white text-[color:var(--ink)]"
                }`}
              >
                Verified only
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((listing) => {
            const favorite = favorites.includes(listing.id);

            return (
              <button
                key={listing.id}
                type="button"
                onClick={() => setSelectedId(listing.id)}
                className={`rounded-[26px] border p-4 text-left transition ${
                  selected?.id === listing.id
                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[0_14px_30px_rgba(28,99,67,0.12)]"
                    : "border-[color:var(--line)] bg-white hover:border-[color:var(--accent-soft)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      {listing.category}
                    </p>
                    <h3 className="mt-1 text-lg font-black tracking-tight">{listing.title}</h3>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[color:var(--accent)]">
                    {favorite ? "Saved" : "Tap"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{listing.summary}</p>
                <div className="mt-4 flex items-center justify-between text-sm font-semibold">
                  <span>
                    INR {listing.price.toLocaleString()}/{listing.unit}
                  </span>
                  <span className={listing.available ? "text-[color:var(--accent)]" : "text-[#a35534]"}>
                    {listing.available ? "Available now" : "Busy"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--muted)]">
                  <span>
                    {listing.mandal}, {listing.district}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFavorites((current) =>
                        current.includes(listing.id) ? current.filter((id) => id !== listing.id) : [...current, listing.id],
                      );
                    }}
                    className="rounded-full bg-white px-3 py-1 font-semibold text-[color:var(--accent)]"
                  >
                    {favorite ? "Remove favorite" : "Save"}
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="space-y-5">
        {selected && (
          <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Selected listing</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight">{selected.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{selected.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] bg-[color:var(--surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Contact owner</p>
                <p className="mt-2 font-semibold">{selected.owner}</p>
                <p className="text-sm text-[color:var(--muted)]">{selected.phone}</p>
              </div>
              <div className="rounded-[20px] bg-[color:var(--surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Response time</p>
                <p className="mt-2 font-semibold">{selected.responseTime}</p>
                <p className="text-sm text-[color:var(--muted)]">
                  {selected.verified ? "Verified owner" : "Verification pending"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.features.map((feature) => (
                <span key={feature} className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                  {feature}
                </span>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href={`tel:${selected.phone}`}
                className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Call owner
              </a>
              <a
                href={`https://wa.me/91${selected.phone}`}
                className="rounded-full border border-[color:var(--line)] px-4 py-2 text-center text-sm font-semibold"
              >
                WhatsApp
              </a>
            </div>
          </div>
        )}

        <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--accent-soft)] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">PRD coverage</p>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-[color:var(--muted)]">
            <li>District, mandal, and village-aware discovery.</li>
            <li>Favorites and quick owner contact actions.</li>
            <li>Verified badge, availability, and response-time signals.</li>
            <li>Ready for storage-backed images and live Supabase data.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
