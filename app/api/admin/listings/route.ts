import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    if (currentUser.profile.role !== "admin") return NextResponse.json({ error: "FORBIDDEN", message: "Admin access is required" }, { status: 403 });
    const params = request.nextUrl.searchParams; const supabase = getSupabaseAdmin();
    let query = supabase.from("listings").select("id, owner_id, category_id, title, price, price_unit, available, status, created_at, district_id, mandal_id, village_id").order("created_at", { ascending: false }).limit(500);
    const status = params.get("status"); const categoryId = params.get("categoryId"); const districtId = params.get("districtId"); const search = params.get("search")?.trim();
    if (status && ["draft", "pending", "live", "paused", "archived"].includes(status)) query = query.eq("status", status);
    if (categoryId) query = query.eq("category_id", categoryId); if (districtId) query = query.eq("district_id", districtId); if (search) query = query.ilike("title", `%${search}%`);
    const { data: listings, error } = await query; if (error) throw error;
    const rows = listings ?? []; const ownerIds = [...new Set(rows.map((row) => row.owner_id))]; const categoryIds = [...new Set(rows.map((row) => row.category_id))]; const districtIds = [...new Set(rows.map((row) => row.district_id).filter(Boolean))]; const mandalIds = [...new Set(rows.map((row) => row.mandal_id).filter(Boolean))]; const villageIds = [...new Set(rows.map((row) => row.village_id).filter(Boolean))];
    const [{ data: owners, error: ownerError }, { data: categories, error: categoryError }, { data: districts, error: districtError }, { data: mandals, error: mandalError }, { data: villages, error: villageError }, { data: images, error: imageError }] = await Promise.all([
      ownerIds.length ? supabase.from("profiles").select("id, full_name").in("id", ownerIds) : Promise.resolve({ data: [], error: null }),
      categoryIds.length ? supabase.from("equipment_categories").select("id, name").in("id", categoryIds) : Promise.resolve({ data: [], error: null }),
      districtIds.length ? supabase.from("districts").select("id, name").in("id", districtIds) : Promise.resolve({ data: [], error: null }),
      mandalIds.length ? supabase.from("mandals").select("id, name").in("id", mandalIds) : Promise.resolve({ data: [], error: null }),
      villageIds.length ? supabase.from("villages").select("id, name").in("id", villageIds) : Promise.resolve({ data: [], error: null }),
      rows.length ? supabase.from("listing_images").select("listing_id, storage_path, is_primary, sort_order").in("listing_id", rows.map((row) => row.id)).order("is_primary", { ascending: false }).order("sort_order", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    ]);
    if (ownerError || categoryError || districtError || mandalError || villageError || imageError) throw ownerError ?? categoryError ?? districtError ?? mandalError ?? villageError ?? imageError;
    const map = <T extends { id: string }>(items: T[]) => new Map(items.map((item) => [item.id, item])); const ownerMap = map(owners ?? []); const categoryMap = map(categories ?? []); const districtMap = map(districts ?? []); const mandalMap = map(mandals ?? []); const villageMap = map(villages ?? []); const imageMap = new Map<string, string>(); for (const image of images ?? []) if (!imageMap.has(image.listing_id)) imageMap.set(image.listing_id, supabase.storage.from("equipment-images").getPublicUrl(image.storage_path).data.publicUrl);
    const ownerNameSearch = search?.toLocaleLowerCase(); const result = rows.map((row) => ({ ...row, owner_name: ownerMap.get(row.owner_id)?.full_name ?? "Owner", category: categoryMap.get(row.category_id)?.name ?? "Equipment", district: districtMap.get(row.district_id)?.name ?? "", mandal: mandalMap.get(row.mandal_id)?.name ?? "", village: villageMap.get(row.village_id)?.name ?? "", image: imageMap.get(row.id) ?? null })).filter((row) => !ownerNameSearch || `${row.title} ${row.owner_name}`.toLocaleLowerCase().includes(ownerNameSearch));
    return NextResponse.json({ listings: result, categories: [...categoryMap.values()], districts: [...districtMap.values()] });
  } catch (error) { console.error("Admin listings API error", error); return NextResponse.json({ error: "ADMIN_LISTINGS_FAILED", message: "Unable to load listings" }, { status: 500 }); }
}
