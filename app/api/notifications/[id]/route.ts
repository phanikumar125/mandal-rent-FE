import { NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { isRead?: boolean };
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("notifications").update({ is_read: body.isRead !== false }).eq("id", id).eq("user_id", currentUser.profile.id).select("id, user_id, type, title, message, entity_type, entity_id, is_read, created_at").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "NOT_FOUND", message: "Notification was not found" }, { status: 404 });
    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error("Notification update API error", error);
    return NextResponse.json({ error: "NOTIFICATIONS_FAILED", message: "Unable to update notification" }, { status: 500 });
  }
}
