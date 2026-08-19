"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readSessionProfile } from "../_data/session";
import { FarmerMarketplace } from "./farmer-marketplace";

export function DashboardEntry() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const profile = readSessionProfile();
    if (!profile.authenticated) return router.replace("/login");
    if (profile.role === "owner") return router.replace("/owner");
    queueMicrotask(() => setReady(true));
  }, [router]);
  return ready ? <FarmerMarketplace /> : <main className="portal-content" />;
}
