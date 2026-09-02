"use client";

import Image from "next/image";
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
import {
  demoListings,
  equipmentCatalog,
  type MarketplaceListing,
} from "@/app/_data/catalog";
import { readSessionProfile } from "@/app/_data/session";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { useLanguage } from "./language-toggle";

type Mode = "rent" | "purchase";
const emptyLocation: LocationValue = {
  districtCode: "",
  district: "",
  mandalCode: "",
  mandal: "",
  villageCode: "",
  village: "",
};

const copy = {
  en: {
    login: "Log out",
    language: "తెలుగు",
    eyebrow: "Nearby farm machinery",
    title: "Find equipment near your farm",
    subtitle:
      "Your registered district is used first, so requests reach nearby owners.",
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
    perDay: "/ day",
    total: "Equipment price",
    fee: "Platform service fee (10%)",
    pay: "Pay securely",
    cancel: "Cancel",
    date: "Required date",
    phone: "Contact mobile number",
    payment: "Payment method",
    upi: "UPI",
    card: "Card",
    paid: "Payment successful",
    noResults: "No equipment found in this district",
    logout: "Log out",
  },
  te: {
    login: "లాగ్ అవుట్",
    language: "English",
    eyebrow: "దగ్గరలోని వ్యవసాయ పరికరాలు",
    title: "మీ పొలానికి దగ్గరలో పరికరాలను కనుగొనండి",
    subtitle:
      "మీ నమోదైన జిల్లాను ముందుగా ఉపయోగిస్తాము, కాబట్టి అభ్యర్థనలు దగ్గరలోని యజమానులకు చేరతాయి.",
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
    perDay: "/ రోజు",
    total: "పరికరం ధర",
    fee: "ప్లాట్‌ఫారమ్ సేవా రుసుము (10%)",
    pay: "సురక్షితంగా చెల్లించండి",
    cancel: "రద్దు",
    date: "అవసరమైన తేదీ",
    phone: "సంప్రదింపు మొబైల్ నంబర్",
    payment: "చెల్లింపు విధానం",
    upi: "UPI",
    card: "కార్డ్",
    paid: "చెల్లింపు విజయవంతం",
    noResults: "ఈ జిల్లాలో పరికరాలు కనుగొనబడలేదు",
    logout: "లాగ్ అవుట్",
  },
} as const;

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function localMarketplaceListings(): MarketplaceListing[] {
  const records = JSON.parse(
    localStorage.getItem("mandalrent-demo-listings") ?? "[]",
  ) as Array<Record<string, unknown>>;
  return records.map((record, index) => {
    const location = (record.location ?? {}) as LocationValue;
    const mode = String(record.mode);
    return {
      id: String(record.id ?? `local-${index}`),
      ownerId: String(record.ownerId ?? "demo-owner-local"),
      title: String(record.title ?? "Farm equipment"),
      titleTe: String(record.title ?? "Farm equipment"),
      category: String(record.category ?? "Tractor"),
      owner: "Local equipment owner",
      location: [location.village, location.mandal, location.district]
        .filter(Boolean)
        .join(", "),
      district: location.district,
      distance: "Nearby",
      image: "/equipment/tractor-red.png",
      rentPrice: mode === "sale" ? undefined : Number(record.rentPrice ?? 0),
      rentUnit: "day",
      salePrice: mode === "rent" ? undefined : Number(record.salePrice ?? 0),
      rating: 5,
      available: true,
      delivery: false,
    };
  });
}

