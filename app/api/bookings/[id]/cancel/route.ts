import { NextResponse } from "next/server";
import { isCancellable } from "@/lib/booking-status";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";
import { notifyUser } from "@/lib/notifications";

function fail(message: string, status: number) {
  return NextResponse.json({ error: "BOOKING_CANCEL_FAILED", message }, { status });
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return fail("Authentication is required", 401);
    if (currentUser.profile.role !== "farmer" && currentUser.profile.role !== "owner") return fail("Farmer or owner access is required", 403);
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const { data: booking, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id, listing_id, requester_id, owner_id, rental_status, payment_status")
      .eq("id", id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return fail("Booking was not found", 404);
    const isActor = booking.requester_id === currentUser.profile.id || booking.owner_id === currentUser.profile.id;
    if (!isActor) return fail("You are not authorized to cancel this booking", 403);
    if (!isCancellable(booking.rental_status)) return fail("This booking cannot be cancelled after the rental has started", 409);

    const { data: updated, error: updateError } = await supabase
      .from("booking_requests")
      .update({ rental_status: "cancelled" })
      .eq("id", booking.id)
      .eq("rental_status", booking.rental_status)
      .select("id, rental_status, updated_at")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) return fail("Booking changed before cancellation completed. Refresh and try again", 409);

    const refundRequired = booking.payment_status === "paid";
    if (refundRequired) {
      const { error: payoutError } = await supabase
        .from("payments")
        .update({ payout_status: "not_applicable" })
        .eq("booking_request_id", booking.id)
        .eq("status", "paid");
      if (payoutError) throw payoutError;
    }
    const { data: listing } = await supabase.from("listings").select("title").eq("id", booking.listing_id).maybeSingle();
    const recipientId = booking.requester_id === currentUser.profile.id ? booking.owner_id : booking.requester_id;
    await notifyUser(supabase, { userId: recipientId, type: "booking_cancelled", title: "Booking cancelled", message: `${listing?.title ?? "The equipment booking"} was cancelled.`, entityType: "booking", entityId: booking.id });
    return NextResponse.json({ booking: updated, refundRequired });
  } catch (error) {
    console.error("Booking cancellation API error", error);
    return fail("Unable to cancel booking", 500);
  }
}
