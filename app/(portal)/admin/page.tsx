"use client";

import { useEffect, useState } from "react";

type Overview = {
  locations: { districts: number; mandals: number; villages: number };
  transactions: number;
  grossAmount: number;
  platformCommission: number;
  ownerPayable: number;
  ownerPaid: number;
  failedPayments: number;
  refundedPayments: number;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/overview", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as Overview & { message?: string };
        if (!response.ok) throw new Error(body.message ?? "Unable to load admin metrics");
        setOverview(body);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load admin metrics"));
  }, []);

  const metrics = overview
    ? [
        ["Transactions", String(overview.transactions)],
        ["Gross transaction value", money(overview.grossAmount)],
        ["Platform commission", money(overview.platformCommission)],
        ["Owner payable", money(overview.ownerPayable)],
        ["Owner paid", money(overview.ownerPaid)],
        ["Failed payments", String(overview.failedPayments)],
        ["Refunded payments", String(overview.refundedPayments)],
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Admin panel</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">Payments and platform revenue</h2>
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-[22px] bg-[color:var(--surface-soft)] p-4">
              <p className="text-sm font-semibold text-[color:var(--muted)]">{label}</p>
              <p className="mt-2 text-2xl font-black">{value}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--accent-soft)] p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">Coverage</p>
        <h3 className="mt-1 text-xl font-black">Location master data</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(["districts", "mandals", "villages"] as const).map((key) => (
            <div key={key} className="rounded-[20px] bg-white p-4">
              <p className="text-sm font-semibold capitalize text-[color:var(--muted)]">{key}</p>
              <p className="mt-2 text-3xl font-black">{overview?.locations[key] ?? "—"}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-[color:var(--muted)]">
          Platform revenue is the commission on rental amounts. Delivery charges are included in the owner payable amount.
        </p>
      </section>
    </div>
  );
}
