import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md rounded-[28px] border border-[color:var(--line)] bg-white p-8 text-center shadow-[0_24px_80px_rgba(26,42,36,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Page not found</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">We could not find that route.</h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          Try the dashboard, marketplace, or go back to the home page.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white">
          Back home
        </Link>
      </div>
    </main>
  );
}
