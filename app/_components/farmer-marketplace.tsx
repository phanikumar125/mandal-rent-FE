"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Headphones,
  Languages,
  MapPin,
  Search,
  ShoppingCart,
  Star,
  Tractor,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LocationPicker, type LocationValue } from "./location-picker";
import { equipmentCatalog } from "@/app/_data/catalog";
import { useLanguage } from "./language-toggle";

type Mode = "rent" | "purchase";
type ApiListing = Record<string, unknown>;
type ApiOrder = Record<string, unknown>;
type FarmerProfile = {
  phone?: string | null;
  district_id?: string | null;
  mandal_id?: string | null;
  village_id?: string | null;
  district?: string | null;
  mandal?: string | null;
  village?: string | null;
};
type MarketplaceListing = {
  id: string;
  title: string;
  category: string;
  owner: string;
  location: string;
  district: string;
  mandal: string;
  village: string;
  districtId: string;
  mandalId: string;
  villageId: string;
  image: string | null;
  rentPrice?: number;
  rentUnit?: string;
  salePrice?: number;
  available: boolean;
  delivery: boolean;
  deliveryCharge: number;
  operatorAvailable: boolean;
  ownerId: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { contact?: string };
  notes?: Record<string, string>;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}

const emptyLocation: LocationValue = {
  districtCode: "",
  district: "",
  mandalCode: "",
  mandal: "",
  villageCode: "",
  village: "",
};
const fallbackImage = "/equipment/tractor-red.png";

