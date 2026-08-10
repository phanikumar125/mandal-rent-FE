import { adminOverview, districtLocations, equipmentListings } from "../../_data/mandalrent";

const reviewQueue = [
  {
    title: "Verify new owner profile",
    detail: "Pending government ID and equipment proof from a new owner in Krishna.",
  },
  {
    title: "Approve listing images",
    detail: "Two listings need storage uploads before the app can publish them live.",
  },
  {
    title: "Check lead response SLAs",
    detail: "Three owners have slower WhatsApp response times than target.",
  },
];

export default function AdminPage() {
  const mandalCount = districtLocations.reduce((count, district) => count + district.mandals.length, 0);
  const villageCount = districtLocations.reduce(
    (count, district) => count + district.mandals.reduce((inner, mandal) => inner + mandal.villages.length, 0),
    0,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Admin panel</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">Master data and operational view</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {adminOverview.map((item) => (
            <div key={item.label} className="rounded-[22px] bg-[color:var(--surface-soft)] p-4">
              <p className="text-sm font-semibold text-[color:var(--muted)]">{item.label}</p>
              <p className="mt-2 text-3xl font-black">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Review queue</p>
          <h3 className="mt-1 text-xl font-black">Items requiring approval</h3>
          <div className="mt-5 space-y-3">
            {reviewQueue.map((item) => (
              <div key={item.title} className="rounded-[22px] border border-[color:var(--line)] px-4 py-4">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--accent-soft)] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">Coverage</p>
          <h3 className="mt-1 text-xl font-black">Location master data</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] bg-white p-4">
              <p className="text-sm font-semibold text-[color:var(--muted)]">Districts</p>
              <p className="mt-2 text-3xl font-black">{districtLocations.length}</p>
            </div>
            <div className="rounded-[20px] bg-white p-4">
              <p className="text-sm font-semibold text-[color:var(--muted)]">Mandals</p>
              <p className="mt-2 text-3xl font-black">{mandalCount}</p>
            </div>
            <div className="rounded-[20px] bg-white p-4">
              <p className="text-sm font-semibold text-[color:var(--muted)]">Villages</p>
              <p className="mt-2 text-3xl font-black">{villageCount}</p>
            </div>
            <div className="rounded-[20px] bg-white p-4">
              <p className="text-sm font-semibold text-[color:var(--muted)]">Listings</p>
              <p className="mt-2 text-3xl font-black">{equipmentListings.length}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[color:var(--muted)]">
            This area is the admin landing zone for master data, verification flow, and analytics once Supabase tables
            are connected.
          </p>
        </div>
      </section>
    </div>
  );
}
