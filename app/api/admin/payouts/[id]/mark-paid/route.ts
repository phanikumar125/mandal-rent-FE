import { NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";
import { notifyUser } from "@/lib/notifications";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    if (currentUser.profile.role !== "admin") return NextResponse.json({ error: "FORBIDDEN", message: "Admin access is required" }, { status: 403 });
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { reference?: string };
    const supabase = getSupabaseAdmin();
    const { data: payment, error: paymentError } = await supabase.from("payments").select("id, status, payout_status, owner_amount, owner_id, listing_id").eq("id", id).maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) return NextResponse.json({ error: "NOT_FOUND", message: "Payment was not found" }, { status: 404 });
    if (payment.status !== "paid" || payment.payout_status !== "eligible") return NextResponse.json({ error: "INVALID_PAYOUT", message: "Only eligible paid rentals can be marked as paid" }, { status: 409 });
    const { data: updated, error: updateError } = await supabase.from("payments").update({ payout_status: "paid", payout_paid_at: new Date().toISOString(), payout_reference: typeof body.reference === "string" ? body.reference.trim().slice(0, 120) || null : null }).eq("id", id).eq("status", "paid").eq("payout_status", "eligible").select("id, payout_status, payout_paid_at, payout_reference, owner_amount").maybeSingle();
    if (updateError) throw updateError;
    if (!updated) return NextResponse.json({ error: "INVALID_PAYOUT", message: "Payout changed before it was recorded" }, { status: 409 });
    const { data: listing } = await supabase.from("listings").select("title").eq("id", payment.listing_id).maybeSingle();
    await notifyUser(supabase, { userId: payment.owner_id, type: "payout_paid", title: "Payout marked as paid", message: `Your payout for ${listing?.title ?? "the rental"} was marked as paid.`, entityType: "payment", entityId: payment.id });
    return NextResponse.json({ payment: updated });
  } catch (error) {
    console.error("Admin mark payout paid API error", error);
    return NextResponse.json({ error: "PAYOUT_UPDATE_FAILED", message: "Unable to record payout" }, { status: 500 });
  }
}
