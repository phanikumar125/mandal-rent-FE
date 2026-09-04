import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";
import { normalizeIndianPhone } from "@/lib/auth-validation";

function fail(message: string, status: number) {
  return NextResponse.json({ error: "LISTING_FAILED", message }, { status });
}

function numberField(value: FormDataEntryValue | null, fallback = 0) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) ? number : fallback;
}

function listingResponse(item: Record<string, unknown>, supabase: ReturnType<typeof getSupabaseAdmin>) {
  const storagePath = item.primary_image_path ? String(item.primary_image_path) : null;
  const image = storagePath ? supabase.storage.from("equipment-images").getPublicUrl(storagePath).data.publicUrl : null;
  return { ...item, image, image_path: storagePath };
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return fail("Authentication is required", 401);
    if (!["farmer", "owner", "admin"].includes(currentUser.profile.role)) return fail("Access is not allowed", 403);

    const params = request.nextUrl.searchParams;
    const supabase = getSupabaseAdmin();
    let query = supabase.from("marketplace_listings").select("*").order("created_at", { ascending: false }).limit(100);
    if (currentUser.profile.role === "owner" || currentUser.profile.role === "admin" || params.get("scope") === "owner") {
      if (currentUser.profile.role !== "owner" && currentUser.profile.role !== "admin") return fail("Owner access is required", 403);
      query = query.eq("owner_id", currentUser.profile.id);
    } else {
      query = query.eq("status", "live");
    }
    for (const column of ["district_id", "mandal_id", "village_id", "category_id"] as const) {
      const value = params.get(column);
      if (value) query = query.eq(column, value);
    }
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ listings: (data ?? []).map((item) => listingResponse(item as Record<string, unknown>, supabase)) });
  } catch (error) {
    console.error("List listings API error", error);
    return fail("Unable to load equipment", 500);
  }
}

export async function POST(request: NextRequest) {
  let listingId: string | null = null;
  const uploadedPaths: string[] = [];
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return fail("Authentication is required", 401);
    if (currentUser.profile.role !== "owner" && currentUser.profile.role !== "admin") return fail("Owner access is required", 403);

    const form = await request.formData();
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const category = String(form.get("category") ?? "").trim();
    const mode = String(form.get("mode") ?? "rent");
    const districtId = String(form.get("districtCode") ?? "");
    const mandalId = String(form.get("mandalCode") ?? "");
    const villageId = String(form.get("villageCode") ?? "");
    const rentPrice = numberField(form.get("rentPrice"));
    const salePrice = numberField(form.get("salePrice"));
    const deliveryAvailable = form.get("delivery") === "true";
    const deliveryCharge = deliveryAvailable ? numberField(form.get("deliveryCharge")) : 0;
    const phone = normalizeIndianPhone(currentUser.profile.phone ?? String(form.get("phone") ?? ""));

    if (!title || !category || !districtId || !mandalId || !villageId || !phone) return fail("Complete the name, category, location, and contact number", 400);
    if (!["rent", "sale", "both"].includes(mode)) return fail("Invalid listing mode", 400);
    if ((mode === "rent" || mode === "both") && rentPrice <= 0) return fail("Enter a valid rental price", 400);
    if ((mode === "sale" || mode === "both") && salePrice <= 0) return fail("Enter a valid sale price", 400);
    if (deliveryCharge < 0) return fail("Charges cannot be negative", 400);

    const supabase = getSupabaseAdmin();
    const [{ data: categoryRow, error: categoryError }, { data: district, error: districtError }] = await Promise.all([
      supabase.from("equipment_categories").select("id").eq("name", category).maybeSingle(),
      supabase.from("districts").select("id").eq("id", districtId).maybeSingle(),
    ]);
    if (categoryError || districtError) throw categoryError ?? districtError;
    if (!categoryRow || !district) return fail("Equipment or location data is not available", 400);

    const { data: mandal, error: mandalError } = await supabase.from("mandals").select("id").eq("id", mandalId).eq("district_id", district.id).maybeSingle();
    if (mandalError) throw mandalError;
    if (!mandal) return fail("Equipment or location data is not available", 400);
    const { data: village, error: villageError } = await supabase.from("villages").select("id").eq("id", villageId).eq("mandal_id", mandal.id).maybeSingle();
    if (villageError) throw villageError;
    if (!village) return fail("Equipment or location data is not available", 400);

    const { data: listing, error: listingError } = await supabase.from("listings").insert({
      owner_id: currentUser.profile.id,
      category_id: categoryRow.id,
      title,
      description,
      brand: String(form.get("brand") ?? "").trim() || null,
      model_name: String(form.get("modelName") ?? "").trim() || null,
      model_year: form.get("modelYear") ? numberField(form.get("modelYear")) : null,
      condition: String(form.get("condition") ?? "good"),
      listing_mode: mode,
      sale_price: mode === "rent" ? null : salePrice,
      delivery_available: deliveryAvailable,
      operator_available: form.get("operatorAvailable") === "true",
      delivery_charge: deliveryCharge,
      district_id: district.id,
      mandal_id: mandal.id,
      village_id: village.id,
      price: mode === "sale" ? 0 : rentPrice,
      price_unit: String(form.get("rentUnit") ?? "day"),
      phone,
      whatsapp_number: phone,
      status: "live",
      available: true,
    }).select("id").single();
    if (listingError || !listing) throw listingError ?? new Error("Listing was not created");
    listingId = String(listing.id);

    const imageValues = form.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
    const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (imageValues.some((file) => !allowedImageTypes.has(file.type))) return fail("Only JPG, PNG, or WebP images are supported", 400);
    if (imageValues.some((file) => file.size > 5 * 1024 * 1024)) return fail("Each equipment image must be 5 MB or smaller", 400);
    const files = imageValues.slice(0, 5);
    for (const [index, file] of files.entries()) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-") || "equipment-image";
      const path = `${currentUser.profile.id}/${listingId}/${randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("equipment-images").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      uploadedPaths.push(path);
      const { error: imageError } = await supabase.from("listing_images").insert({ listing_id: listingId, storage_path: path, is_primary: index === 0, sort_order: index });
      if (imageError) throw imageError;
    }

    const { data: created, error: createdError } = await supabase.from("marketplace_listings").select("*").eq("id", listingId).single();
    if (createdError || !created) throw createdError ?? new Error("Published listing could not be loaded");
    return NextResponse.json({ listing: listingResponse(created as Record<string, unknown>, supabase) }, { status: 201 });
  } catch (error) {
    const supabase = getSupabaseAdmin();
    if (listingId) {
      await supabase.from("listings").delete().eq("id", listingId);
      if (uploadedPaths.length) await supabase.storage.from("equipment-images").remove(uploadedPaths);
    }
    console.error("Create listing API error", error);
    return fail("Unable to publish equipment", 500);
  }
}
