import { NextRequest, NextResponse } from "next/server";
import { authenticateWithPin, createSession, isAccountBlocked, safeProfile } from "@/lib/server-auth";
import { isValidPin, normalizeIndianPhone } from "@/lib/auth-validation";

const genericError = () => NextResponse.json({ error: "INVALID_CREDENTIALS", message: "Invalid mobile number or PIN." }, { status: 401 });

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { phone?: string; pin?: string };
    const phone = normalizeIndianPhone(typeof body.phone === "string" ? body.phone : "");
    const pin = typeof body.pin === "string" ? body.pin : "";
    if (!phone || !isValidPin(pin)) return genericError();
    if (await isAccountBlocked(phone)) return NextResponse.json({ error: "ACCOUNT_DISABLED", message: "Your account has been temporarily disabled. Please contact MandalRent support." }, { status: 403 });

    const profile = await authenticateWithPin(phone, pin);
    if (!profile) return genericError();

    await createSession(profile.id);
    return NextResponse.json({ profile: safeProfile(profile) });
  } catch (error) {
    console.error("Login API error", error);
    return genericError();
  }
}
