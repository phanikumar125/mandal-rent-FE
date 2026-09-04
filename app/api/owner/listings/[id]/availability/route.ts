import { NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";
import { isValidIsoDate } from "@/lib/date-validation";

function fail(message: string, status: number) {
  return NextResponse.json({ error: "AVAILABILITY_FAILED", message }, { status });
}

async function ownerListing(id: string) {
  const supabase = getSupabaseAdmin();
  const currentUser = await getCurrentUser();
  if (!currentUser) return { supabase, currentUser: null, listing: null };
  const { data: listing, error } = await supabase.from("listings").select("id, title, owner_id").eq("id", id).maybeSingle();
  if (error) throw error;
  return { supabase, currentUser, listing };
}

async function validateRange(supabase: ReturnType<typeof getSupabaseAdmin>, listingId: string, startDate: string, endDate: string, excludeId?: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (startDate < today) return "Unavailable dates must be today or in the future";
  const latest = new Date(`${today}T00:00:00Z`);
  latest.setUTCFullYear(latest.getUTCFullYear() + 2);
  if (endDate > latest.toISOString().slice(0, 10)) return "Unavailable dates can be scheduled up to two years ahead";
  const { data: bookings, error: bookingError } = await supabase.from("booking_requests").select("id").eq("listing_id", listingId).in("rental_status", ["confirmed", "in_progress"]).lte("rental_start", endDate).gte("rental_end", startDate);
  if (bookingError) throw bookingError;
  if (bookings?.length) return "This equipment already has an active booking during the selected dates.";
  let query = supabase.from("listing_unavailability").select("id").eq("listing_id", listingId).lte("start_date", endDate).gte("end_date", startDate);
  if (excludeId) query = query.neq("id", excludeId);
  const { data: blocks, error: blockError } = await query.limit(1);
  if (blockError) throw blockError;
  if (blocks?.length) return "This equipment is already marked unavailable during the selected dates.";
  return null;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { currentUser, listing, supabase } = await ownerListing(id);
    if (!currentUser) return fail("Authentication is required", 401);
    if (currentUser.profile.role !== "owner") return fail("Owner access is required", 403);
    if (!listing) return fail("Listing was not found", 404);
    if (listing.owner_id !== currentUser.profile.id) return fail("You are not authorized to manage this listing", 403);
    const body = (await request.json().catch(() => ({}))) as { startDate?: string; endDate?: string; reason?: string };
    const startDate = body.startDate ?? "";
    const endDate = body.endDate ?? "";
    if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) return fail("Choose valid start and end dates", 400);
    if (endDate < startDate) return fail("End date must be on or after the start date", 400);
    const conflict = await validateRange(supabase, id, startDate, endDate);
    if (conflict) return fail(conflict, 409);
    const { data, error } = await supabase.from("listing_unavailability").insert({ listing_id: id, start_date: startDate, end_date: endDate, reason: typeof body.reason === "string" ? body.reason.trim().slice(0, 200) || null : null }).select("id, listing_id, start_date, end_date, reason, created_at, updated_at").single();
    if (error) throw error;
    return NextResponse.json({ block: data }, { status: 201 });
  } catch (error) {
    console.error("Create listing unavailability API error", error);
    return fail("Unable to save unavailable dates", 500);
  }
}
