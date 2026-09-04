"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Tractor,
  UserRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  defaultSessionProfile,
  readSessionProfile,
  type ProfileSession,
} from "../_data/session";

type DashboardOrder = Record<string, unknown>;

function prettyStatus(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function locationText(profile: ProfileSession) {
  return (
    [profile.village, profile.mandal, profile.district]
      .filter(Boolean)
      .join(" / ") || "Add your farm location"
  );
}

export function FarmerDashboard() {
  const [profile, setProfile] = useState<ProfileSession | null>(null);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);

  useEffect(() => {
    fetch("/api/orders", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]));
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!data.profile) throw new Error("Profile unavailable");
        const remote = data.profile as {
          full_name?: string;
          phone?: string | null;
          role?: string;
          preferred_language?: string;
          city?: string;
          pincode?: string;
          district?: string;
          mandal?: string;
          village?: string;
          district_id?: string | null;
          mandal_id?: string | null;
          village_id?: string | null;
        };
        const local = readSessionProfile();
        setProfile({
          ...local,
          fullName: remote.full_name ?? local.fullName,
          phone: remote.phone ?? local.phone,
          role: remote.role === "owner" ? "owner" : "farmer",
          language: remote.preferred_language === "te" ? "te" : "en",
          city: remote.city ?? local.city,
          pincode: remote.pincode ?? local.pincode,
          districtId: remote.district_id ?? local.districtId,
          mandalId: remote.mandal_id ?? local.mandalId,
          villageId: remote.village_id ?? local.villageId,
          district: remote.district ?? local.district,
          mandal: remote.mandal ?? local.mandal,
          village: remote.village ?? local.village,
        });
      })
      .catch(() => setProfile(readSessionProfile()));
    return () => undefined;
  }, []);

  const currentProfile = profile ?? defaultSessionProfile;
  const name = currentProfile.fullName || "Farmer";
  const pendingOrders = orders.filter((order) => {
    const status = String(order.payment_status ?? order.rental_status ?? "");
    return status === "pending" || status === "requested";
  }).length;

  return (
    <div className="farmer-dashboard">
      <section className="dashboard-welcome">
        <div>
          <p className="eyebrow">Farmer dashboard</p>
          <h1>Welcome back, {name}</h1>
          <p className="dashboard-lead">
            Find dependable farm equipment close to your field and keep track of
            every request in one place.
          </p>
          <Link href="/marketplace" className="dashboard-primary-link">
            Find equipment <ArrowRight size={17} />
          </Link>
        </div>
        <Card className="dashboard-location-card">
          <CardContent>
            <span className="dashboard-card-icon">
              <MapPin size={20} />
            </span>
            <p>Saved farm location</p>
            <strong>{locationText(currentProfile)}</strong>
            <Link href="/profile">
              Update location <ArrowRight size={14} />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="dashboard-stats" aria-label="Farmer account overview">
        <Card>
          <CardContent>
            <CalendarDays />
            <span>My rentals</span>
            <strong>{orders.length}</strong>
            <small>Requests and bookings</small>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Tractor />
            <span>Equipment discovery</span>
            <strong>Nearby</strong>
            <small>Browse by district, mandal, or village</small>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <UserRound />
            <span>Profile status</span>
            <strong>{currentProfile.fullName ? "Ready" : "Complete"}</strong>
            <small>Keep your details up to date</small>
          </CardContent>
        </Card>
      </section>

      <section className="dashboard-columns">
        <Card>
          <CardHeader>
            <CardTitle>Recent rental activity</CardTitle>
          </CardHeader>
          <CardContent className="dashboard-orders">
            {orders.length ? (
              orders.slice(0, 4).map((order) => (
                <div className="dashboard-order-row" key={String(order.id)}>
                  <span>
                    <strong>
                      {String(order.listing_title ?? "Equipment")}
                    </strong>
                    <small><span className={`rental-status-badge status-${String(order.rental_status ?? "requested")}`}>{prettyStatus(String(order.rental_status ?? "requested"))}</span>{" "}
                      {String(order.rental_status ?? "requested")} ·{" "}
                      {String(order.payment_status ?? "pending")}
                    </small>
                  </span>
                  <b>
                    ₹{Number(order.total_amount ?? 0).toLocaleString("en-IN")}
                  </b>
                </div>
              ))
            ) : (
              <p className="dashboard-empty">
                No rental requests yet. Start by exploring nearby equipment.
              </p>
            )}
            <Link href="/marketplace" className="dashboard-text-link">
              Browse equipment <ArrowRight size={15} />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="dashboard-actions">
            <Link className="dashboard-action-button" href="/marketplace">
              <Tractor /> Find equipment
            </Link>
            <Link
              className="dashboard-action-button is-outline"
              href="/profile"
            >
              <UserRound /> Edit profile
            </Link>
            {pendingOrders > 0 ? (
              <p>
                {pendingOrders} request{pendingOrders === 1 ? "" : "s"} waiting
                for attention.
              </p>
            ) : (
              <p>Your account is ready for the next farm job.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
