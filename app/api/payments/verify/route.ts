import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";
import { verifyRazorpayPayment } from "@/lib/razorpay";

function fail(message: string, status: number) {
  return NextResponse.json({ error: "PAYMENT_FAILED", message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return fail("Authentication is required", 401);
    if (currentUser.profile.role !== "farmer") return fail("Farmer access is required", 403);
    const body = (await request.json()) as { bookingRequestId?: string; razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
    if (!body.bookingRequestId || !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) return fail("Incomplete payment confirmation", 400);
    if (!verifyRazorpayPayment(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) return fail("Payment signature could not be verified", 400);

    const supabase = getSupabaseAdmin();
    const { data: payment, error: paymentError } = await supabase.from("payments").select("id, booking_request_id, farmer_id, gateway_order_id, status").eq("booking_request_id", body.bookingRequestId).eq("gateway_order_id", body.razorpay_order_id).eq("farmer_id", currentUser.profile.id).maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) return fail("Payment record was not found", 404);
    if (payment.status === "paid") return NextResponse.json({ payment: { id: payment.id, status: "paid" }, bookingRequest: { id: payment.booking_request_id, payment_status: "paid", rental_status: "confirmed" } });

    const { data: updatedPayment, error: updatePaymentError } = await supabase.from("payments").update({ gateway_payment_id: body.razorpay_payment_id, status: "paid", paid_at: new Date().toISOString() }).eq("id", payment.id).select("id, booking_request_id, gateway_payment_id, amount, currency, status, paid_at").single();
    if (updatePaymentError) throw updatePaymentError;
    const { data: bookingRequest, error: bookingError } = await supabase.from("booking_requests").update({ payment_status: "paid", rental_status: "confirmed", status: "booked" }).eq("id", payment.booking_request_id).eq("requester_id", currentUser.profile.id).select("id, listing_id, owner_id, rental_start, rental_end, total_amount, rental_status, payment_status").single();
    if (bookingError) throw bookingError;
    return NextResponse.json({ payment: updatedPayment, bookingRequest });
  } catch (error) {
    console.error("Payment verification API error", error);
    return fail("Unable to verify payment", 500);
  }
}
