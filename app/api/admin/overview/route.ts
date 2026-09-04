import { NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

const PAGE_SIZE = 1000;

type PaymentRow = {
  id: string;
  booking_request_id: string;
  farmer_id: string;
  owner_id: string;
  listing_id: string;
  amount: number | string | null;
  status: string;
  rental_amount: number | string | null;
  delivery_charge: number | string | null;
  gross_amount: number | string | null;
  platform_commission: number | string | null;
  owner_amount: number | string | null;
  payout_status: string | null;
  payment_method: string | null;
  gateway_payment_id: string | null;
  created_at: string;
  paid_at: string | null;
};

type BookingRow = { id: string; created_at: string; rental_status: string | null };

async function fetchAllPayments(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const payments: PaymentRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("payments")
      .select("id, booking_request_id, farmer_id, owner_id, listing_id, amount, status, rental_amount, delivery_charge, gross_amount, platform_commission, owner_amount, payout_status, payment_method, gateway_payment_id, created_at, paid_at")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    payments.push(...((data ?? []) as PaymentRow[]));
    if (!data || data.length < PAGE_SIZE) return payments;
  }
}

async function fetchAllBookings(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const bookings: BookingRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("booking_requests")
      .select("id, created_at, rental_status")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    bookings.push(...((data ?? []) as BookingRow[]));
    if (!data || data.length < PAGE_SIZE) return bookings;
  }
}

