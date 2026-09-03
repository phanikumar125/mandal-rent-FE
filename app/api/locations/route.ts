import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server-auth";

type LocationRow = { id: string; name: string; district_id?: string; mandal_id?: string };

const empty = () => NextResponse.json({ items: [] });

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const level = params.get("level") ?? "districts";
    const supabase = getSupabaseAdmin();

    if (level === "districts") {
      const [{ data: districts, error: districtError }, { data: mandals, error: mandalError }] = await Promise.all([
        supabase.from("districts").select("id, name").order("name"),
        supabase.from("mandals").select("id, district_id"),
      ]);
      if (districtError || mandalError) throw districtError ?? mandalError;
      const counts = new Map<string, number>();
      for (const mandal of (mandals ?? []) as LocationRow[]) counts.set(String(mandal.district_id), (counts.get(String(mandal.district_id)) ?? 0) + 1);
      const items = ((districts ?? []) as LocationRow[]).map((district) => ({ code: String(district.id), name: district.name, count: counts.get(String(district.id)) ?? 0 }));
      return NextResponse.json({ items, totals: { districts: items.length, mandals: mandals?.length ?? 0 } });
    }

    const districtId = params.get("districtId") ?? params.get("district");

    if (level === "mandals") {
      if (!districtId) return empty();
      const { data: mandals, error: mandalError } = await supabase.from("mandals").select("id, name, district_id").eq("district_id", districtId).order("name");
      if (mandalError) throw mandalError;
      const mandalIds = (mandals ?? []).map((mandal) => String(mandal.id));
      const { data: villages, error: villageError } = mandalIds.length
        ? await supabase.from("villages").select("id, mandal_id").in("mandal_id", mandalIds)
        : { data: [], error: null };
      if (villageError) throw villageError;
      const counts = new Map<string, number>();
      for (const village of (villages ?? []) as LocationRow[]) counts.set(String(village.mandal_id), (counts.get(String(village.mandal_id)) ?? 0) + 1);
      return NextResponse.json({ items: (mandals ?? []).map((mandal) => ({ code: String(mandal.id), name: mandal.name, count: counts.get(String(mandal.id)) ?? 0 })) });
    }

    const mandalId = params.get("mandalId") ?? params.get("mandal");
    if (!mandalId) return empty();
    let mandalQuery = supabase.from("mandals").select("id, district_id").eq("id", mandalId);
    if (districtId) mandalQuery = mandalQuery.eq("district_id", districtId);
    const { data: mandal, error: mandalError } = await mandalQuery.maybeSingle();
    if (mandalError) throw mandalError;
    if (!mandal) return empty();
    const { data: villages, error: villageError } = await supabase.from("villages").select("id, name").eq("mandal_id", mandal.id).order("name");
    if (villageError) throw villageError;
    return NextResponse.json({ items: (villages ?? []).map((village) => ({ code: String(village.id), name: village.name })) });
  } catch (error) {
    console.error("Location API error", error);
    return NextResponse.json({ error: "LOCATION_LOOKUP_FAILED", items: [] }, { status: 500 });
  }
}
