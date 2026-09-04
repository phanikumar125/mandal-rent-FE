import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

function monthBounds(value: string | null) {
  const month = value && /^\d{4}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 7);
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || monthNumber < 1 || monthNumber > 12) return null;
  const start = `${month}-01`;
  const end = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  return { month, start, end };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    const { id } = await context.params;
    const bounds = monthBounds(request.nextUrl.searchParams.get("month"));
    if (!bounds) return NextResponse.json({ error: "INVALID_MONTH", message: "Use month format YYYY-MM" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const [{ data: listing, error: listingError }, { data: blocks, error: blocksError }, { data: bookings, error: bookingsError }] = await Promise.all([
      supabase.from("listings").select("id, title").eq("id", id).maybeSingle(),
      supabase.from("listing_unavailability").select("id, listing_id, start_date, end_date, reason").eq("listing_id", id).lte("start_date", bounds.end).gte("end_date", bounds.start).order("start_date", { ascending: true }),
      supabase.from("booking_requests").select("id, rental_start, rental_end, rental_status").eq("listing_id", id).in("rental_status", ["confirmed", "in_progress"]).lte("rental_start", bounds.end).gte("rental_end", bounds.start).order("rental_start", { ascending: true }),
    ]);
    if (listingError || blocksError || bookingsError) throw listingError ?? blocksError ?? bookingsError;
    if (!listing) return NextResponse.json({ error: "NOT_FOUND", message: "Listing was not found" }, { status: 404 });
    return NextResponse.json({ listing, month: bounds.month, blocks: blocks ?? [], bookings: bookings ?? [] });
  } catch (error) {
    console.error("Listing availability API error", error);
    return NextResponse.json({ error: "AVAILABILITY_FAILED", message: "Unable to load equipment availability" }, { status: 500 });
  }
}
