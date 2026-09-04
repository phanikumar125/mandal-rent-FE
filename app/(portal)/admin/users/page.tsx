import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-auth";
import AdminUsers from "./users-panel";
export const dynamic = "force-dynamic";
export default async function AdminUsersPage() { const currentUser = await getCurrentUser(); if (!currentUser) redirect("/login"); if (currentUser.profile.role !== "admin") redirect("/dashboard"); return <AdminUsers adminName={currentUser.profile.full_name} />; }