const copy = {
  en: {
    language: "తెలుగు",
    eyebrow: "Nearby farm machinery",
    title: "Find equipment near your farm",
    subtitle:
      "Published equipment from verified MandalRent owners, ordered by your saved location.",
    rent: "Rent",
    buy: "Buy",
    location: "Search another location",
    all: "All locations",
    category: "Category",
    allCategories: "All categories",
    search: "Search equipment",
    available: "Available",
    requestRent: "Request rental",
    requestBuy: "Start purchase",
    owner: "Owner",
    nearby: "Nearby owner",
    sameVillage: "Same village",
    sameMandal: "Same mandal",
    sameDistrict: "Same district",
    otherLocation: "Other location",
    perDay: "/ day",
    total: "Equipment price",
    rentalAmount: "Rental amount",
    delivery: "Delivery charge",
    amountToPay: "Amount to pay",
    pay: "Pay securely",
    cancel: "Cancel",
    startDate: "Start date",
    endDate: "End date",
    phone: "Contact mobile number",
    payment: "Payment method",
    upi: "UPI",
    card: "Card",
    paid: "Payment successful",
    noResults: "No published equipment found",
    loading: "Loading equipment...",
    requestSent:
      "Rental request created. Complete payment in the secure checkout.",
    paymentFailed:
      "Payment was not completed. You can retry from your rentals.",
    checkoutUnavailable: "Online payment is not configured yet.",
  },
  te: {
    language: "English",
    eyebrow: "దగ్గరలోని వ్యవసాయ పరికరాలు",
    title: "మీ పొలానికి దగ్గరలో పరికరాలు",
    subtitle:
      "మీ సేవ్ చేసిన ప్రదేశం ఆధారంగా నిజమైన యజమానుల ప్రచురించిన పరికరాలు.",
    rent: "అద్దె",
    buy: "కొనుగోలు",
    location: "మరో ప్రాంతాన్ని వెతకండి",
    all: "అన్ని ప్రాంతాలు",
    category: "వర్గం",
    allCategories: "అన్ని వర్గాలు",
    search: "పరికరాలు వెతకండి",
    available: "అందుబాటులో ఉంది",
    requestRent: "అద్దె అభ్యర్థన",
    requestBuy: "కొనుగోలు ప్రారంభించండి",
    owner: "యజమాని",
    nearby: "దగ్గరలోని యజమాని",
    sameVillage: "అదే గ్రామం",
    sameMandal: "అదే మండలం",
    sameDistrict: "అదే జిల్లా",
    otherLocation: "ఇతర ప్రాంతం",
    perDay: "/ రోజు",
    total: "పరికరం ధర",
    rentalAmount: "అద్దె మొత్తం",
    delivery: "రవాణా ఛార్జీ",
    amountToPay: "చెల్లించాల్సిన మొత్తం",
    pay: "సురక్షితంగా చెల్లించండి",
    cancel: "రద్దు",
    startDate: "ప్రారంభ తేదీ",
    endDate: "ముగింపు తేదీ",
    phone: "మొబైల్ నంబర్",
    payment: "చెల్లింపు విధానం",
    upi: "UPI",
    card: "కార్డ్",
    paid: "చెల్లింపు విజయవంతం",
    noResults: "ప్రచురించిన పరికరాలు లేవు",
    loading: "పరికరాలు లోడ్ అవుతున్నాయి...",
    requestSent:
      "అద్దె అభ్యర్థన సృష్టించబడింది. సురక్షిత చెల్లింపును పూర్తి చేయండి.",
    paymentFailed:
      "చెల్లింపు పూర్తి కాలేదు. మీ అద్దెల నుండి మళ్లీ ప్రయత్నించండి.",
    checkoutUnavailable: "ఆన్‌లైన్ చెల్లింపు ఇంకా కాన్ఫిగర్ కాలేదు.",
  },
} as const;

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function mapListing(item: ApiListing): MarketplaceListing {
  const mode = String(item.listing_mode);
  return {
    id: String(item.id),
    title: String(item.title),
    category: String(item.category),
    owner: String(item.owner_name ?? "MandalRent owner"),
    location: [item.village, item.mandal, item.district]
      .filter(Boolean)
      .join(", "),
    district: String(item.district ?? ""),
    mandal: String(item.mandal ?? ""),
    village: String(item.village ?? ""),
    districtId: String(item.district_id ?? ""),
    mandalId: String(item.mandal_id ?? ""),
    villageId: String(item.village_id ?? ""),
    image: item.image ? String(item.image) : null,
    rentPrice: mode === "sale" ? undefined : Number(item.price),
    rentUnit: String(item.price_unit ?? "day"),
    salePrice: mode === "rent" ? undefined : Number(item.sale_price),
    available: Boolean(item.available),
    delivery: Boolean(item.delivery_available),
    deliveryCharge: Number(item.delivery_charge ?? 0),
    operatorAvailable: Boolean(item.operator_available),
    ownerId: String(item.owner_id),
  };
}

async function loadRazorpay() {
  if (window.Razorpay) return true;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Razorpay checkout could not load"));
    document.body.appendChild(script);
  });
  return Boolean(window.Razorpay);
}

