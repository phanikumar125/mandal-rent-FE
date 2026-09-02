import { NextRequest, NextResponse } from "next/server";
import { firebaseAdminAuth } from "@/lib/firebase-admin";
import { createClient } from "@supabase/supabase-js";

// =====================================================
// SUPABASE SERVER CONFIGURATION
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase server environment variables are missing");
}

function getJwtRole(key: string) {
  try {
    const parts = key.split(".");

    if (parts.length !== 3) {
      return "not-a-jwt";
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

    return payload.role ?? "no-role";
  } catch {
    return "unable-to-read";
  }
}

console.log("SUPABASE KEY ROLE:", getJwtRole(supabaseServiceRoleKey));
console.log("SUPABASE URL:", supabaseUrl);
console.log("SERVICE ROLE KEY EXISTS:", Boolean(supabaseServiceRoleKey));

// IMPORTANT:
// This client uses the Supabase SERVICE ROLE key.
// Never expose this key using NEXT_PUBLIC_.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// =====================================================
// TYPES
// =====================================================

type ProfileBody = {
  action?: "register" | "login";

  fullName?: string;
  phone?: string;
  role?: "farmer" | "owner";

  language?: "en" | "te";

  district?: string;
  mandal?: string;
  village?: string;
};

// =====================================================
// POST /api/profile
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // ---------------------------------------------------
    // 1. GET FIREBASE TOKEN
    // ---------------------------------------------------

    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Authorization header is missing",
        },
        { status: 401 },
      );
    }

    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Invalid authorization format",
        },
        { status: 401 },
      );
    }

    const idToken = authorization.substring("Bearer ".length).trim();

    if (!idToken) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Firebase ID token is missing",
        },
        { status: 401 },
      );
    }

    // ---------------------------------------------------
    // 2. VERIFY FIREBASE ID TOKEN
    // ---------------------------------------------------

    const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);

    const firebaseUid = decodedToken.uid;

    // Firebase phone number
    const firebasePhone = decodedToken.phone_number ?? null;

    console.log("Firebase UID:", firebaseUid);
    console.log("Firebase phone:", firebasePhone);

    // ---------------------------------------------------
    // 3. READ REQUEST BODY
    // ---------------------------------------------------

    const body = (await request.json()) as ProfileBody;

    const action = body.action ?? "register";

    console.log("Profile action:", action);

    // ===================================================
    // 4. CHECK WHETHER PROFILE ALREADY EXISTS
    // ===================================================

    const { data: existingProfile, error: existingProfileError } =
      await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("firebase_uid", firebaseUid)
        .maybeSingle();

    if (existingProfileError) {
      console.error("Existing profile lookup error:", existingProfileError);

      return NextResponse.json(
        {
          error: "PROFILE_LOOKUP_FAILED",
          message: existingProfileError.message,
          details: existingProfileError.details,
          hint: existingProfileError.hint,
          code: existingProfileError.code,
        },
        { status: 500 },
      );
    }

    // ===================================================
    // 5. LOGIN
    // ===================================================

    if (action === "login") {
      if (!existingProfile) {
        return NextResponse.json(
          {
            error: "PROFILE_NOT_FOUND",
            message: "No profile found for this phone number",
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          message: "Login successful",
          profile: existingProfile,
        },
        { status: 200 },
      );
    }

    // ===================================================
    // 6. REGISTER
    // ===================================================

    if (action === "register") {
      // -------------------------------------------------
      // Prevent duplicate registration
      // -------------------------------------------------

      if (existingProfile) {
        return NextResponse.json(
          {
            error: "PROFILE_ALREADY_EXISTS",
            message: "A profile already exists for this phone number",
            profile: existingProfile,
          },
          { status: 409 },
        );
      }

      // -------------------------------------------------
      // Validate required fields
      // -------------------------------------------------

      if (!body.fullName?.trim()) {
        return NextResponse.json(
          {
            error: "INVALID_FULL_NAME",
            message: "Full name is required",
          },
          { status: 400 },
        );
      }

      if (!body.role) {
        return NextResponse.json(
          {
            error: "INVALID_ROLE",
            message: "Role is required",
          },
          { status: 400 },
        );
      }

      if (body.role !== "farmer" && body.role !== "owner") {
        return NextResponse.json(
          {
            error: "INVALID_ROLE",
            message: "Role must be farmer or owner",
          },
          { status: 400 },
        );
      }

      if (!body.district?.trim()) {
        return NextResponse.json(
          {
            error: "INVALID_DISTRICT",
            message: "District is required",
          },
          { status: 400 },
        );
      }

      if (!body.mandal?.trim()) {
        return NextResponse.json(
          {
            error: "INVALID_MANDAL",
            message: "Mandal is required",
          },
          { status: 400 },
        );
      }

      if (!body.village?.trim()) {
        return NextResponse.json(
          {
            error: "INVALID_VILLAGE",
            message: "Village is required",
          },
          { status: 400 },
        );
      }

      // -------------------------------------------------
      // 7. FIND DISTRICT
      // -------------------------------------------------

      const { data: district, error: districtError } = await supabaseAdmin
        .from("districts")
        .select("id, name")
        .ilike("name", body.district.trim())
        .maybeSingle();

      if (districtError) {
        console.error("District lookup error:", districtError);

        return NextResponse.json(
          {
            error: "DISTRICT_LOOKUP_FAILED",
            message: districtError.message,
            details: districtError.details,
            hint: districtError.hint,
            code: districtError.code,
          },
          { status: 500 },
        );
      }

      if (!district) {
        return NextResponse.json(
          {
            error: "INVALID_DISTRICT",
            message: `District "${body.district}" was not found`,
          },
          { status: 400 },
        );
      }

      console.log("District found:", district);

      // -------------------------------------------------
      // 8. FIND MANDAL
      // -------------------------------------------------

      const { data: mandal, error: mandalError } = await supabaseAdmin
        .from("mandals")
        .select("id, name, district_id")
        .eq("district_id", district.id)
        .ilike("name", body.mandal.trim())
        .maybeSingle();

      if (mandalError) {
        console.error("Mandal lookup error:", mandalError);

        return NextResponse.json(
          {
            error: "MANDAL_LOOKUP_FAILED",
            message: mandalError.message,
            details: mandalError.details,
            hint: mandalError.hint,
            code: mandalError.code,
          },
          { status: 500 },
        );
      }

      if (!mandal) {
        return NextResponse.json(
          {
            error: "INVALID_MANDAL",
            message: `Mandal "${body.mandal}" was not found in district "${district.name}"`,
          },
          { status: 400 },
        );
      }

      console.log("Mandal found:", mandal);

      // -------------------------------------------------
      // 9. FIND VILLAGE
      // -------------------------------------------------

      const { data: village, error: villageError } = await supabaseAdmin
        .from("villages")
        .select("id, name, mandal_id")
        .eq("mandal_id", mandal.id)
        .ilike("name", body.village.trim())
        .maybeSingle();

      if (villageError) {
        console.error("Village lookup error:", villageError);

        return NextResponse.json(
          {
            error: "VILLAGE_LOOKUP_FAILED",
            message: villageError.message,
            details: villageError.details,
            hint: villageError.hint,
            code: villageError.code,
          },
          { status: 500 },
        );
      }

      if (!village) {
        return NextResponse.json(
          {
            error: "INVALID_VILLAGE",
            message: `Village "${body.village}" was not found in mandal "${mandal.name}"`,
          },
          { status: 400 },
        );
      }

      console.log("Village found:", village);

      // =================================================
      // 10. CREATE PROFILE
      // =================================================

      const { data: profile, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          firebase_uid: firebaseUid,

          full_name: body.fullName.trim(),

          phone: firebasePhone ?? body.phone?.trim() ?? null,

          role: body.role,

          preferred_language: body.language === "te" ? "te" : "en",

          district_id: district.id,

          mandal_id: mandal.id,

          village_id: village.id,

          is_verified: true,
        })
        .select("*")
        .single();

      // =================================================
      // 11. HANDLE INSERT ERROR
      // =================================================

      if (insertError) {
        console.error("========== PROFILE INSERT ERROR ==========");

        console.error("code:", insertError.code);

        console.error("message:", insertError.message);

        console.error("details:", insertError.details);

        console.error("hint:", insertError.hint);

        console.error("==========================================");

        return NextResponse.json(
          {
            error: "PROFILE_CREATION_FAILED",

            message: insertError.message,

            details: insertError.details,

            hint: insertError.hint,

            code: insertError.code,
          },
          { status: 500 },
        );
      }

      // =================================================
      // 12. SUCCESS
      // =================================================

      console.log("Profile created successfully:", profile);

      return NextResponse.json(
        {
          message: "Profile created successfully",
          profile,
        },
        { status: 201 },
      );
    }

    // ===================================================
    // 13. INVALID ACTION
    // ===================================================

    return NextResponse.json(
      {
        error: "INVALID_ACTION",
        message: "Action must be register or login",
      },
      { status: 400 },
    );
  } catch (error: any) {
    // ===================================================
    // GLOBAL ERROR HANDLER
    // ===================================================

    console.error("========== PROFILE API ERROR ==========");

    console.error(error);

    console.error("=======================================");

    return NextResponse.json(
      {
        error: "PROFILE_API_ERROR",
        message: error?.message ?? "Something went wrong",
      },
      { status: 500 },
    );
  }
}
