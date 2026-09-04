import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";

const csv = (rows: string[][]) => rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication is required" }, { status: 401 });
    if (currentUser.profile.role !== "admin") return NextResponse.json({ error: "FORBIDDEN", message: "Admin access is required" }, { status: 403 });
    const dataset = request.nextUrl.searchParams.get("dataset"); const supabase = getSupabaseAdmin(); let rows: string[][];
    if (dataset === "users") { const { data, error } = await supabase.from("profiles").select("full_name, phone, role, is_verified, is_active, created_at").order("created_at", { ascending: false }); if (error) throw error; rows = [["Name", "Mobile Number", "Role", "Verified", "Account Status", "Joined"], ...(data ?? []).map((row) => [row.full_name, row.phone ?? "", row.role, row.is_verified ? "Yes" : "No", row.is_active ? "Active" : "Blocked", row.created_at])]; }
    else if (dataset === "listings") { const { data, error } = await supabase.from("listings").select("title, price, price_unit, status, available, created_at").order("created_at", { ascending: false }); if (error) throw error; rows = [["Equipment", "Rental Price", "Unit", "Status", "Available", "Created"], ...(data ?? []).map((row) => [row.title, String(row.price), row.price_unit, row.status, row.available ? "Yes" : "No", row.created_at])]; }
    else if (dataset === "bookings") { const { data, error } = await supabase.from("booking_requests").select("id, rental_start, rental_end, rental_status, payment_status, total_amount, created_at").order("created_at", { ascending: false }); if (error) throw error; rows = [["Booking ID", "Start", "End", "Booking Status", "Payment Status", "Farmer Total", "Created"], ...(data ?? []).map((row) => [row.id, row.rental_start ?? "", row.rental_end ?? "", row.rental_status, row.payment_status, String(row.total_amount), row.created_at])]; }
    else if (dataset === "payments") { const { data, error } = await supabase.from("payments").select("id, booking_request_id, status, gross_amount, platform_commission, owner_amount, payout_status, gateway_payment_id, created_at, paid_at").order("created_at", { ascending: false }); if (error) throw error; rows = [["Payment ID", "Booking ID", "Gateway Reference", "Payment Status", "Gross Amount", "Commission", "Owner Amount", "Payout Status", "Created", "Paid"], ...(data ?? []).map((row) => [row.id, row.booking_request_id, row.gateway_payment_id ?? "", row.status, String(row.gross_amount), String(row.platform_commission), String(row.owner_amount), row.payout_status, row.created_at, row.paid_at ?? ""])]; }
    else return NextResponse.json({ error: "INVALID_DATASET", message: "Choose users, listings, bookings, or payments" }, { status: 400 });
    return new NextResponse(csv(rows), { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=mandalrent-${dataset}.csv`, "Cache-Control": "no-store" } });
  } catch (error) { console.error("Admin export API error", error); return NextResponse.json({ error: "ADMIN_EXPORT_FAILED", message: "Unable to export data" }, { status: 500 }); }
}
