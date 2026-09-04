import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-auth";
import AdminBookings from "./bookings-panel";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.profile.role !== "admin") redirect("/dashboard");
  return <AdminBookings adminName={currentUser.profile.full_name} />;
}
