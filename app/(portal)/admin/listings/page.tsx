import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-auth";
import AdminListings from "./listings-panel";
export const dynamic = "force-dynamic";
export default async function AdminListingsPage() { const currentUser = await getCurrentUser(); if (!currentUser) redirect("/login"); if (currentUser.profile.role !== "admin") redirect("/dashboard"); return <AdminListings adminName={currentUser.profile.full_name} />; }
