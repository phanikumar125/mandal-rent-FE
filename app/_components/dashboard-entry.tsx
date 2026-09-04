"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FarmerDashboard } from "./farmer-dashboard";

export function DashboardEntry() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    async function checkAuth() {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (!response.ok) return router.replace("/login");
      const data = (await response.json()) as { profile?: { role?: string } };
      const profile = data.profile;
      if (!profile) return router.replace("/login");
      if (profile.role === "owner") return router.replace("/owner");
      if (profile.role === "admin") return router.replace("/admin");
      if (active) setReady(true);
    }
    void checkAuth();
    return () => {
      active = false;
    };
  }, [router]);
  return ready ? <FarmerDashboard /> : <main className="portal-content" />;
}
