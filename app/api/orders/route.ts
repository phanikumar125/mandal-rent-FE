import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";
import { createRazorpayOrder, razorpayKeyId } from "@/lib/razorpay";
import { calculatePaymentSplit } from "@/lib/commission";
import { isValidIsoDate } from "@/lib/date-validation";

function fail(message: string, status: number) {
  return NextResponse.json({ error: "ORDER_FAILED", message }, { status });
}

function daysBetween(start: string, end: string) {
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  return Math.floor((endTime - startTime) / 86_400_000) + 1;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return fail("Authentication is required", 401);
    if (currentUser.profile.role !== "owner" && currentUser.profile.role !== "farmer" && currentUser.profile.role !== "admin") return fail("Access is not allowed", 403);
    const supabase = getSupabaseAdmin();
    let query = supabase.from("booking_requests").select("id, listing_id, requester_id, owner_id, transaction_type, contact_phone, rental_start, rental_end, duration_days, unit_price, rental_amount, delivery_charge, total_amount, rental_status, payment_status, payment_method, message, created_at").order("created_at", { ascending: false }).limit(100);
    if (currentUser.profile.role === "owner") query = query.eq("owner_id", currentUser.profile.id);
    if (currentUser.profile.role === "farmer") query = query.eq("requester_id", currentUser.profile.id);
    const { data, error } = await query;
    if (error) throw error;
    const orders = data ?? [];
    const listingIds = [...new Set(orders.map((order) => order.listing_id))];
    const profileIds = [...new Set(orders.flatMap((order) => [order.requester_id, order.owner_id]))];
    const [{ data: listings, error: listingsError }, { data: profiles, error: profilesError }, { data: images, error: imagesError }] = await Promise.all([
      listingIds.length ? supabase.from("listings").select("id, title").in("id", listingIds) : Promise.resolve({ data: [], error: null }),
      profileIds.length ? supabase.from("profiles").select("id, full_name").in("id", profileIds) : Promise.resolve({ data: [], error: null }),
      listingIds.length ? supabase.from("listing_images").select("listing_id, storage_path, is_primary, sort_order").in("listing_id", listingIds).order("is_primary", { ascending: false }).order("sort_order", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    ]);
    if (listingsError || profilesError || imagesError) throw listingsError ?? profilesError ?? imagesError;
    const listingNames = new Map((listings ?? []).map((listing) => [listing.id, listing.title]));
    const profileNames = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
    const imagePaths = new Map<string, string>();
    for (const image of images ?? []) if (!imagePaths.has(image.listing_id)) imagePaths.set(image.listing_id, image.storage_path);
    const bookingIds = orders.map((order) => order.id);
    const { data: payments, error: paymentsError } = bookingIds.length
      ? await supabase.from("payments").select("booking_request_id, rental_amount, delivery_charge, gross_amount, platform_commission, owner_amount, status, payout_status, gateway_payment_id").in("booking_request_id", bookingIds)
      : { data: [], error: null };
    if (paymentsError) throw paymentsError;
    const paymentByBooking = new Map((payments ?? []).map((payment) => [payment.booking_request_id, payment]));
    return NextResponse.json({
      orders: orders.map((order) => ({
        ...order,
        listing_title: listingNames.get(order.listing_id) ?? "Equipment",
        farmer_name: profileNames.get(order.requester_id) ?? "Farmer",
        owner_name: profileNames.get(order.owner_id) ?? "Owner",
        listing_image: imagePaths.has(order.listing_id) ? supabase.storage.from("equipment-images").getPublicUrl(imagePaths.get(order.listing_id)!).data.publicUrl : null,
        payment: paymentByBooking.get(order.id) ?? null,
      })),
    });
  } catch (error) {
    console.error("Orders API error", error);
    return fail("Unable to load rental requests", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return fail("Authentication is required", 401);
    if (currentUser.profile.role !== "farmer") return fail("Farmer access is required", 403);
    const body = (await request.json()) as {
      listingId?: string;
      mode?: "rent" | "purchase";
      date?: string;
      startDate?: string;
      endDate?: string;
      paymentMethod?: "upi" | "card";
      farmerNote?: string;
    };
    if (!body.listingId || (body.mode !== "rent" && body.mode !== "purchase")) return fail("Invalid rental request", 400);
    if (!body.paymentMethod || !["upi", "card"].includes(body.paymentMethod)) return fail("Choose a payment method", 400);

    const startDate = body.mode === "rent" ? (body.startDate ?? body.date) : null;
    const endDate = body.mode === "rent" ? (body.endDate ?? body.startDate ?? body.date) : null;
    const today = new Date().toISOString().slice(0, 10);
    if (body.mode === "rent" && (!startDate || !endDate || !isValidIsoDate(startDate) || !isValidIsoDate(endDate) || endDate < startDate || startDate < today)) return fail("Choose a valid future rental date range", 400);

    const supabase = getSupabaseAdmin();
    const { data: listing, error: listingError } = await supabase.from("listings").select("id, owner_id, listing_mode, price, price_unit, sale_price, delivery_available, delivery_charge, available, status, title").eq("id", body.listingId).maybeSingle();
    if (listingError) throw listingError;
    if (!listing || listing.status !== "live" || !listing.available) return fail("Equipment is no longer available", 400);
    if (body.mode === "rent" && listing.listing_mode === "sale") return fail("This equipment is not available for rent", 400);
    if (body.mode === "purchase" && listing.listing_mode === "rent") return fail("This equipment is not available for purchase", 400);
    if (listing.owner_id === currentUser.profile.id) return fail("You cannot request your own equipment", 400);

    const durationDays = body.mode === "rent" ? daysBetween(startDate as string, endDate as string) : 1;
    const unitPrice = body.mode === "rent" ? Number(listing.price) : Number(listing.sale_price);
    const rentalAmount = unitPrice * durationDays;
    const deliveryCharge = listing.delivery_available ? Number(listing.delivery_charge ?? 0) : 0;
    const split = calculatePaymentSplit(rentalAmount, deliveryCharge);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0 || split.grossAmount <= 0) return fail("Equipment pricing is unavailable", 400);

    const { data: activeRequests, error: activeError } = await supabase.from("booking_requests").select("id, rental_start, rental_end, rental_status").eq("listing_id", listing.id).in("rental_status", ["requested", "accepted", "confirmed", "in_progress"]);
    if (activeError) throw activeError;
    if (body.mode === "rent" && activeRequests?.some((item) => item.rental_start && item.rental_end && item.rental_start <= endDate! && item.rental_end >= startDate!)) return fail("Equipment is unavailable for the selected dates.", 409);
    if (body.mode === "rent") {
      const { data: blockedDates, error: blockedDatesError } = await supabase.from("listing_unavailability").select("id").eq("listing_id", listing.id).lte("start_date", endDate!).gte("end_date", startDate!).limit(1);
      if (blockedDatesError) throw blockedDatesError;
      if (blockedDates?.length) return fail("Equipment is unavailable for the selected dates.", 409);
    }

    const { data: booking, error: bookingError } = await supabase.from("booking_requests").insert({
      listing_id: listing.id,
      requester_id: currentUser.profile.id,
      owner_id: listing.owner_id,
      channel: "inquiry",
      status: "new",
      scheduled_for: startDate,
      contact_phone: currentUser.profile.phone,
      message: typeof body.farmerNote === "string" ? body.farmerNote.trim().slice(0, 1200) : null,
      transaction_type: body.mode,
      rental_start: startDate,
      rental_end: endDate,
      duration_days: durationDays,
      unit_price: unitPrice,
      rental_amount: rentalAmount,
      delivery_charge: deliveryCharge,
      total_amount: split.grossAmount,
      rental_status: "requested",
      payment_status: "pending",
      payment_method: body.paymentMethod,
    }).select("id, listing_id, owner_id, transaction_type, rental_start, rental_end, duration_days, unit_price, rental_amount, delivery_charge, total_amount, rental_status, payment_status").single();
    if (bookingError || !booking) throw bookingError ?? new Error("Rental request was not created");

    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({ amount: Math.round(split.grossAmount * 100), receipt: booking.id, notes: { booking_request_id: booking.id, listing_id: listing.id } });
    } catch (error) {
      await supabase.from("booking_requests").update({ payment_status: "failed" }).eq("id", booking.id);
      throw error;
    }
    const { data: payment, error: paymentError } = await supabase.from("payments").insert({
      booking_request_id: booking.id,
      farmer_id: currentUser.profile.id,
      owner_id: listing.owner_id,
      listing_id: listing.id,
      gateway: "razorpay",
      gateway_order_id: razorpayOrder.id,
      amount: split.grossAmount,
      currency: "INR",
      status: "pending",
      payment_method: body.paymentMethod,
      rental_amount: split.rentalAmount,
      delivery_charge: split.deliveryCharge,
      gross_amount: split.grossAmount,
      platform_commission: split.platformCommission,
      owner_amount: split.ownerAmount,
      payout_status: "pending",
      metadata: { duration_days: durationDays },
    }).select("id, gateway_order_id, amount, currency, status").single();
    if (paymentError || !payment) {
      await supabase.from("booking_requests").update({ payment_status: "failed" }).eq("id", booking.id);
      throw paymentError ?? new Error("Payment record was not created");
    }

    return NextResponse.json({ bookingRequest: booking, payment: { ...payment, key_id: razorpayKeyId(), checkout_amount: razorpayOrder.amount } }, { status: 201 });
  } catch (error) {
    console.error("Create rental request API error", error);
    const unavailable = error instanceof Error && error.message.toLowerCase().includes("equipment is unavailable");
    const message = unavailable ? "Equipment is unavailable for the selected dates." : error instanceof Error && error.message.includes("configuration") ? "Online payment is not configured yet" : "Unable to create rental request";
    return fail(message, unavailable ? 409 : message.includes("configured") ? 503 : 500);
  }
}
