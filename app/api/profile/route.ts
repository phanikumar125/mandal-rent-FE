import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUser,
  getSupabaseAdmin,
  safeProfile,
} from "@/lib/server-auth";

async function withLocationNames(
  profile: ReturnType<typeof safeProfile>,
  supabase: ReturnType<typeof getSupabaseAdmin>,
) {
  const [{ data: district }, { data: mandal }, { data: village }] =
    await Promise.all([
      profile.district_id
        ? supabase
            .from("districts")
            .select("name")
            .eq("id", profile.district_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      profile.mandal_id
        ? supabase
            .from("mandals")
            .select("name")
            .eq("id", profile.mandal_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      profile.village_id
        ? supabase
            .from("villages")
            .select("name")
            .eq("id", profile.village_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  return {
    ...profile,
    district: district?.name ?? "",
    mandal: mandal?.name ?? "",
    village: village?.name ?? "",
  };
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication is required" },
        { status: 401 },
      );
    const profile = await withLocationNames(
      currentUser.profile,
      getSupabaseAdmin(),
    );
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile API error", error);
    return NextResponse.json(
      { error: "PROFILE_UNAVAILABLE", message: "Unable to load your profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication is required" },
        { status: 401 },
      );
    const body = (await request.json()) as {
      fullName?: string;
      city?: string;
      pincode?: string;
      language?: "en" | "te";
      role?: "farmer" | "owner";
      districtId?: string | null;
      mandalId?: string | null;
      villageId?: string | null;
    };
    if (body.fullName !== undefined && !body.fullName.trim())
      return NextResponse.json(
        { error: "INVALID_FULL_NAME", message: "Full name is required" },
        { status: 400 },
      );
    if (body.pincode !== undefined && !/^\d{6}$/.test(body.pincode))
      return NextResponse.json(
        { error: "INVALID_PINCODE", message: "Pincode must be 6 digits" },
        { status: 400 },
      );
    if (
      body.role !== undefined &&
      body.role !== "farmer" &&
      body.role !== "owner"
    )
      return NextResponse.json(
        { error: "INVALID_ROLE", message: "Invalid role" },
        { status: 400 },
      );
    if (body.role !== undefined && body.role !== currentUser.profile.role)
      return NextResponse.json(
        { error: "ROLE_CHANGE_NOT_ALLOWED", message: "Account role cannot be changed from profile settings" },
        { status: 403 },
      );
    const supabase = getSupabaseAdmin();
    const districtId =
      body.districtId === undefined
        ? currentUser.profile.district_id
        : body.districtId || null;
    const mandalId =
      body.mandalId === undefined
        ? currentUser.profile.mandal_id
        : body.mandalId || null;
    const villageId =
      body.villageId === undefined
        ? currentUser.profile.village_id
        : body.villageId || null;
    if ((mandalId && !districtId) || (villageId && !mandalId))
      return NextResponse.json(
        {
          error: "INVALID_LOCATION",
          message: "Select a valid district, mandal, and village",
        },
        { status: 400 },
      );
    if (districtId) {
      const { data: district, error: districtError } = await supabase
        .from("districts")
        .select("id")
        .eq("id", districtId)
        .maybeSingle();
      if (districtError) throw districtError;
      if (!district)
        return NextResponse.json(
          { error: "INVALID_LOCATION", message: "Select a valid district" },
          { status: 400 },
        );
    }
    if (mandalId) {
      const { data: mandal, error: mandalError } = await supabase
        .from("mandals")
        .select("id")
        .eq("id", mandalId)
        .eq("district_id", districtId)
        .maybeSingle();
      if (mandalError) throw mandalError;
      if (!mandal)
        return NextResponse.json(
          { error: "INVALID_LOCATION", message: "Select a valid mandal" },
          { status: 400 },
        );
    }
    if (villageId) {
      const { data: village, error: villageError } = await supabase
        .from("villages")
        .select("id")
        .eq("id", villageId)
        .eq("mandal_id", mandalId)
        .maybeSingle();
      if (villageError) throw villageError;
      if (!village)
        return NextResponse.json(
          { error: "INVALID_LOCATION", message: "Select a valid village" },
          { status: 400 },
        );
    }
    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        ...(body.fullName === undefined
          ? {}
          : { full_name: body.fullName.trim() }),
        ...(body.city === undefined ? {} : { city: body.city.trim() }),
        ...(body.pincode === undefined ? {} : { pincode: body.pincode }),
        ...(body.language === undefined
          ? {}
          : { preferred_language: body.language === "te" ? "te" : "en" }),
        ...(body.districtId === undefined ? {} : { district_id: districtId }),
        ...(body.mandalId === undefined ? {} : { mandal_id: mandalId }),
        ...(body.villageId === undefined ? {} : { village_id: villageId }),
      })
      .eq("id", currentUser.profile.id)
      .select(
        "id, full_name, phone, role, preferred_language, city, pincode, district_id, mandal_id, village_id",
      )
      .single();
    if (error || !profile) throw error ?? new Error("Profile update failed");
    return NextResponse.json({
      profile: await withLocationNames(safeProfile(profile), supabase),
    });
  } catch (error) {
    console.error("Profile update API error", error);
    return NextResponse.json(
      {
        error: "PROFILE_UPDATE_FAILED",
        message: "Unable to save your profile",
      },
      { status: 500 },
    );
  }
}
