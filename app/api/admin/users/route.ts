import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

function denied(status: number, message: string) { return NextResponse.json({ error: status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message }, { status }); }

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return denied(401, "Authentication is required");
    if (currentUser.profile.role !== "admin") return denied(403, "Admin access is required");
    const params = request.nextUrl.searchParams;
    const role = params.get("role");
    const search = params.get("search")?.trim();
    const supabase = getSupabaseAdmin();
    let query = supabase.from("profiles").select("id, full_name, phone, role, is_verified, is_active, created_at, district_id, mandal_id, village_id").order("created_at", { ascending: false }).limit(500);
    if (role && ["farmer", "owner", "admin"].includes(role)) query = query.eq("role", role);
    if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data: profiles, error } = await query;
    if (error) throw error;
    const rows = profiles ?? [];
    const districtIds = [...new Set(rows.map((row) => row.district_id).filter(Boolean))];
    const mandalIds = [...new Set(rows.map((row) => row.mandal_id).filter(Boolean))];
    const villageIds = [...new Set(rows.map((row) => row.village_id).filter(Boolean))];
    const [{ data: districts, error: districtError }, { data: mandals, error: mandalError }, { data: villages, error: villageError }] = await Promise.all([
      districtIds.length ? supabase.from("districts").select("id, name").in("id", districtIds) : Promise.resolve({ data: [], error: null }),
      mandalIds.length ? supabase.from("mandals").select("id, name").in("id", mandalIds) : Promise.resolve({ data: [], error: null }),
      villageIds.length ? supabase.from("villages").select("id, name").in("id", villageIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (districtError || mandalError || villageError) throw districtError ?? mandalError ?? villageError;
    const names = (items: Array<{ id: string; name: string }>) => new Map(items.map((item) => [item.id, item.name]));
    const districtNames = names(districts ?? []); const mandalNames = names(mandals ?? []); const villageNames = names(villages ?? []);
    return NextResponse.json({ users: rows.map((row) => ({ ...row, district: districtNames.get(row.district_id) ?? "", mandal: mandalNames.get(row.mandal_id) ?? "", village: villageNames.get(row.village_id) ?? "" })) });
  } catch (error) {
    console.error("Admin users API error", error);
    return NextResponse.json({ error: "ADMIN_USERS_FAILED", message: "Unable to load users" }, { status: 500 });
  }
}
