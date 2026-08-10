import Link from "next/link";
import { portalNav } from "../_data/mandalrent";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,230,206,0.9),_rgba(243,245,238,1)_40%,_rgba(233,241,233,1)_100%)] text-[color:var(--ink)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_24px_80px_rgba(26,42,36,0.08)] backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[color:var(--accent)] text-base font-black text-white">
              MR
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight">MandalRent</span>
              <span className="block text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Portal workspace
              </span>
            </span>
          </Link>

          <p className="mt-6 text-sm leading-6 text-[color:var(--muted)]">
            Built around the PRD modules for farmers, owners, and admins.
          </p>

          <nav className="mt-8 space-y-2">
            {portalNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent-soft)] hover:bg-[color:var(--accent-soft)]"
              >
                <span>{item.label}</span>
                <span className="text-[color:var(--muted)]">/</span>
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-[24px] bg-[linear-gradient(135deg,_rgba(24,93,62,1),_rgba(56,123,82,1))] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Demo session</p>
            <h2 className="mt-2 text-lg font-black">Launch-ready structure</h2>
            <p className="mt-2 text-sm leading-6 text-white/80">
              The portal is wired for auth, profile setup, listings, marketplace search, and admin review.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-center text-xs text-[color:var(--muted)]">
            <div className="rounded-2xl bg-[color:var(--surface-soft)] p-3">
              <span className="block text-lg font-black text-[color:var(--ink)]">EN</span>
              English
            </div>
            <div className="rounded-2xl bg-[color:var(--surface-soft)] p-3">
              <span className="block text-lg font-black text-[color:var(--ink)]">TE</span>
              Telugu ready
            </div>
          </div>
        </aside>

        <main className="rounded-[32px] border border-white/70 bg-white/65 shadow-[0_24px_80px_rgba(26,42,36,0.08)] backdrop-blur">
          <div className="border-b border-[color:var(--line)] px-5 py-4 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  MandalRent portal
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  One app for discovery, booking, and operations
                </h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/marketplace"
                  className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  Open marketplace
                </Link>
                <Link
                  href="/register"
                  className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-8 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