const amount = (value: number | string | null | undefined) => Number(value ?? 0);

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    if (currentUser.profile.role !== "admin") return NextResponse.json({ error: "FORBIDDEN", message: "Admin access is required" }, { status: 403 });

    const supabase = getSupabaseAdmin();
    const [
      profilesResult,
      farmersResult,
      ownersResult,
      listingsResult,
      publishedListingsResult,
      requestsResult,
      districtsResult,
      mandalsResult,
      villagesResult,
      payments,
      bookingsForTrend,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "farmer"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "owner"),
      supabase.from("listings").select("id", { count: "exact", head: true }),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "live"),
      supabase.from("booking_requests").select("id", { count: "exact", head: true }),
      supabase.from("districts").select("id", { count: "exact", head: true }),
      supabase.from("mandals").select("id", { count: "exact", head: true }),
      supabase.from("villages").select("id", { count: "exact", head: true }),
      fetchAllPayments(supabase),
      fetchAllBookings(supabase),
    ]);
    const countError = [
      profilesResult.error,
      farmersResult.error,
      ownersResult.error,
      listingsResult.error,
      publishedListingsResult.error,
      requestsResult.error,
      districtsResult.error,
      mandalsResult.error,
      villagesResult.error,
    ].find(Boolean);
    if (countError) throw countError;

    const rows = payments;
    const bookingStatusById = new Map(bookingsForTrend.map((booking) => [booking.id, booking.rental_status]));
    const successfulPayments = rows.filter((row) => row.status === "paid" && bookingStatusById.get(row.booking_request_id) !== "cancelled");
    const trendDays = Array.from({ length: 7 }, (_, index) => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - (6 - index));
      return day;
    });
    const trend = trendDays.map((day) => {
      const key = day.toISOString().slice(0, 10);
      const dayBookings = bookingsForTrend.filter((booking) => booking.created_at.slice(0, 10) === key).length;
      const dayPayments = rows.filter((row) => (row.paid_at ?? row.created_at).slice(0, 10) === key);
      return {
        date: key,
        label: day.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        rentalRequests: dayBookings,
        successfulPayments: dayPayments.filter((row) => row.status === "paid" && bookingStatusById.get(row.booking_request_id) !== "cancelled").length,
        failedPayments: dayPayments.filter((row) => row.status === "failed").length,
        transactionValue: dayPayments.filter((row) => row.status === "paid" && bookingStatusById.get(row.booking_request_id) !== "cancelled").reduce((total, row) => total + amount(row.gross_amount ?? row.amount), 0),
      };
    });
    const sum = (field: "gross_amount" | "platform_commission" | "owner_amount", predicate: (row: PaymentRow) => boolean = () => true) =>
      rows.filter((row) => bookingStatusById.get(row.booking_request_id) !== "cancelled" && predicate(row)).reduce((total, row) => total + amount(row[field]), 0);
    const paidSum = (field: "gross_amount" | "platform_commission" | "owner_amount") =>
      successfulPayments.reduce((total, row) => total + amount(row[field]), 0);

    const profileIds = [...new Set(rows.flatMap((row) => [row.farmer_id, row.owner_id]))];
    const listingIds = [...new Set(rows.map((row) => row.listing_id))];
    const bookingIds = [...new Set(rows.map((row) => row.booking_request_id))];
    const [{ data: profiles, error: profilesError }, { data: listings, error: listingsError }, { data: bookings, error: bookingsError }] = await Promise.all([
      profileIds.length ? supabase.from("profiles").select("id, full_name, phone").in("id", profileIds) : Promise.resolve({ data: [], error: null }),
      listingIds.length ? supabase.from("listings").select("id, title").in("id", listingIds) : Promise.resolve({ data: [], error: null }),
      bookingIds.length ? supabase.from("booking_requests").select("id, transaction_type, rental_start, rental_end, duration_days, rental_amount, delivery_charge, total_amount, rental_status, payment_status").in("id", bookingIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (profilesError || listingsError || bookingsError) throw profilesError ?? listingsError ?? bookingsError;

    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const listingById = new Map((listings ?? []).map((listing) => [listing.id, listing]));
    const bookingById = new Map((bookings ?? []).map((booking) => [booking.id, booking]));
    const transactions = rows.slice(0, 50).map((row) => {
      const booking = bookingById.get(row.booking_request_id);
      return {
        id: row.id,
        farmer: profileById.get(row.farmer_id)?.full_name ?? "Unknown farmer",
        owner: profileById.get(row.owner_id)?.full_name ?? "Unknown owner",
        equipment: listingById.get(row.listing_id)?.title ?? "Unknown equipment",
        rental: {
          type: booking?.transaction_type ?? "rent",
          start: booking?.rental_start ?? null,
          end: booking?.rental_end ?? null,
          durationDays: booking?.duration_days ?? null,
        },
        rentalAmount: amount(row.rental_amount ?? booking?.rental_amount),
        deliveryCharge: amount(row.delivery_charge ?? booking?.delivery_charge),
        totalAmount: amount(row.gross_amount ?? row.amount ?? booking?.total_amount),
        commission: amount(row.platform_commission),
        ownerAmount: amount(row.owner_amount),
        paymentStatus: row.status,
        payoutStatus: row.payout_status ?? "pending",
        paymentMethod: row.payment_method,
        gatewayPaymentId: row.gateway_payment_id,
        date: row.paid_at ?? row.created_at,
      };
    });

    return NextResponse.json({
      metrics: {
        users: profilesResult.count ?? 0,
        farmers: farmersResult.count ?? 0,
        owners: ownersResult.count ?? 0,
        listings: listingsResult.count ?? 0,
        publishedListings: publishedListingsResult.count ?? 0,
        rentalRequests: requestsResult.count ?? 0,
        paymentTransactions: rows.length,
        successfulPayments: successfulPayments.length,
        failedPayments: rows.filter((row) => row.status === "failed").length,
        refundedPayments: rows.filter((row) => row.status === "refunded").length,
      },
      locations: { districts: districtsResult.count ?? 0, mandals: mandalsResult.count ?? 0, villages: villagesResult.count ?? 0 },
      transactions: rows.length,
      grossAmount: paidSum("gross_amount"),
      platformCommission: paidSum("platform_commission"),
      ownerPayable: sum("owner_amount", (row) => row.status === "paid" && row.payout_status !== "paid"),
      ownerPaid: sum("owner_amount", (row) => row.status === "paid" && row.payout_status === "paid"),
      failedPayments: rows.filter((row) => row.status === "failed").length,
      refundedPayments: rows.filter((row) => row.status === "refunded").length,
      transactionsDetail: transactions,
      trend,
    });
  } catch (error) {
    console.error("Admin overview API error", error);
    return NextResponse.json({ error: "ADMIN_OVERVIEW_FAILED", message: "Unable to load admin metrics" }, { status: 500 });
  }
}
