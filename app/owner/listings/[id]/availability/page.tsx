import { redirect } from "next/navigation";
import { getCurrentUser, getSupabaseAdmin } from "@/lib/server-auth";
import { OwnerAvailabilityCalendar } from "@/app/_components/owner-availability-calendar";

export default async function OwnerAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.profile.role !== "owner") redirect("/dashboard");
  const { id } = await params;
  const { data: listing } = await getSupabaseAdmin().from("listings").select("id, owner_id").eq("id", id).maybeSingle();
  if (!listing || listing.owner_id !== currentUser.profile.id) redirect("/owner");
  return <OwnerAvailabilityCalendar listingId={id} />;
}
