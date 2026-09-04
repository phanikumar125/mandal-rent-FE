import { NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    if (currentUser.profile.role !== "admin") return NextResponse.json({ error: "FORBIDDEN", message: "Admin access is required" }, { status: 403 });
    const supabase = getSupabaseAdmin();
    const { data: payments, error } = await supabase.from("payments").select("id, booking_request_id, farmer_id, owner_id, listing_id, amount, status, gross_amount, platform_commission, owner_amount, payout_status, gateway_payment_id, created_at, paid_at, payout_paid_at, payout_reference").order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    const rows = payments ?? [];
    const profileIds = [...new Set(rows.flatMap((row) => [row.farmer_id, row.owner_id]))];
    const listingIds = [...new Set(rows.map((row) => row.listing_id))];
    const bookingIds = [...new Set(rows.map((row) => row.booking_request_id))];
    const [{ data: profiles, error: profilesError }, { data: listings, error: listingsError }, { data: bookings, error: bookingsError }] = await Promise.all([
      profileIds.length ? supabase.from("profiles").select("id, full_name").in("id", profileIds) : Promise.resolve({ data: [], error: null }),
      listingIds.length ? supabase.from("listings").select("id, title").in("id", listingIds) : Promise.resolve({ data: [], error: null }),
      bookingIds.length ? supabase.from("booking_requests").select("id, rental_start, rental_end, rental_status").in("id", bookingIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (profilesError || listingsError || bookingsError) throw profilesError ?? listingsError ?? bookingsError;
    const profileById = new Map((profiles ?? []).map((item) => [item.id, item.full_name]));
    const listingById = new Map((listings ?? []).map((item) => [item.id, item.title]));
    const bookingById = new Map((bookings ?? []).map((item) => [item.id, item]));
    return NextResponse.json({ payments: rows.map((row) => ({ ...row, farmer_name: profileById.get(row.farmer_id) ?? "Farmer", owner_name: profileById.get(row.owner_id) ?? "Owner", listing_title: listingById.get(row.listing_id) ?? "Equipment", booking: bookingById.get(row.booking_request_id) ?? null })) });
  } catch (error) {
    console.error("Admin payments API error", error);
    return NextResponse.json({ error: "ADMIN_PAYMENTS_FAILED", message: "Unable to load payments" }, { status: 500 });
  }
}
