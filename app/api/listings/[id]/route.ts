import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

function fail(message: string, status: number) {
  return NextResponse.json({ error: "LISTING_FAILED", message }, { status });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return fail("Authentication is required", 401);
    if (currentUser.profile.role !== "owner" && currentUser.profile.role !== "admin") return fail("Owner access is required", 403);
    const { id } = await context.params;
    const body = (await request.json()) as { status?: "live" | "paused" | "archived"; available?: boolean };
    if (body.status && !["live", "paused", "archived"].includes(body.status)) return fail("Invalid listing status", 400);
    const supabase = getSupabaseAdmin();
    let query = supabase.from("listings").update({
      ...(body.status ? { status: body.status } : {}),
      ...(typeof body.available === "boolean" ? { available: body.available } : {}),
    }).eq("id", id);
    if (currentUser.profile.role === "owner") query = query.eq("owner_id", currentUser.profile.id);
    const { data, error } = await query.select("id, status, available").maybeSingle();
    if (error) throw error;
    if (!data) return fail("Listing not found", 404);
    return NextResponse.json({ listing: data });
  } catch (error) {
    console.error("Update listing API error", error);
    return fail("Unable to update equipment", 500);
  }
}
