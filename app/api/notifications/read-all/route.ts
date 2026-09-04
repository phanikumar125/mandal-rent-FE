import { NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

export async function POST() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    const { error } = await getSupabaseAdmin().from("notifications").update({ is_read: true }).eq("user_id", currentUser.profile.id).eq("is_read", false);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Mark notifications read API error", error);
    return NextResponse.json({ error: "NOTIFICATIONS_FAILED", message: "Unable to mark notifications as read" }, { status: 500 });
  }
}
