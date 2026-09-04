import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-auth";
import AdminPayments from "./payments-panel";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.profile.role !== "admin") redirect("/dashboard");
  return <AdminPayments adminName={currentUser.profile.full_name} />;
}
