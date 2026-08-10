"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("9876543210");
  const [password, setPassword] = useState("");

  function handleSubmit() {
    localStorage.setItem(
      "mandalrent-session",
      JSON.stringify({
        role: "farmer",
        phone,
        signedInAt: new Date().toISOString(),
      }),
    );
    router.push("/dashboard");
  }

  return (
    <main className="grid min-h-[calc(100vh-2rem)] place-items-center py-8">
      <section className="w-full max-w-md rounded-[32px] border border-[color:var(--line)] bg-white p-6 shadow-[0_24px_80px_rgba(26,42,36,0.08)] sm:p-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[color:var(--accent)] text-base font-black text-white">
            MR
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight">MandalRent</span>
            <span className="block text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Authentication</span>
          </span>
        </Link>

        <p className="mt-8 text-xs uppercase tracking-[0.32em] text-[color:var(--muted)]">Welcome back</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Sign in to continue</h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          This is the first integrated auth screen. It currently uses local demo session state and can later switch to
          Supabase without changing the route structure.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Phone</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              className="mt-2 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <label className="block rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="mt-2 w-full bg-transparent text-sm outline-none"
            />
          </label>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white"
          >
            Sign in
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 text-sm">
          <Link href="/register" className="font-semibold text-[color:var(--accent)]">
            Create account
          </Link>
          <Link href="/dashboard" className="font-semibold text-[color:var(--accent)]">
            Skip to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
