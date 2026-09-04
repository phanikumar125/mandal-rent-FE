import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-auth";
import AdminReports from "./reports-panel";
export const dynamic = "force-dynamic";
export default async function AdminReportsPage() { const currentUser = await getCurrentUser(); if (!currentUser) redirect("/login"); if (currentUser.profile.role !== "admin") redirect("/dashboard"); return <AdminReports adminName={currentUser.profile.full_name} />; }
