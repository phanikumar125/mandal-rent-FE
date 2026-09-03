import "server-only";

import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "mandalrent_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const BCRYPT_ROUNDS = 12;

export type AuthenticatedProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: "farmer" | "owner" | "admin";
  preferred_language: "en" | "te";
  city: string;
  pincode: string;
  district_id: string | null;
  mandal_id: string | null;
  village_id: string | null;
};

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server database configuration is missing");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeProfile(profile: Record<string, unknown>): AuthenticatedProfile {
  return {
    id: String(profile.id),
    full_name: String(profile.full_name ?? ""),
    phone: profile.phone ? String(profile.phone) : null,
    role: profile.role === "owner" || profile.role === "admin" ? profile.role : "farmer",
    preferred_language: profile.preferred_language === "te" ? "te" : "en",
    city: String(profile.city ?? ""),
    pincode: String(profile.pincode ?? ""),
    district_id: profile.district_id ? String(profile.district_id) : null,
    mandal_id: profile.mandal_id ? String(profile.mandal_id) : null,
    village_id: profile.village_id ? String(profile.village_id) : null,
  };
}

export async function hashPin(pin: string) {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

export async function verifyPin(pin: string, pinHash: string) {
  return bcrypt.compare(pin, pinHash);
}

export async function createSession(profileId: string) {
  const supabase = getSupabaseAdmin();
  const token = randomBytes(32).toString("base64url");
  const { error } = await supabase.from("user_sessions").insert({
    profile_id: profileId,
    session_token_hash: hashSessionToken(token),
    expires_at: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
  });
  if (error) throw error;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const tokenHash = hashSessionToken(token);
  const { data: session, error: sessionError } = await supabase
    .from("user_sessions")
    .select("id, profile_id, expires_at, revoked_at")
    .eq("session_token_hash", tokenHash)
    .maybeSingle();

  if (sessionError || !session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, preferred_language, city, pincode, district_id, mandal_id, village_id")
    .eq("id", session.profile_id)
    .maybeSingle();
  if (profileError || !profile) return null;

  await supabase.from("user_sessions").update({ last_used_at: new Date().toISOString() }).eq("id", session.id);
  return { profile: safeProfile(profile), sessionId: String(session.id) };
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const supabase = getSupabaseAdmin();
    await supabase.from("user_sessions").update({ revoked_at: new Date().toISOString() }).eq("session_token_hash", hashSessionToken(token));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function authenticateWithPin(phone: string, pin: string) {
  const supabase = getSupabaseAdmin();
  const { data: credential, error } = await supabase
    .from("user_credentials")
    .select("profile_id, pin_hash, failed_attempts, locked_until")
    .eq("phone", phone)
    .maybeSingle();
  if (error) throw error;
  if (!credential) return null;

  if (credential.locked_until && new Date(credential.locked_until).getTime() > Date.now()) return null;

  const valid = await verifyPin(pin, String(credential.pin_hash));
  if (!valid) {
    const failedAttempts = Number(credential.failed_attempts ?? 0) + 1;
    await supabase.from("user_credentials").update({
      failed_attempts: failedAttempts,
      locked_until: failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
    }).eq("profile_id", credential.profile_id);
    return null;
  }

  await supabase.from("user_credentials").update({
    failed_attempts: 0,
    locked_until: null,
    last_login_at: new Date().toISOString(),
  }).eq("profile_id", credential.profile_id);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, preferred_language, city, pincode, district_id, mandal_id, village_id")
    .eq("id", credential.profile_id)
    .maybeSingle();
  if (profileError) throw profileError;
  return profile ? safeProfile(profile) : null;
}