export function FarmerMarketplace() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const text = copy[language];
  const [mode, setMode] = useState<Mode>("rent");
  const [location, setLocation] = useState<LocationValue>(emptyLocation);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const session = readSessionProfile();
    const initialListings = [...localMarketplaceListings(), ...demoListings];
    queueMicrotask(() => {
      setPhone(session.phone);
      setListings(initialListings);
    });
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase
      .from("marketplace_listings")
      .select("*")
      .eq("status", "live")
      .limit(50)
      .then(({ data }) => {
        if (!data?.length) return;
        const mapped = data.map(
          (item: Record<string, unknown>): MarketplaceListing => {
            const storagePath = item.primary_image_path as string | null;
            return {
              id: String(item.id),
              ownerId: String(item.owner_id),
              title: String(item.title),
              titleTe: String(item.title),
              category: String(item.category),
              owner: String(item.owner_name ?? text.owner),
              location: [item.village, item.mandal, item.district]
                .filter(Boolean)
                .join(", "),
              district: String(item.district ?? ""),
              distance: text.nearby,
              image: storagePath
                ? supabase.storage
                    .from("equipment-images")
                    .getPublicUrl(storagePath).data.publicUrl
                : "/equipment/tractor-red.png",
              rentPrice:
                item.listing_mode !== "sale" ? Number(item.price) : undefined,
              rentUnit:
                (item.price_unit as MarketplaceListing["rentUnit"]) ?? "day",
              salePrice:
                item.listing_mode !== "rent"
                  ? Number(item.sale_price)
                  : undefined,
              rating: Number(item.rating) || 4.5,
              available: Boolean(item.available),
              delivery: Boolean(item.delivery_available),
            };
          },
        );
        setListings([...localMarketplaceListings(), ...mapped]);
      });
  }, [text.nearby, text.owner]);

  const filtered = useMemo(() => {
    const sessionDistrict = readSessionProfile().district.trim().toLowerCase();
    const wantedDistrict =
      location.district.trim().toLowerCase() || sessionDistrict;
    return listings.filter((item) => {
      const modeMatches =
        mode === "rent" ? Boolean(item.rentPrice) : Boolean(item.salePrice);
      const districtMatches =
        !wantedDistrict ||
        !item.district ||
        item.district.trim().toLowerCase() === wantedDistrict;
      const categoryMatches = category === "All" || item.category === category;
      const queryMatches = `${item.title} ${item.category} ${item.location}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return modeMatches && districtMatches && categoryMatches && queryMatches;
    });
  }, [category, listings, location.district, mode, query]);

  async function placeOrder() {
    if (!selected) return;
    const session = readSessionProfile();
    if (!session.authenticated || session.role !== "farmer")
      return router.push("/login");
    if (phone.replace(/\D/g, "").length !== 10)
      return toast.error(
        language === "te"
          ? "సరైన మొబైల్ నంబర్ నమోదు చేయండి"
          : "Enter a valid mobile number",
      );
    if (mode === "rent" && !date)
      return toast.error(
        language === "te" ? "అద్దె తేదీ ఎంచుకోండి" : "Choose a rental date",
      );
    const baseAmount =
      mode === "rent" ? (selected.rentPrice ?? 0) : (selected.salePrice ?? 0);
    const platformFee = Math.ceil(baseAmount * 0.1);
    setPaying(true);
    const supabase = getSupabaseBrowserClient();
    if (
      supabase &&
      !selected.id.startsWith("demo-") &&
      !selected.id.startsWith("local-")
    ) {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setPaying(false);
        return router.push("/login");
      }
      const { data: order, error } = await supabase
        .from("marketplace_orders")
        .insert({
          listing_id: selected.id,
          farmer_id: auth.user.id,
          owner_id: selected.ownerId,
          transaction_type: mode,
          unit_price: baseAmount,
          platform_fee: platformFee,
          payment_status: "pending",
          contact_phone: phone,
          rental_start: mode === "rent" ? date : null,
          rental_end: mode === "rent" ? date : null,
        })
        .select("id")
        .single();
      if (error || !order) {
        setPaying(false);
        return toast.error(error?.message ?? "Unable to create order");
      }
      const { error: paymentError } = await supabase
        .from("marketplace_orders")
        .update({
          payment_status: "paid",
          payment_reference: `${paymentMethod}_${Date.now()}`,
          paid_at: new Date().toISOString(),
          status: "paid",
        })
        .eq("id", order.id);
      if (paymentError) {
        setPaying(false);
        return toast.error(paymentError.message);
      }
    } else {
      const orders = JSON.parse(
        localStorage.getItem("mandalrent-demo-orders") ?? "[]",
      ) as unknown[];
      localStorage.setItem(
        "mandalrent-demo-orders",
        JSON.stringify([
          ...orders,
          {
            listingId: selected.id,
            ownerId: selected.ownerId,
            mode,
            phone,
            date,
            baseAmount,
            platformFee,
            totalAmount: baseAmount + platformFee,
            paymentMethod,
            paymentStatus: "paid",
            createdAt: new Date().toISOString(),
          },
        ]),
      );
    }
    setPaying(false);
    toast.success(
      `${text.paid} · ${language === "te" ? "అభ్యర్థన యజమానికి పంపబడింది" : "request sent to the owner"}`,
    );
    setSelected(null);
  }

  const baseAmount = selected
    ? mode === "rent"
      ? (selected.rentPrice ?? 0)
      : (selected.salePrice ?? 0)
    : 0;
  const fee = Math.ceil(baseAmount * 0.1);
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
              localStorage.removeItem("mandalrent-session");
              router.push("/login");
            }}
          >
            {text.logout}
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
            <small>{readSessionProfile().district || text.all}</small>
          </span>
        </div>
        <LocationPicker value={location} onChange={setLocation} />
        <Button className="location-submit" onClick={() => setQuery("")}>
          {text.search}
        </Button>
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
          {filtered.length ? (
            filtered.map((item) => (
              <article className="equipment-row" key={item.id}>
                <div className="equipment-image">
                  <Image src={item.image} alt={item.title} fill sizes="200px" />
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
                  <h3>{language === "te" ? item.titleTe : item.title}</h3>
                  <p className="owner-line">
                    <Star /> {item.owner} · {item.rating}
                  </p>
                  <p className="location-line">
                    <MapPin /> {item.location} ·{" "}
                    <strong>{item.distance}</strong>
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
                  <small>{mode === "rent" ? text.perDay : "Total"}</small>
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
              <Field>
                <FieldLabel htmlFor="rental-date">{text.date}</FieldLabel>
                <Input
                  id="rental-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="order-phone">{text.phone}</FieldLabel>
              <Input
                id="order-phone"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\D/g, ""))
                }
              />
            </Field>
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
              {text.total}
              <br />
              {text.fee}
            </span>
            <strong>
              {rupees(baseAmount)}
              <br />
              {rupees(fee)}
              <br />
              {rupees(baseAmount + fee)}
            </strong>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              {text.cancel}
            </Button>
            <Button onClick={placeOrder} disabled={paying}>
              {paying ? "…" : `${text.pay} · ${rupees(baseAmount + fee)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
