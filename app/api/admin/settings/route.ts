import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/commission";
import { getCurrentUser, getSupabaseAdmin, safeProfile } from "@/lib/server-auth";

const unauthorized = () => NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
const forbidden = () => NextResponse.json({ error: "FORBIDDEN", message: "Admin access is required" }, { status: 403 });

async function counts(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const [districts, mandals, villages] = await Promise.all([
    supabase.from("districts").select("id", { count: "exact", head: true }),
    supabase.from("mandals").select("id", { count: "exact", head: true }),
    supabase.from("villages").select("id", { count: "exact", head: true }),
  ]);
  const error = districts.error ?? mandals.error ?? villages.error;
  if (error) throw error;
  return { districts: districts.count ?? 0, mandals: mandals.count ?? 0, villages: villages.count ?? 0 };
}

function paymentConfiguration() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  return {
    razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    razorpayMode: keyId?.startsWith("rzp_live_") ? "Live" : "Test",
    webhookConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
  };
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return unauthorized();
    if (currentUser.profile.role !== "admin") return forbidden();
    const supabase = getSupabaseAdmin();
    return NextResponse.json({
      profile: currentUser.profile,
      commissionPercent: PLATFORM_COMMISSION_PERCENT,
      payment: paymentConfiguration(),
      locations: await counts(supabase),
      system: { application: "MandalRent", environment: process.env.NODE_ENV === "production" ? "Production" : "Development", authentication: "Mobile + PIN", paymentGateway: "Razorpay", version: "1.0.0" },
    });
  } catch (error) {
    console.error("Admin settings GET error", error);
    return NextResponse.json({ error: "ADMIN_SETTINGS_FAILED", message: "Unable to load admin settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return unauthorized();
    if (currentUser.profile.role !== "admin") return forbidden();
    const body = (await request.json()) as { fullName?: string };
    if (typeof body.fullName !== "string" || !body.fullName.trim()) return NextResponse.json({ error: "INVALID_FULL_NAME", message: "Full name is required" }, { status: 400 });
    const { data, error } = await getSupabaseAdmin().from("profiles").update({ full_name: body.fullName.trim() }).eq("id", currentUser.profile.id).select("id, full_name, phone, role, preferred_language, city, pincode, district_id, mandal_id, village_id").single();
    if (error || !data) throw error ?? new Error("Profile update failed");
    return NextResponse.json({ profile: safeProfile(data) });
  } catch (error) {
    console.error("Admin settings PATCH error", error);
    return NextResponse.json({ error: "ADMIN_PROFILE_UPDATE_FAILED", message: "Unable to update admin profile" }, { status: 500 });
  }
}
