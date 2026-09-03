import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server-auth";
import { verifyRazorpayWebhook } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  try {
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    if (!signature || !verifyRazorpayWebhook(rawBody, signature)) return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    const event = JSON.parse(rawBody) as { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string; method?: string } } } };
    const entity = event.payload?.payment?.entity;
    if (!entity?.order_id) return NextResponse.json({ received: true });
    const supabase = getSupabaseAdmin();
    const paid = event.event === "payment.captured" || event.event === "order.paid";
    const failed = event.event === "payment.failed";
    if (!paid && !failed) return NextResponse.json({ received: true });
    const status = paid ? "paid" : "failed";
    const { data: payment, error: paymentError } = await supabase.from("payments").update({ gateway_payment_id: entity.id ?? null, status, payment_method: entity.method === "upi" || entity.method === "card" ? entity.method : null, paid_at: paid ? new Date().toISOString() : null }).eq("gateway_order_id", entity.order_id).select("id, booking_request_id").maybeSingle();
    if (paymentError) throw paymentError;
    if (payment) {
      await supabase.from("booking_requests").update({ payment_status: status, rental_status: paid ? "confirmed" : "requested", status: paid ? "booked" : "new" }).eq("id", payment.booking_request_id);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook API error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
