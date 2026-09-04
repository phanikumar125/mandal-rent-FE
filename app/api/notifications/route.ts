import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 20) || 20, 1), 50);
    const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";
    const supabase = getSupabaseAdmin();
    let query = supabase.from("notifications").select("id, user_id, type, title, message, entity_type, entity_id, is_read, created_at").eq("user_id", currentUser.profile.id).order("created_at", { ascending: false }).limit(limit);
    if (unreadOnly) query = query.eq("is_read", false);
    const [{ data: notifications, error }, { count: unreadCount, error: countError }] = await Promise.all([
      query,
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", currentUser.profile.id).eq("is_read", false),
    ]);
    if (error || countError) throw error ?? countError;
    return NextResponse.json({ notifications: notifications ?? [], unreadCount: unreadCount ?? 0 });
  } catch (error) {
    console.error("Notifications API error", error);
    return NextResponse.json({ error: "NOTIFICATIONS_FAILED", message: "Unable to load notifications" }, { status: 500 });
  }
}
