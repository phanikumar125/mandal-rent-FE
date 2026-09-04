import { NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";
import { isValidIsoDate } from "@/lib/date-validation";

function fail(message: string, status: number) { return NextResponse.json({ error: "AVAILABILITY_FAILED", message }, { status }); }

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; blockId: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return fail("Authentication is required", 401);
    if (currentUser.profile.role !== "owner") return fail("Owner access is required", 403);
    const { id, blockId } = await context.params;
    const supabase = getSupabaseAdmin();
    const { data: listing, error: listingError } = await supabase.from("listings").select("id, owner_id").eq("id", id).maybeSingle();
    if (listingError) throw listingError;
    if (!listing) return fail("Listing was not found", 404);
    if (listing.owner_id !== currentUser.profile.id) return fail("You are not authorized to manage this listing", 403);
    const { data, error } = await supabase.from("listing_unavailability").delete().eq("id", blockId).eq("listing_id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return fail("Unavailable date block was not found", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete listing unavailability API error", error);
    return fail("Unable to delete unavailable dates", 500);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; blockId: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return fail("Authentication is required", 401);
    if (currentUser.profile.role !== "owner") return fail("Owner access is required", 403);
    const { id, blockId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { startDate?: string; endDate?: string; reason?: string };
    if (!isValidIsoDate(body.startDate) || !isValidIsoDate(body.endDate)) return fail("Choose valid start and end dates", 400);
    if (body.endDate < body.startDate) return fail("End date must be on or after the start date", 400);
    const supabase = getSupabaseAdmin();
    const { data: listing, error: listingError } = await supabase.from("listings").select("id, owner_id").eq("id", id).maybeSingle();
    if (listingError) throw listingError;
    if (!listing) return fail("Listing was not found", 404);
    if (listing.owner_id !== currentUser.profile.id) return fail("You are not authorized to manage this listing", 403);
    const { data: block, error: blockError } = await supabase.from("listing_unavailability").select("id").eq("id", blockId).eq("listing_id", id).maybeSingle();
    if (blockError) throw blockError;
    if (!block) return fail("Unavailable date block was not found", 404);
    const today = new Date().toISOString().slice(0, 10);
    const maxDate = new Date(`${today}T00:00:00Z`); maxDate.setUTCFullYear(maxDate.getUTCFullYear() + 2);
    if (body.startDate < today || body.endDate > maxDate.toISOString().slice(0, 10)) return fail("Unavailable dates must be within the next two years", 400);
    const { data: bookings, error: bookingError } = await supabase.from("booking_requests").select("id").eq("listing_id", id).in("rental_status", ["confirmed", "in_progress"]).lte("rental_start", body.endDate).gte("rental_end", body.startDate);
    if (bookingError) throw bookingError;
    if (bookings?.length) return fail("This equipment already has an active booking during the selected dates.", 409);
    const { data: overlap, error: overlapError } = await supabase.from("listing_unavailability").select("id").eq("listing_id", id).neq("id", blockId).lte("start_date", body.endDate).gte("end_date", body.startDate).limit(1);
    if (overlapError) throw overlapError;
    if (overlap?.length) return fail("This equipment is already marked unavailable during the selected dates.", 409);
    const { data, error } = await supabase.from("listing_unavailability").update({ start_date: body.startDate, end_date: body.endDate, reason: typeof body.reason === "string" ? body.reason.trim().slice(0, 200) || null : null }).eq("id", blockId).eq("listing_id", id).select("id, listing_id, start_date, end_date, reason, created_at, updated_at").single();
    if (error) throw error;
    return NextResponse.json({ block: data });
  } catch (error) {
    console.error("Update listing unavailability API error", error);
    return fail("Unable to update unavailable dates", 500);
  }
}
