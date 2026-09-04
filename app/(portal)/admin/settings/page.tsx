import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-auth";
import AdminSettings from "./settings-panel";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.profile.role !== "admin") redirect("/dashboard");
  return <AdminSettings adminName={currentUser.profile.full_name} />;
}
