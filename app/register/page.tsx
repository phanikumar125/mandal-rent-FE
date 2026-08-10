"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"farmer" | "owner">("farmer");
  const [fullName, setFullName] = useState("Anil Reddy");
  const [phone, setPhone] = useState("9876543210");

  function handleCreateAccount() {
    localStorage.setItem(
      "mandalrent-session",
      JSON.stringify({
        role,
        fullName,
        phone,
        signedInAt: new Date().toISOString(),
      }),
    );
    router.push(role === "owner" ? "/listings" : "/profile");
  }

  return (
    <main className="grid min-h-[calc(100vh-2rem)] place-items-center py-8">
      <section className="w-full max-w-lg rounded-[32px] border border-[color:var(--line)] bg-white p-6 shadow-[0_24px_80px_rgba(26,42,36,0.08)] sm:p-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[color:var(--accent)] text-base font-black text-white">
            MR
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight">MandalRent</span>
            <span className="block text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Create account</span>
          </span>
        </Link>

        <p className="mt-8 text-xs uppercase tracking-[0.32em] text-[color:var(--muted)]">Join the network</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Choose how you will use the app</h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          Farmer and owner paths are separated now, which sets us up for role-based auth and tailored dashboards.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole("farmer")}
            className={`rounded-[24px] border p-4 text-left ${
              role === "farmer"
                ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                : "border-[color:var(--line)] bg-[color:var(--surface-soft)]"
            }`}
          >
            <p className="text-sm font-black">Farmer</p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">Search equipment and book fast.</p>
          </button>
          <button
            type="button"
            onClick={() => setRole("owner")}
            className={`rounded-[24px] border p-4 text-left ${
              role === "owner"
                ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                : "border-[color:var(--line)] bg-[color:var(--surface-soft)]"
            }`}
          >
            <p className="text-sm font-black">Owner</p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">List equipment and manage leads.</p>
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Full name</span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full bg-transparent text-sm outline-none" />
          </label>
          <label className="block rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Phone</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" className="mt-2 w-full bg-transparent text-sm outline-none" />
          </label>
          <button
            type="button"
            onClick={handleCreateAccount}
            className="w-full rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white"
          >
            Create account
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-[color:var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[color:var(--accent)]">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
