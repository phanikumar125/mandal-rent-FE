import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-auth";
import AdminDashboard from "./admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.profile.role !== "admin") redirect("/dashboard");
  return <AdminDashboard adminName={currentUser.profile.full_name} />;
}
