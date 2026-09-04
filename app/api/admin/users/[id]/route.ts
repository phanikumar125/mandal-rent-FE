import { NextResponse } from "next/server";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

function response(message: string, status: number, error = "ADMIN_USER_FAILED") { return NextResponse.json({ error, message }, { status }); }

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return response("Authentication is required", 401, "UNAUTHORIZED");
    if (currentUser.profile.role !== "admin") return response("Admin access is required", 403, "FORBIDDEN");
    const { id } = await context.params; const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase.from("profiles").select("id, full_name, phone, role, is_verified, is_active, created_at, district_id, mandal_id, village_id").eq("id", id).maybeSingle();
    if (error) throw error; if (!user) return response("User was not found", 404, "NOT_FOUND");
    const [{ data: district }, { data: mandal }, { data: village }, { count: rentalRequests }, { count: completedRentals }, { count: listings }, { count: publishedListings }, { data: payments }] = await Promise.all([
      user.district_id ? supabase.from("districts").select("name").eq("id", user.district_id).maybeSingle() : Promise.resolve({ data: null }),
      user.mandal_id ? supabase.from("mandals").select("name").eq("id", user.mandal_id).maybeSingle() : Promise.resolve({ data: null }),
      user.village_id ? supabase.from("villages").select("name").eq("id", user.village_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("booking_requests").select("id", { count: "exact", head: true }).eq("requester_id", id),
      supabase.from("booking_requests").select("id", { count: "exact", head: true }).or(`requester_id.eq.${id},owner_id.eq.${id}`).eq("rental_status", "completed"),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", id),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", id).eq("status", "live"),
      user.role === "owner" ? supabase.from("payments").select("owner_amount, gross_amount").eq("owner_id", id).eq("status", "paid").neq("payout_status", "not_applicable") : user.role === "farmer" ? supabase.from("payments").select("owner_amount, gross_amount").eq("farmer_id", id).eq("status", "paid") : Promise.resolve({ data: [] }),
    ]);
    return NextResponse.json({ user: { ...user, district: district?.name ?? "", mandal: mandal?.name ?? "", village: village?.name ?? "", stats: { rentalRequests: rentalRequests ?? 0, completedRentals: completedRentals ?? 0, listings: listings ?? 0, publishedListings: publishedListings ?? 0, totalPayments: (payments ?? []).reduce((sum, item) => sum + Number(user.role === "farmer" ? item.gross_amount ?? 0 : item.owner_amount ?? 0), 0) } } });
  } catch (error) { console.error("Admin user detail API error", error); return response("Unable to load user details", 500); }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return response("Authentication is required", 401, "UNAUTHORIZED");
    if (currentUser.profile.role !== "admin") return response("Admin access is required", 403, "FORBIDDEN");
    const { id } = await context.params; if (id === currentUser.profile.id) return response("You cannot change your own account status", 400);
    const body = (await request.json().catch(() => ({}))) as { isActive?: boolean; isVerified?: boolean };
    if (body.isActive === undefined && body.isVerified === undefined) return response("No supported user change was requested", 400);
    const supabase = getSupabaseAdmin();
    const { data: target, error: targetError } = await supabase.from("profiles").select("id, role, is_active, is_verified").eq("id", id).maybeSingle();
    if (targetError) throw targetError; if (!target) return response("User was not found", 404, "NOT_FOUND");
    const updates: Record<string, unknown> = {};
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.isVerified !== undefined) { if (target.role !== "owner") return response("Only owner verification can be changed", 400); updates.is_verified = body.isVerified; }
    const { data: updated, error: updateError } = await supabase.from("profiles").update(updates).eq("id", id).select("id, role, is_active, is_verified").single();
    if (updateError) throw updateError;
    if (body.isActive === false) { const { error: sessionError } = await supabase.from("user_sessions").update({ revoked_at: new Date().toISOString() }).eq("profile_id", id).is("revoked_at", null); if (sessionError) throw sessionError; }
    if (body.isActive !== undefined) await recordAdminAudit(supabase, currentUser.profile.id, body.isActive ? "unblock_user" : "block_user", "profile", id);
    if (body.isVerified !== undefined) await recordAdminAudit(supabase, currentUser.profile.id, body.isVerified ? "verify_owner" : "revoke_owner_verification", "profile", id);
    return NextResponse.json({ user: updated });
  } catch (error) { console.error("Admin user update API error", error); return response("Unable to update user", 500); }
}
