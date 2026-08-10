"use client";

import { useMemo, useState } from "react";
import { categories, equipmentListings } from "../../_data/mandalrent";

type Category = (typeof categories)[number];

type OwnedListing = (typeof equipmentListings)[number] & {
  status: "Live" | "Draft" | "Paused";
};

const initialListings: OwnedListing[] = equipmentListings.slice(0, 4).map((listing, index) => ({
  ...listing,
  status: index === 2 ? "Paused" : "Live",
}));

export default function ListingsPage() {
  const [items, setItems] = useState<OwnedListing[]>(initialListings);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<Category>(categories[0]);
  const [newPrice, setNewPrice] = useState("1200");

  const activeCount = useMemo(() => items.filter((item) => item.status === "Live").length, [items]);

  function addListing() {
    if (!newTitle.trim()) return;

    const nextItem: OwnedListing = {
      ...equipmentListings[0],
      id: Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      price: Number(newPrice) || 0,
      status: "Draft",
      verified: false,
      available: true,
      owner: "You",
      phone: "9000000000",
      district: "Krishna",
      mandal: "Kanchikacherla",
      village: "Moguluru",
      responseTime: "Just now",
      summary: "Draft listing added from the owner workspace.",
      features: ["Awaiting image upload", "Awaiting review"],
      rating: 0,
    };

    setItems((current) => [nextItem, ...current]);
    setNewTitle("");
    setNewPrice("1200");
  }

  function toggleStatus(id: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: item.status === "Live" ? "Paused" : "Live", available: !item.available } : item,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Owner workspace</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Manage listings and availability</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[20px] bg-[color:var(--surface-soft)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Live listings</p>
              <p className="mt-1 text-2xl font-black">{activeCount}</p>
            </div>
            <div className="rounded-[20px] bg-[color:var(--surface-soft)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Drafts</p>
              <p className="mt-1 text-2xl font-black">{items.filter((item) => item.status === "Draft").length}</p>
            </div>
            <div className="rounded-[20px] bg-[color:var(--surface-soft)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Lead flow</p>
              <p className="mt-1 text-2xl font-black">14</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.6fr_0.4fr_auto]">
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Equipment name</span>
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Add tractor, harvester, drone..."
              className="mt-2 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Category</span>
            <select
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value as Category)}
              className="mt-2 w-full bg-transparent text-sm outline-none"
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Price INR</span>
            <input
              value={newPrice}
              onChange={(event) => setNewPrice(event.target.value)}
              inputMode="numeric"
              className="mt-2 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <button
            type="button"
            onClick={addListing}
            className="rounded-2xl bg-[color:var(--accent)] px-5 py-4 text-sm font-semibold text-white"
          >
            Add draft
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">{item.category}</p>
                <h3 className="mt-1 text-xl font-black tracking-tight">{item.title}</h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                  {item.status}
                </span>
                <button
                  type="button"
                  onClick={() => toggleStatus(item.id)}
                  className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-xs font-semibold"
                >
                  Toggle availability
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] bg-[color:var(--surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Pricing</p>
                <p className="mt-1 text-lg font-black">INR {item.price.toLocaleString()}/{item.unit}</p>
              </div>
              <div className="rounded-[20px] bg-[color:var(--surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Lead response</p>
                <p className="mt-1 text-lg font-black">{item.responseTime}</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">{item.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.features.map((feature) => (
                <span key={feature} className="rounded-full bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                  {feature}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
