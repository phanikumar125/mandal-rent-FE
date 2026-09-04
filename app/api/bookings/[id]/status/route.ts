import { NextRequest, NextResponse } from "next/server";
import { canTransition, type RentalStatus } from "@/lib/booking-status";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";
import { notifyAdmins, notifyUser } from "@/lib/notifications";

function fail(message: string, status: number) {
  return NextResponse.json({ error: "BOOKING_STATUS_FAILED", message }, { status });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return fail("Authentication is required", 401);
    if (currentUser.profile.role !== "owner") return fail("Owner access is required", 403);

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { status?: string };
    const nextStatus = body.status as RentalStatus | undefined;
    if (nextStatus !== "in_progress" && nextStatus !== "completed") return fail("Unsupported booking status", 400);

    const supabase = getSupabaseAdmin();
    const { data: booking, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id, listing_id, requester_id, owner_id, rental_status, payment_status")
      .eq("id", id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return fail("Booking was not found", 404);
    if (booking.owner_id !== currentUser.profile.id) return fail("You are not authorized to manage this booking", 403);
    if (!canTransition(booking.rental_status, nextStatus)) {
      return fail(nextStatus === "in_progress" ? "Only confirmed rentals can be started" : "Only rentals in progress can be completed", 409);
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, status, payout_status")
      .eq("booking_request_id", booking.id)
      .maybeSingle();
    if (paymentError) throw paymentError;
    if (booking.payment_status !== "paid" && payment?.status !== "paid") return fail("Payment has not been verified", 409);

    const { data: updated, error: updateError } = await supabase
      .from("booking_requests")
      .update({ rental_status: nextStatus })
      .eq("id", booking.id)
      .eq("owner_id", currentUser.profile.id)
      .eq("rental_status", booking.rental_status)
      .select("id, rental_status, updated_at")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) return fail("Booking changed before this action completed. Refresh and try again", 409);

    if (nextStatus === "completed" && payment?.id && payment.status === "paid") {
      const { error: payoutError } = await supabase
        .from("payments")
        .update({ payout_status: "eligible" })
        .eq("id", payment.id)
        .eq("status", "paid")
        .in("payout_status", ["pending", "eligible"]);
      if (payoutError) throw payoutError;
    }

    const { data: listing } = await supabase.from("listings").select("title").eq("id", booking.listing_id).maybeSingle();
    const title = listing?.title ?? "your equipment rental";
    if (nextStatus === "in_progress") {
      await notifyUser(supabase, { userId: booking.requester_id, type: "rental_started", title: "Rental started", message: `Your ${title} rental has been started by the owner.`, entityType: "booking", entityId: booking.id });
    } else {
      await Promise.all([
        notifyUser(supabase, { userId: booking.requester_id, type: "rental_completed", title: "Rental completed", message: `Your ${title} rental has been completed.`, entityType: "booking", entityId: booking.id }),
        notifyUser(supabase, { userId: booking.owner_id, type: "payout_eligible", title: "Payout eligible", message: `Your payout for ${title} is now eligible.`, entityType: "payment", entityId: payment?.id ?? booking.id }),
        notifyAdmins(supabase, { type: "admin_payout_eligible", title: "Payout ready", message: `A payout for ${title} is ready for review.`, entityType: "payment", entityId: payment?.id ?? booking.id }),
      ]);
    }

    return NextResponse.json({ booking: updated, payoutStatus: nextStatus === "completed" ? "eligible" : payment?.payout_status ?? "pending" });
  } catch (error) {
    console.error("Booking status API error", error);
    return fail("Unable to update booking status", 500);
  }
}
