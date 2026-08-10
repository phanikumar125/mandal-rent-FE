import Link from "next/link";
import { farmerTasks, heroStats, ownerPipeline } from "../../_data/mandalrent";

const activityFeed = [
  {
    title: "New booking request",
    detail: "A farmer from Kanchikacherla asked for a tractor tomorrow morning.",
    tag: "WhatsApp",
  },
  {
    title: "Owner updated availability",
    detail: "A rotavator slot opened after a rain delay was cleared.",
    tag: "Live",
  },
  {
    title: "Admin review completed",
    detail: "One profile and two listings were approved for publication.",
    tag: "Verified",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[28px] bg-[linear-gradient(135deg,_rgba(28,99,67,1),_rgba(70,142,96,1))] p-6 text-white shadow-[0_24px_70px_rgba(28,99,67,0.22)]">
          <p className="text-xs uppercase tracking-[0.32em] text-white/70">Today in MandalRent</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            Keep farmers moving with fast availability, direct contact, and trusted local supply.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
            This dashboard brings together the PRD flow for owners and farmers, then leaves room for Supabase-backed
            auth, profiles, storage, and analytics to plug in later.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/marketplace" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[color:var(--accent)]">
              Search nearby equipment
            </Link>
            <Link href="/listings" className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white">
              Manage my listings
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {heroStats.map((item) => (
            <div key={item.label} className="rounded-[24px] border border-[color:var(--line)] bg-white p-5">
              <p className="text-3xl font-black tracking-tight text-[color:var(--accent)]">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Operations</p>
              <h3 className="mt-1 text-xl font-black">Owner pipeline</h3>
            </div>
            <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">
              Demo data
            </span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {ownerPipeline.map((item) => (
              <div key={item.label} className="rounded-[22px] bg-[color:var(--surface-soft)] p-4">
                <p className="text-sm font-semibold text-[color:var(--muted)]">{item.label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Farmer priorities</p>
          <h3 className="mt-1 text-xl font-black">Tasks and reminders</h3>
          <div className="mt-5 space-y-3">
            {farmerTasks.map((task) => (
              <div key={task.title} className="rounded-[20px] border border-[color:var(--line)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{task.title}</p>
                  <span className="rounded-full bg-[color:var(--surface-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--muted)]">
                    {task.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{task.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Live feed</p>
          <h3 className="mt-1 text-xl font-black">Recent activity</h3>
          <div className="mt-5 space-y-4">
            {activityFeed.map((item) => (
              <div key={item.title} className="rounded-[22px] bg-[color:var(--surface-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.title}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[color:var(--accent)]">
                    {item.tag}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] bg-[color:var(--accent-soft)] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">Next steps</p>
          <h3 className="mt-1 text-xl font-black">Where the real backend plugs in</h3>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-[color:var(--muted)]">
            <li>Supabase auth for login, registration, and session persistence.</li>
            <li>Profiles table for role, language, district, mandal, and village.</li>
            <li>Listings and image storage for owner equipment management.</li>
            <li>Messaging, WhatsApp links, call tracking, and admin analytics.</li>
          </ul>
          <Link
            href="/profile"
            className="mt-6 inline-flex rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Complete profile setup
          </Link>
        </div>
      </section>
    </div>
  );
}
