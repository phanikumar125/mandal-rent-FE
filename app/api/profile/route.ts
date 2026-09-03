import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin, safeProfile } from "@/lib/server-auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    return NextResponse.json({ profile: currentUser.profile });
  } catch (error) {
    console.error("Profile API error", error);
    return NextResponse.json({ error: "PROFILE_UNAVAILABLE", message: "Unable to load your profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    const body = (await request.json()) as { fullName?: string; city?: string; pincode?: string; language?: "en" | "te" };
    if (body.fullName !== undefined && !body.fullName.trim()) return NextResponse.json({ error: "INVALID_FULL_NAME", message: "Full name is required" }, { status: 400 });
    if (body.pincode !== undefined && !/^\d{6}$/.test(body.pincode)) return NextResponse.json({ error: "INVALID_PINCODE", message: "Pincode must be 6 digits" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase.from("profiles").update({
      ...(body.fullName === undefined ? {} : { full_name: body.fullName.trim() }),
      ...(body.city === undefined ? {} : { city: body.city.trim() }),
      ...(body.pincode === undefined ? {} : { pincode: body.pincode }),
      ...(body.language === undefined ? {} : { preferred_language: body.language === "te" ? "te" : "en" }),
    }).eq("id", currentUser.profile.id).select("id, full_name, phone, role, preferred_language, city, pincode, district_id, mandal_id, village_id").single();
    if (error || !profile) throw error ?? new Error("Profile update failed");
    return NextResponse.json({ profile: safeProfile(profile) });
  } catch (error) {
    console.error("Profile update API error", error);
    return NextResponse.json({ error: "PROFILE_UPDATE_FAILED", message: "Unable to save your profile" }, { status: 500 });
  }
}
