import { NextResponse } from "next/server";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    if (currentUser.profile.role !== "admin") return NextResponse.json({ error: "FORBIDDEN", message: "Admin access is required" }, { status: 403 });
    const { id } = await context.params; const body = (await request.json().catch(() => ({}))) as { status?: string };
    if (!body.status || !["live", "paused", "archived"].includes(body.status)) return NextResponse.json({ error: "INVALID_STATUS", message: "Choose a valid listing status" }, { status: 400 });
    const supabase = getSupabaseAdmin(); const { data: listing, error: listingError } = await supabase.from("listings").select("id, owner_id, status").eq("id", id).maybeSingle();
    if (listingError) throw listingError; if (!listing) return NextResponse.json({ error: "NOT_FOUND", message: "Listing was not found" }, { status: 404 });
    if (["paused", "archived"].includes(body.status)) { const { count, error: activeError } = await supabase.from("booking_requests").select("id", { count: "exact", head: true }).eq("listing_id", id).in("rental_status", ["confirmed", "in_progress"]); if (activeError) throw activeError; if ((count ?? 0) > 0) return NextResponse.json({ error: "ACTIVE_RENTAL", message: "This listing has an active rental and cannot be moderated until completion" }, { status: 409 }); }
    const { data: updated, error: updateError } = await supabase.from("listings").update({ status: body.status, available: body.status === "live" }).eq("id", id).select("id, status, available, updated_at").single();
    if (updateError) throw updateError;
    await recordAdminAudit(supabase, currentUser.profile.id, `${body.status === "live" ? "restore" : body.status === "paused" ? "pause" : "archive"}_listing`, "listing", id, { from: listing.status, to: body.status });
    return NextResponse.json({ listing: updated });
  } catch (error) { console.error("Admin listing moderation API error", error); return NextResponse.json({ error: "LISTING_MODERATION_FAILED", message: "Unable to update listing" }, { status: 500 }); }
}
