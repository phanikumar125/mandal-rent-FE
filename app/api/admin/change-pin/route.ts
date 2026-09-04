import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin, hashPin, revokeOtherSessions, verifyPin } from "@/lib/server-auth";
import { isValidPin, isWeakPin } from "@/lib/auth-validation";

const fail = (message: string, status: number) => NextResponse.json({ error: "PIN_CHANGE_FAILED", message }, { status });

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return fail("Authentication is required", 401);
    if (currentUser.profile.role !== "admin") return fail("Admin access is required", 403);
    const body = (await request.json()) as { currentPin?: string; newPin?: string; confirmPin?: string };
    const currentPin = typeof body.currentPin === "string" ? body.currentPin : "";
    const newPin = typeof body.newPin === "string" ? body.newPin : "";
    const confirmPin = typeof body.confirmPin === "string" ? body.confirmPin : "";
    const supabase = getSupabaseAdmin();
    const { data: credential, error: credentialError } = await supabase.from("user_credentials").select("pin_hash").eq("profile_id", currentUser.profile.id).maybeSingle();
    if (credentialError) throw credentialError;
    if (!credential || !(await verifyPin(currentPin, String(credential.pin_hash)))) return fail("Current PIN is incorrect", 400);
    if (!isValidPin(newPin)) return fail("New PIN must be exactly 6 digits", 400);
    if (isWeakPin(newPin)) return fail("Please choose a stronger PIN", 400);
    if (newPin !== confirmPin) return fail("New PINs do not match", 400);
    const { error: updateError } = await supabase.from("user_credentials").update({ pin_hash: await hashPin(newPin), failed_attempts: 0, locked_until: null }).eq("profile_id", currentUser.profile.id);
    if (updateError) throw updateError;
    await revokeOtherSessions(currentUser.profile.id);
    return NextResponse.json({ success: true, message: "PIN changed successfully." });
  } catch (error) {
    console.error("Admin PIN change error", error);
    return fail("Unable to change PIN", 500);
  }
}
