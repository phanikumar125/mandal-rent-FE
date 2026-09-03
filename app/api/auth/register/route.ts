import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  createSession,
  hashPin,
  safeProfile,
} from "@/lib/server-auth";
import {
  isValidPin,
  isWeakPin,
  normalizeIndianPhone,
} from "@/lib/auth-validation";

type RegistrationBody = {
  phone?: string;
  pin?: string;
  confirmPin?: string;
  fullName?: string;
  role?: "farmer" | "owner";
  language?: "en" | "te";
  city?: string;
  pincode?: string;
  districtCode?: string;
  mandalCode?: string;
  villageCode?: string;
};

const failure = (message: string, status: number) =>
  NextResponse.json({ error: "REGISTRATION_FAILED", message }, { status });

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegistrationBody;
    const phone = normalizeIndianPhone(
      typeof body.phone === "string" ? body.phone : "",
    );
    const pin = typeof body.pin === "string" ? body.pin : "";
    const confirmPin =
      typeof body.confirmPin === "string" ? body.confirmPin : "";
    const fullName = typeof body.fullName === "string" ? body.fullName : "";
    const city = typeof body.city === "string" ? body.city : "";
    const pincode = typeof body.pincode === "string" ? body.pincode : "";
    if (!phone) return failure("Invalid mobile number", 400);
    if (!isValidPin(pin)) return failure("PIN must be exactly 6 digits", 400);
    if (isWeakPin(pin)) return failure("Please choose a stronger PIN", 400);
    if (pin !== confirmPin) return failure("PINs do not match", 400);
    if (!fullName.trim()) return failure("Full name is required", 400);
    if (body.role !== "farmer" && body.role !== "owner")
      return failure("Invalid role", 400);
    if (!city.trim()) return failure("City is required", 400);
    if (!/^\d{6}$/.test(pincode))
      return failure("Pincode must be 6 digits", 400);

    const supabase = getSupabaseAdmin();
    const districtResult = await supabase
      .from("districts")
      .select("id, name")
      .eq("id", body.districtCode)
      .maybeSingle();

    if (districtResult.error) throw districtResult.error;
    if (!districtResult.data) {
      return failure("Please select a valid district", 400);
    }

    const { data: mandal, error: mandalError } = await supabase
      .from("mandals")
      .select("id, name")
      .eq("id", body.mandalCode)
      .eq("district_id", districtResult.data.id)
      .maybeSingle();

    if (mandalError) throw mandalError;
    if (!mandal) {
      return failure("Please select a valid mandal", 400);
    }

    const { data: village, error: villageError } = await supabase
      .from("villages")
      .select("id, name")
      .eq("id", body.villageCode)
      .eq("mandal_id", mandal.id)
      .maybeSingle();

    if (villageError) throw villageError;
    if (!village) {
      return failure("Please select a valid village", 400);
    }

    const { data: profile, error: accountError } = await supabase.rpc(
      "create_mandalrent_account",
      {
        p_profile_id: randomUUID(),
        p_full_name: fullName.trim(),
        p_phone: phone,
        p_role: body.role,
        p_preferred_language: body.language === "te" ? "te" : "en",
        p_city: city.trim(),
        p_pincode: pincode,
        p_district_id: districtResult.data.id,
        p_mandal_id: mandal.id,
        p_village_id: village.id,
        p_pin_hash: await hashPin(pin),
      },
    );

    if (accountError) {
      if (
        accountError.code === "23505" ||
        accountError.message.includes("ACCOUNT_EXISTS")
      )
        return NextResponse.json(
          {
            error: "ACCOUNT_EXISTS",
            message:
              "An account with this mobile number already exists. Please login.",
          },
          { status: 409 },
        );
      throw accountError;
    }
    if (!profile) throw new Error("Account was not created");

    await createSession(String((profile as Record<string, unknown>).id));
    return NextResponse.json(
      { profile: safeProfile(profile as Record<string, unknown>) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration API error", error);
    return failure("Unable to create account", 500);
  }
}