export function FarmerMarketplace() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const text = copy[language];
  const [mode, setMode] = useState<Mode>("rent");
  const [location, setLocation] = useState<LocationValue>(emptyLocation);
  const [profile, setProfile] = useState<FarmerProfile>({});
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const [sessionResponse, listingResponse, ordersResponse] =
        await Promise.all([
          fetch("/api/auth/session", { cache: "no-store" }),
          fetch("/api/listings", { cache: "no-store" }),
          fetch("/api/orders", { cache: "no-store" }),
        ]);
      if (!sessionResponse.ok) return router.replace("/login");
      const session = (await sessionResponse.json()) as {
        profile?: FarmerProfile & { role?: string };
      };
      if (!session.profile || session.profile.role !== "farmer")
        return router.replace("/login");
      const body = (await listingResponse.json().catch(() => ({}))) as {
        listings?: ApiListing[];
      };
      const ordersBody = (await ordersResponse.json().catch(() => ({}))) as {
        orders?: ApiOrder[];
      };
      if (!active) return;
      setProfile(session.profile);
      setPhone(String(session.profile.phone ?? ""));
      setLocation({
        districtCode: String(session.profile.district_id ?? ""),
        district: String(session.profile.district ?? ""),
        mandalCode: String(session.profile.mandal_id ?? ""),
        mandal: String(session.profile.mandal ?? ""),
        villageCode: String(session.profile.village_id ?? ""),
        village: String(session.profile.village ?? ""),
      });
      setListings((body.listings ?? []).map(mapListing));
      setOrders(ordersBody.orders ?? []);
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [router]);

  const filtered = useMemo(() => {
    const wantedDistrict = location.districtCode || profile.district_id || "";
    const wantedMandal = location.mandalCode || profile.mandal_id || "";
    const wantedVillage = location.villageCode || profile.village_id || "";
    const normalizedQuery = query.trim().toLowerCase();
    return listings
      .filter((item) => {
        const modeMatches =
          mode === "rent" ? Boolean(item.rentPrice) : Boolean(item.salePrice);
        const categoryMatches =
          category === "All" || item.category === category;
        const queryMatches =
          !normalizedQuery ||
          `${item.title} ${item.category} ${item.location}`
            .toLowerCase()
            .includes(normalizedQuery);
        return modeMatches && categoryMatches && queryMatches;
      })
      .sort((a, b) => {
        const score = (item: MarketplaceListing) =>
          item.villageId === wantedVillage && wantedVillage
            ? 0
            : item.mandalId === wantedMandal && wantedMandal
              ? 1
              : item.districtId === wantedDistrict && wantedDistrict
                ? 2
                : 3;
        return score(a) - score(b) || a.title.localeCompare(b.title);
      });
  }, [
    category,
    listings,
    location.districtCode,
    location.mandalCode,
    location.villageCode,
    mode,
    profile.district_id,
    profile.mandal_id,
    profile.village_id,
    query,
  ]);

  function locationLabel(item: MarketplaceListing) {
    const district = location.districtCode || profile.district_id;
    const mandal = location.mandalCode || profile.mandal_id;
    const village = location.villageCode || profile.village_id;
    if (village && item.villageId === village) return text.sameVillage;
    if (mandal && item.mandalId === mandal) return text.sameMandal;
    if (district && item.districtId === district) return text.sameDistrict;
    return text.otherLocation;
  }

  async function placeOrder() {
    if (!selected) return;
    if (mode === "rent" && (!startDate || !endDate || endDate < startDate))
      return toast.error("Choose a valid rental date range");
    setPaying(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selected.id,
          mode,
          startDate,
          endDate,
          paymentMethod,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
        payment?: {
          key_id: string;
          gateway_order_id: string;
          amount: number;
          currency: string;
        };
        bookingRequest?: { id: string };
      };
      if (!response.ok || !body.payment || !body.bookingRequest)
        throw new Error(body.message ?? "Unable to create rental request");
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable");
      const checkout = new window.Razorpay({
        key: body.payment.key_id,
        amount: body.payment.amount,
        currency: body.payment.currency,
        name: "MandalRent",
        description: selected.title,
        order_id: body.payment.gateway_order_id,
        prefill: { contact: phone },
        notes: { payment_method: paymentMethod },
        handler: async (payment) => {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingRequestId: body.bookingRequest!.id,
              ...payment,
            }),
          });
          setPaying(false);
          if (!verifyResponse.ok) return toast.error(text.paymentFailed);
          toast.success(text.paid);
          setSelected(null);
          const ordersResponse = await fetch("/api/orders", {
            cache: "no-store",
          });
          if (ordersResponse.ok)
            setOrders(
              ((await ordersResponse.json()) as { orders?: ApiOrder[] })
                .orders ?? [],
            );
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast.error(text.paymentFailed);
          },
        },
      });
      checkout.on("payment.failed", () => {
        setPaying(false);
        toast.error(text.paymentFailed);
      });
      checkout.open();
    } catch (error) {
      setPaying(false);
      toast.error(
        error instanceof Error && error.message.includes("configured")
          ? text.checkoutUnavailable
          : error instanceof Error
            ? error.message
            : "Unable to start payment",
      );
    }
  }

  const duration =
    mode === "rent" && startDate && endDate && endDate >= startDate
      ? Math.floor(
          (Date.parse(`${endDate}T00:00:00Z`) -
            Date.parse(`${startDate}T00:00:00Z`)) /
            86_400_000,
        ) + 1
      : 1;
  const baseAmount = selected
    ? mode === "rent"
      ? (selected.rentPrice ?? 0) * duration
      : (selected.salePrice ?? 0)
    : 0;
  const deliveryCharge = selected?.deliveryCharge ?? 0;
  const total = baseAmount + deliveryCharge;

  return (
    <main className="farmer-page">
      <header className="site-header">
        <Link href="/" className="site-brand">
          <span className="brand-mark">
            <Tractor />
          </span>
          <span>
            Mandal<span>Rent</span>
          </span>
        </Link>
        <nav className="header-actions">
          <button onClick={toggleLanguage} className="language-button">
            <Languages /> {text.language}
          </button>
          <a href="tel:18001234567" className="help-line">
            <Headphones />
            <span>
              Help<strong>1800 123 4567</strong>
            </span>
          </a>
          <button
            className="login-link"
            onClick={() => {
              void fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
          >
            {text.language === "English" ? "లాగ్ అవుట్" : "Log out"}
          </button>
        </nav>
      </header>
      <section className="farmer-hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            <MapPin /> {text.eyebrow}
          </span>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <div className="mode-panel">
          <span>{text.category}</span>
          <ToggleGroup
            value={[mode]}
            onValueChange={(values) => values[0] && setMode(values[0] as Mode)}
            className="market-mode"
            spacing={0}
          >
            <ToggleGroupItem value="rent" className="mode-choice">
              <CalendarDays />
              <span>
                <strong>{text.rent}</strong>
                <small>Rent equipment</small>
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem value="purchase" className="mode-choice">
              <ShoppingCart />
              <span>
                <strong>{text.buy}</strong>
                <small>Buy equipment</small>
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </section>
      <section className="location-search">
        <div className="section-label">
          <MapPin />
          <span>
            <strong>{text.location}</strong>
            <small>{location.district || text.all}</small>
          </span>
        </div>
        <LocationPicker value={location} onChange={setLocation} />
        <Button className="location-submit" onClick={() => setQuery(query)}>
          {text.search}
        </Button>
      </section>
      <section className="farmer-rentals">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MandalRent</span>
            <h2>My rentals</h2>
          </div>
          <span className="catalog-count">{orders.length}</span>
        </div>
        {orders.length ? (
          <div className="rental-history">
            {orders.map((order) => (
              <article className="request-row" key={String(order.id)}>
                <strong>{String(order.listing_title ?? "Equipment")}</strong>
                <small>
                  {String(order.rental_start ?? "Purchase")}
                  {order.rental_end
                    ? " → " + String(order.rental_end)
                    : ""} · {String(order.rental_status)} ·{" "}
                  {String(order.payment_status)}
                </small>
                <span>{rupees(Number(order.total_amount ?? 0))}</span>
              </article>
            ))}
          </div>
        ) : (
          <p>No rental requests yet.</p>
        )}
      </section>
      <section className="catalog-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{text.category}</span>
            <h2>{text.title}</h2>
          </div>
          <span className="catalog-count">
            {filtered.length} {text.available}
          </span>
        </div>
        <div className="category-scroller">
          <button
            className={
              category === "All" ? "category-chip active" : "category-chip"
            }
            onClick={() => setCategory("All")}
          >
            <strong>{text.allCategories}</strong>
          </button>
          {equipmentCatalog.slice(0, 8).map((item) => (
            <button
              key={item.name}
              className={
                category === item.name
                  ? "category-chip active"
                  : "category-chip"
              }
              onClick={() => setCategory(item.name)}
            >
              <strong>{language === "te" ? item.te : item.name}</strong>
              <small>{item.name}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="listing-section">
        <div className="listing-toolbar">
          <div>
            <span className="eyebrow">{text.eyebrow}</span>
            <h2>{mode === "rent" ? text.rent : text.buy}</h2>
          </div>
          <div className="listing-search">
            <Search />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text.search}
            />
          </div>
        </div>
        <div className="listing-list">
          {loading ? (
            <div className="no-results">
              <Tractor />
              <h3>{text.loading}</h3>
            </div>
          ) : filtered.length ? (
            filtered.map((item) => (
              <article className="equipment-row" key={item.id}>
                <div className="equipment-image">
                  {/* A plain image accepts provider URLs without weakening Next image security configuration. */}
                  <img src={item.image ?? fallbackImage} alt={item.title} />
                  <span />
                </div>
                <div className="equipment-main">
                  <div className="equipment-tags">
                    <Badge variant="secondary">{item.category}</Badge>
                    {item.available && (
                      <Badge className="available">
                        <CheckCircle2 /> {text.available}
                      </Badge>
                    )}
                  </div>
                  <h3>{item.title}</h3>
                  <p className="owner-line">
                    <Star /> {item.owner}
                  </p>
                  <p className="location-line">
                    <MapPin /> {item.location} ·{" "}
                    <strong>{locationLabel(item)}</strong>
                  </p>
                  <p>
                    {item.operatorAvailable
                      ? "Operator available"
                      : "Operator not included"}{" "}
                    ·{" "}
                    {item.delivery
                      ? `${text.delivery}: ${rupees(item.deliveryCharge)}`
                      : "No delivery"}
                  </p>
                </div>
                <div className="equipment-price">
                  <span>{text.total}</span>
                  <strong>
                    {rupees(
                      mode === "rent"
                        ? (item.rentPrice ?? 0)
                        : (item.salePrice ?? 0),
                    )}
                  </strong>
                  <small>
                    {mode === "rent"
                      ? item.rentUnit ?? "day"
                      : "Total"}
                  </small>
                  <Button size="lg" onClick={() => setSelected(item)}>
                    {mode === "rent" ? text.requestRent : text.requestBuy}
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <div className="no-results">
              <Tractor />
              <h3>{text.noResults}</h3>
            </div>
          )}
        </div>
      </section>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="order-dialog">
          <DialogHeader>
            <DialogTitle>
              {mode === "rent" ? text.requestRent : text.requestBuy}
            </DialogTitle>
            <DialogDescription>
              {selected?.title} · {selected?.owner}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            {mode === "rent" && (
              <div className="two-fields">
                <Field>
                  <FieldLabel htmlFor="start-date">{text.startDate}</FieldLabel>
                  <Input
                    id="start-date"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="end-date">{text.endDate}</FieldLabel>
                  <Input
                    id="end-date"
                    type="date"
                    min={startDate || new Date().toISOString().slice(0, 10)}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </Field>
              </div>
            )}
            <Field>
              <FieldLabel>{text.payment}</FieldLabel>
              <ToggleGroup
                value={[paymentMethod]}
                onValueChange={(values) =>
                  values[0] && setPaymentMethod(values[0] as "upi" | "card")
                }
                spacing={8}
              >
                <ToggleGroupItem value="upi">{text.upi}</ToggleGroupItem>
                <ToggleGroupItem value="card">{text.card}</ToggleGroupItem>
              </ToggleGroup>
            </Field>
          </FieldGroup>
          <div className="order-total">
            <span>
              {text.rentalAmount}
              {mode === "rent"
                ? ` (${duration} day${duration === 1 ? "" : "s"})`
                : ""}
              <br />
              {text.delivery}
              <br />
              <strong>{text.amountToPay}</strong>
            </span>
            <strong>
              {rupees(baseAmount)}
              <br />
              {rupees(deliveryCharge)}
              <br />
              {rupees(total)}
            </strong>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              {text.cancel}
            </Button>
            <Button onClick={placeOrder} disabled={paying || !selected}>
              {paying ? "…" : `${text.pay} · ${rupees(total)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
