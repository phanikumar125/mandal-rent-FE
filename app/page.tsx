import Link from "next/link";
import { appModules, heroStats, languagePhrases } from "./_data/mandalrent";

const prdSteps = [
  "Authenticate and assign the correct role.",
  "Capture district, mandal, village, and language preferences.",
  "Publish owner listings with images and storage.",
  "Help farmers search, filter, favorite, and contact owners.",
  "Track operations in admin analytics and deployments.",
];

export default function HomePage() {
  return (
    <main className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] bg-[linear-gradient(135deg,_rgba(24,93,62,1),_rgba(71,137,92,1))] p-7 text-white shadow-[0_24px_80px_rgba(28,99,67,0.22)] sm:p-10">
          <p className="text-xs uppercase tracking-[0.34em] text-white/70">MandalRent V1</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
            Farm equipment rental for every mandal.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/84 sm:text-lg">
            {languagePhrases.en.greeting} The app is now organized as a Next.js portal with public marketing,
            auth, farmer discovery, owner tools, profile setup, and admin review areas.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[color:var(--accent)]">
              Start with demo account
            </Link>
            <Link href="/marketplace" className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white">
              Explore marketplace
            </Link>
            <Link href="/dashboard" className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white">
              Open portal
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {heroStats.map((item) => (
            <div key={item.label} className="rounded-[26px] border border-[color:var(--line)] bg-white p-5">
              <p className="text-3xl font-black tracking-tight text-[color:var(--accent)]">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">PRD flow</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">What is wired into the app</h2>
          <ol className="mt-5 space-y-3">
            {prdSteps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-[22px] bg-[color:var(--surface-soft)] px-4 py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-[color:var(--accent)]">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-[color:var(--muted)]">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Module map</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">The routes are ready</h2>
          <div className="mt-5 grid gap-3">
            {appModules.map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className="rounded-[22px] border border-white/70 bg-white px-4 py-4 transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{module.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{module.detail}</p>
                  </div>
                  <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">
                    Open
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Why this structure</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Built like a real product, not a one-page demo</h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
            The homepage introduces the app, while route groups keep the portal and auth flows organized. The pages are
            separate so we can connect Supabase auth, storage, and analytics without rewriting the whole UI.
          </p>
        </div>

        <div className="rounded-[28px] bg-[linear-gradient(135deg,_rgba(225,240,224,1),_rgba(246,248,241,1))] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">Feature slate</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--muted)]">
            <li>Role-based sign in and sign up paths.</li>
            <li>Location-aware profile setup.</li>
            <li>Marketplace filters and contact actions.</li>
            <li>Owner listing management with draft support.</li>
            <li>Admin analytics and master-data review.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
