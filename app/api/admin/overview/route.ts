import { NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    if (currentUser.profile.role !== "admin") return NextResponse.json({ error: "FORBIDDEN", message: "Admin access is required" }, { status: 403 });

    const supabase = getSupabaseAdmin();
    const [{ count: districts, error: districtsError }, { count: mandals, error: mandalsError }, { count: villages, error: villagesError }, { data: payments, error: paymentsError }] = await Promise.all([
      supabase.from("districts").select("id", { count: "exact", head: true }),
      supabase.from("mandals").select("id", { count: "exact", head: true }),
      supabase.from("villages").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("status, amount, gross_amount, platform_commission, owner_amount, payout_status"),
    ]);
    if (districtsError || mandalsError || villagesError || paymentsError) throw districtsError ?? mandalsError ?? villagesError ?? paymentsError;

    const rows = payments ?? [];
    const sum = (field: "gross_amount" | "platform_commission" | "owner_amount", predicate: (row: (typeof rows)[number]) => boolean = () => true) =>
      rows.filter(predicate).reduce((total, row) => total + Number(row[field] ?? 0), 0);
    return NextResponse.json({
      locations: { districts: districts ?? 0, mandals: mandals ?? 0, villages: villages ?? 0 },
      transactions: rows.length,
      grossAmount: sum("gross_amount"),
      platformCommission: sum("platform_commission", (row) => row.status === "paid"),
      ownerPayable: sum("owner_amount", (row) => row.status === "paid" && row.payout_status !== "paid"),
      ownerPaid: sum("owner_amount", (row) => row.status === "paid" && row.payout_status === "paid"),
      failedPayments: rows.filter((row) => row.status === "failed").length,
      refundedPayments: rows.filter((row) => row.status === "refunded").length,
    });
  } catch (error) {
    console.error("Admin overview API error", error);
    return NextResponse.json({ error: "ADMIN_OVERVIEW_FAILED", message: "Unable to load admin metrics" }, { status: 500 });
  }
}
