import { NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    if (currentUser.profile.role !== "admin") return NextResponse.json({ error: "FORBIDDEN", message: "Admin access is required" }, { status: 403 });
    const supabase = getSupabaseAdmin();
    const { data: bookings, error } = await supabase.from("booking_requests").select("id, listing_id, requester_id, owner_id, transaction_type, rental_start, rental_end, duration_days, rental_amount, delivery_charge, total_amount, rental_status, payment_status, created_at, updated_at").order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    const rows = bookings ?? [];
    const ids = [...new Set(rows.flatMap((row) => [row.requester_id, row.owner_id]))];
    const listingIds = [...new Set(rows.map((row) => row.listing_id))];
    const [{ data: profiles, error: profilesError }, { data: listings, error: listingsError }] = await Promise.all([
      ids.length ? supabase.from("profiles").select("id, full_name").in("id", ids) : Promise.resolve({ data: [], error: null }),
      listingIds.length ? supabase.from("listings").select("id, title").in("id", listingIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (profilesError || listingsError) throw profilesError ?? listingsError;
    const bookingIds = rows.map((row) => row.id);
    const { data: payments, error: paymentsError } = bookingIds.length ? await supabase.from("payments").select("id, booking_request_id, status, gateway_payment_id, gross_amount, platform_commission, owner_amount, payout_status, paid_at, payout_paid_at, payout_reference").in("booking_request_id", bookingIds) : { data: [], error: null };
    if (paymentsError) throw paymentsError;
    const profileById = new Map((profiles ?? []).map((item) => [item.id, item.full_name]));
    const listingById = new Map((listings ?? []).map((item) => [item.id, item.title]));
    const paymentByBooking = new Map((payments ?? []).map((item) => [item.booking_request_id, item]));
    return NextResponse.json({ bookings: rows.map((row) => ({ ...row, farmer_name: profileById.get(row.requester_id) ?? "Farmer", owner_name: profileById.get(row.owner_id) ?? "Owner", listing_title: listingById.get(row.listing_id) ?? "Equipment", payment: paymentByBooking.get(row.id) ?? null })) });
  } catch (error) {
    console.error("Admin bookings API error", error);
    return NextResponse.json({ error: "ADMIN_BOOKINGS_FAILED", message: "Unable to load bookings" }, { status: 500 });
  }
}
