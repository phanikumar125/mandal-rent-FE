"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  MapPin,
  PackageCheck,
  Save,
  Tractor,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LocationPicker,
  type LocationValue,
} from "@/app/_components/location-picker";
import { equipmentCatalog } from "@/app/_data/catalog";
import { useLanguage } from "@/app/_components/language-toggle";

type Section = "overview" | "equipment" | "requests" | "payments";
type ListingMode = "rent" | "sale" | "both";
type Listing = Record<string, unknown>;
type Request = {
  id: string;
  listingId: string;
  listingTitle: string;
  farmerName: string;
  mode: string;
  phone: string;
  start: string;
  end: string;
  paymentStatus: string;
  rentalStatus: string;
  totalAmount: number;
  rentalAmount: number;
  deliveryCharge: number;
  platformCommission: number;
  ownerAmount: number;
  payoutStatus: string;
  createdAt: string;
};
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
    dashboard: "Dashboard",
    equipment: "My equipment",
    requests: "Farmer requests",
    payments: "Payments",
    add: "Add equipment",
    overview: "Owner dashboard",
    details: "Equipment details",
    category: "Equipment type",
    title: "Equipment name",
    brand: "Brand",
    model: "Model",
    condition: "Condition",
    description: "Description",
    photos: "Equipment photos",
    location: "Equipment location",
    pricing: "Rental or sale pricing",
    rent: "Rental price",
    sale: "Sale price",
    delivery: "I can deliver to the farmer",
    operator: "Operator available",
    deliveryCharge: "Delivery charge",
    phone: "Contact number",
    publish: "Publish equipment",
    saveDraft: "Save draft",
    published: "Published equipment",
    requestsEmpty: "No farmer requests yet",
    paymentsEmpty: "No paid orders yet",
    paid: "Paid",
    unpublish: "Unpublish",
    success: "Equipment published successfully",
    error: "Unable to publish equipment",
    logout: "Log out",
    language: "తెలుగు",
  },
  te: {
    dashboard: "డాష్‌బోర్డ్",
    equipment: "నా పరికరాలు",
    requests: "రైతుల అభ్యర్థనలు",
    payments: "చెల్లింపులు",
    add: "పరికరం జోడించండి",
    overview: "యజమాని డాష్‌బోర్డ్",
    details: "పరికరం వివరాలు",
    category: "పరికరం రకం",
    title: "పరికరం పేరు",
    brand: "బ్రాండ్",
    model: "మోడల్",
    condition: "స్థితి",
    description: "వివరణ",
    photos: "పరికరం ఫోటోలు",
    location: "పరికరం ఉన్న ప్రదేశం",
    pricing: "అద్దె లేదా అమ్మకపు ధర",
    rent: "అద్దె ధర",
    sale: "అమ్మకపు ధర",
    delivery: "రైతుకు పరికరం అందించగలను",
    operator: "ఆపరేటర్ అందుబాటులో ఉన్నారు",
    deliveryCharge: "రవాణా ఛార్జీ",
    phone: "సంప్రదింపు నంబర్",
    publish: "పరికరం ప్రచురించండి",
    saveDraft: "డ్రాఫ్ట్ సేవ్ చేయండి",
    published: "ప్రచురించిన పరికరాలు",
    requestsEmpty: "ఇంకా రైతుల అభ్యర్థనలు లేవు",
    paymentsEmpty: "ఇంకా చెల్లింపులు లేవు",
    paid: "చెల్లింపు పూర్తయింది",
    unpublish: "ప్రచురణ నిలిపివేయండి",
    success: "పరికరం విజయవంతంగా ప్రచురించబడింది",
    error: "పరికరాన్ని ప్రచురించలేకపోయాము",
    logout: "లాగ్ అవుట్",
    language: "English",
  },
} as const;

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function OwnerPage() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const text = copy[language];
  const [section, setSection] = useState<Section>("overview");
  const [mode, setMode] = useState<ListingMode>("rent");
  const [location, setLocation] = useState<LocationValue>(emptyLocation);
  const [category, setCategory] = useState("Tractor");
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [modelName, setModelName] = useState("");
  const [condition, setCondition] = useState("good");
  const [description, setDescription] = useState("");
  const [rentPrice, setRentPrice] = useState("");
  const [rentUnit, setRentUnit] = useState("day");
  const [salePrice, setSalePrice] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("0");
  const [delivery, setDelivery] = useState(true);
  const [operatorAvailable, setOperatorAvailable] = useState(false);
  const [phone, setPhone] = useState("");
  const [ownerName, setOwnerName] = useState("Equipment owner");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [working, setWorking] = useState(false);

  async function loadOwnerData() {
    const [listingsResponse, ordersResponse] = await Promise.all([
      fetch("/api/listings?scope=owner", { cache: "no-store" }),
      fetch("/api/orders", { cache: "no-store" }),
    ]);
    if (listingsResponse.ok)
      setListings(
        ((await listingsResponse.json()) as { listings?: Listing[] })
          .listings ?? [],
      );
    if (ordersResponse.ok) {
      const orders =
        (
          (await ordersResponse.json()) as {
            orders?: Array<Record<string, unknown>>;
          }
        ).orders ?? [];
      setRequests(
        orders.map((order) => {
          const payment = (order.payment ?? {}) as Record<string, unknown>;
          return {
            id: String(order.id),
            listingId: String(order.listing_id),
            listingTitle: String(order.listing_title ?? "Equipment"),
            farmerName: String(order.farmer_name ?? "Farmer"),
            mode: String(order.transaction_type),
            phone: String(order.contact_phone ?? ""),
            start: String(order.rental_start ?? ""),
            end: String(order.rental_end ?? ""),
            paymentStatus: String(order.payment_status),
            rentalStatus: String(order.rental_status),
            totalAmount: Number(order.total_amount ?? 0),
            rentalAmount: Number(payment.rental_amount ?? order.rental_amount ?? 0),
            deliveryCharge: Number(payment.delivery_charge ?? order.delivery_charge ?? 0),
            platformCommission: Number(payment.platform_commission ?? 0),
            ownerAmount: Number(payment.owner_amount ?? 0),
            payoutStatus: String(payment.payout_status ?? "pending"),
            createdAt: String(order.created_at),
          };
        }),
      );
    }
  }

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (!response.ok) return router.replace("/login");
      const data = (await response.json()) as {
        profile?: {
          full_name?: string;
          phone?: string;
          role?: string;
          district_id?: string;
          mandal_id?: string;
          village_id?: string;
        };
      };
      if (!data.profile || data.profile.role !== "owner")
        return router.replace("/login");
      if (active) {
        setPhone(data.profile.phone ?? "");
        setOwnerName(data.profile.full_name || "Equipment owner");
      }
      await loadOwnerData();
    }
    void load();
    return () => {
      active = false;
    };
  }, [router]);

  const completed = useMemo(
    () =>
      [
        Boolean(title && category),
        files.length > 0,
        Boolean(location.villageCode),
        Boolean((mode === "rent" ? rentPrice : salePrice) && phone),
      ].filter(Boolean).length,
    [
      category,
      files.length,
      location.villageCode,
      mode,
      phone,
      rentPrice,
      salePrice,
      title,
    ],
  );
  const paidTotal = requests
    .filter((request) => request.paymentStatus === "paid")
    .reduce((sum, request) => sum + request.ownerAmount, 0);

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const next = Array.from(event.target.files ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 5);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles(next);
    setPreviews(next.map((file) => URL.createObjectURL(file)));
  }

  function saveDraft() {
    localStorage.setItem(
      "mandalrent-owner-draft",
      JSON.stringify({
        category,
        title,
        brand,
        modelName,
        condition,
        description,
        rentPrice,
        rentUnit,
        salePrice,
        deliveryCharge,
        mode,
        delivery,
        operatorAvailable,
        phone,
        location,
      }),
    );
    toast.success(text.saveDraft);
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!title || !location.villageCode || !phone)
      return toast.error("Complete the name, location, and phone fields");
    if ((mode === "rent" || mode === "both") && !rentPrice)
      return toast.error(text.rent);
    if ((mode === "sale" || mode === "both") && !salePrice)
      return toast.error(text.sale);
    setWorking(true);
    const form = new FormData();
    for (const [key, value] of Object.entries({
      title,
      category,
      description,
      brand,
      modelName,
      condition,
      mode,
      rentPrice,
      rentUnit,
      salePrice,
      deliveryCharge,
      delivery: String(delivery),
      operatorAvailable: String(operatorAvailable),
      districtCode: location.districtCode,
      mandalCode: location.mandalCode,
      villageCode: location.villageCode,
      phone,
    }))
      form.set(key, value);
    files.forEach((file) => form.append("images", file));
    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        body: form,
      });
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) throw new Error(body.message ?? text.error);
      await loadOwnerData();
      setSection("equipment");
      setTitle("");
      setDescription("");
      setFiles([]);
      setPreviews([]);
      toast.success(text.success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.error);
    } finally {
      setWorking(false);
    }
  }

  async function unpublish(id: string) {
    const response = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paused", available: false }),
    });
    if (!response.ok) return toast.error(text.error);
    await loadOwnerData();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <main className="owner-shell">
      <aside className="owner-sidebar">
        <Link href="/" className="site-brand owner-brand">
          <span className="brand-mark">
            <Tractor />
          </span>
          <span>
            Mandal<span>Rent</span>
          </span>
        </Link>
        <div className="owner-profile">
          <span>{ownerName.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{ownerName}</strong>
            <small>Equipment owner</small>
          </div>
        </div>
        <nav>
          <button
            className={section === "overview" ? "active" : ""}
            onClick={() => setSection("overview")}
          >
            <LayoutDashboard /> {text.dashboard}
          </button>
          <button
            className={section === "equipment" ? "active" : ""}
            onClick={() => setSection("equipment")}
          >
            <Tractor /> {text.equipment}
            <span>{listings.length}</span>
          </button>
          <button
            className={section === "requests" ? "active" : ""}
            onClick={() => setSection("requests")}
          >
            <ClipboardList /> {text.requests}
            <span>{requests.length}</span>
          </button>
          <button
            className={section === "payments" ? "active" : ""}
            onClick={() => setSection("payments")}
          >
            <WalletCards /> {text.payments}
          </button>
        </nav>
        <button className="language-button" onClick={toggleLanguage}>
          <IndianRupee /> {text.language}
        </button>
        <button className="logout" onClick={() => void logout()}>
          <LogOut /> {text.logout}
        </button>
      </aside>
      <section className="owner-content">
        <header className="owner-header">
          <div>
            <p>MandalRent</p>
            <h1>
              {section === "overview"
                ? text.overview
                : section === "equipment"
                  ? text.equipment
                  : section === "requests"
                    ? text.requests
                    : text.payments}
            </h1>
          </div>
          <button aria-label="Notifications">
            <Bell />
          </button>
        </header>
        {section === "overview" && (
          <section className="owner-overview">
            <div className="owner-overview-card">
              <LayoutDashboard />
              <span>{text.published}</span>
              <strong>
                {listings.filter((listing) => listing.status === "live").length}
              </strong>
              <Button onClick={() => setSection("equipment")}>
                {text.equipment}
              </Button>
            </div>
            <div className="owner-overview-card">
              <ClipboardList />
              <span>{text.requests}</span>
              <strong>{requests.length}</strong>
              <Button onClick={() => setSection("requests")}>
                {text.requests}
              </Button>
            </div>
            <div className="owner-overview-card">
              <WalletCards />
              <span>{text.payments}</span>
              <strong>{rupees(paidTotal)}</strong>
              <Button onClick={() => setSection("payments")}>
                {text.payments}
              </Button>
            </div>
          </section>
        )}
        {section === "equipment" && (
          <>
            <section className="form-section owner-listings">
              <div className="form-section-title">
                <span>
                  <PackageCheck />
                </span>
                <div>
                  <h2>{text.published}</h2>
                  <p>Only your listings are shown here.</p>
                </div>
              </div>
              {listings.length ? (
                listings.map((listing) => (
                  <div className="request-row" key={String(listing.id)}>
                    <img
                      src={
                        listing.image
                          ? String(listing.image)
                          : "/equipment/tractor-red.png"
                      }
                      alt={String(listing.title)}
                    />
                    <strong>{String(listing.title)}</strong>
                    <small>
                      {String(listing.category)} ·{" "}
                      {String(listing.district ?? "")} ·{" "}
                      {String(listing.status)}
                    </small>
                    {listing.status === "live" && (
                      <Button
                        size="sm"
                        onClick={() => void unpublish(String(listing.id))}
                      >
                        {text.unpublish}
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p>No equipment published yet.</p>
              )}
            </section>
            <form className="owner-workspace" onSubmit={publish}>
              <div className="owner-form-column">
                <section className="form-section">
                  <div className="form-section-title">
                    <span>1</span>
                    <div>
                      <h2>{text.details}</h2>
                      <p>Give farmers clear information.</p>
                    </div>
                  </div>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="category">
                        {text.category}
                      </FieldLabel>
                      <select
                        id="category"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                      >
                        {equipmentCatalog.map((item) => (
                          <option key={item.name} value={item.name}>
                            {language === "te" ? item.te : item.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="title">{text.title}</FieldLabel>
                      <Input
                        id="title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                      />
                    </Field>
                    <div className="two-fields">
                      <Field>
                        <FieldLabel htmlFor="brand">{text.brand}</FieldLabel>
                        <Input
                          id="brand"
                          value={brand}
                          onChange={(event) => setBrand(event.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="model">{text.model}</FieldLabel>
                        <Input
                          id="model"
                          value={modelName}
                          onChange={(event) => setModelName(event.target.value)}
                        />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="condition">
                        {text.condition}
                      </FieldLabel>
                      <select
                        id="condition"
                        value={condition}
                        onChange={(event) => setCondition(event.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="needs_service">Needs service</option>
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="description">
                        {text.description}
                      </FieldLabel>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                      />
                    </Field>
                  </FieldGroup>
                </section>
                <section className="form-section">
                  <div className="form-section-title">
                    <span>2</span>
                    <div>
                      <h2>{text.photos}</h2>
                    </div>
                  </div>
                  <label className="photo-upload">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={chooseFiles}
                    />
                    <Upload />
                    <strong>{text.photos}</strong>
                    <span>JPG / PNG · up to 5</span>
                  </label>
                  {previews.length > 0 && (
                    <div className="upload-previews">
                      {previews.map((url, index) => (
                        <div key={url}>
                          <img src={url} alt={`Equipment ${index + 1}`} />
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(url);
                              setFiles(files.filter((_, i) => i !== index));
                              setPreviews(
                                previews.filter((_, i) => i !== index),
                              );
                            }}
                          >
                            <X />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <section className="form-section">
                  <div className="form-section-title">
                    <span>3</span>
                    <div>
                      <h2>{text.location}</h2>
                    </div>
                  </div>
                  <LocationPicker
                    value={location}
                    onChange={setLocation}
                    compact
                  />
                </section>
                <section className="form-section">
                  <div className="form-section-title">
                    <span>4</span>
                    <div>
                      <h2>{text.pricing}</h2>
                    </div>
                  </div>
                  <div className="price-fields">
                    {(mode === "rent" || mode === "both") && (
                      <Field>
                        <FieldLabel htmlFor="rent-price">
                          {text.rent}
                        </FieldLabel>
                        <div className="money-input">
                          <IndianRupee />
                          <Input
                            id="rent-price"
                            type="number"
                            min="1"
                            value={rentPrice}
                            onChange={(event) =>
                              setRentPrice(event.target.value)
                            }
                          />
                          <select
                            value={rentUnit}
                            onChange={(event) =>
                              setRentUnit(event.target.value)
                            }
                          >
                            <option value="day">day</option>
                            <option value="acre">acre</option>
                            <option value="hour">hour</option>
                          </select>
                        </div>
                      </Field>
                    )}
                    {(mode === "sale" || mode === "both") && (
                      <Field>
                        <FieldLabel htmlFor="sale-price">
                          {text.sale}
                        </FieldLabel>
                        <div className="money-input">
                          <IndianRupee />
                          <Input
                            id="sale-price"
                            type="number"
                            min="1"
                            value={salePrice}
                            onChange={(event) =>
                              setSalePrice(event.target.value)
                            }
                          />
                        </div>
                      </Field>
                    )}
                    <Field>
                      <FieldLabel htmlFor="delivery-charge">
                        {text.deliveryCharge}
                      </FieldLabel>
                      <Input
                        id="delivery-charge"
                        type="number"
                        min="0"
                        disabled={!delivery}
                        value={deliveryCharge}
                        onChange={(event) =>
                          setDeliveryCharge(event.target.value)
                        }
                      />
                    </Field>
                  </div>
                  <div className="owner-mode">
                    <Button
                      type="button"
                      variant={mode === "rent" ? "default" : "outline"}
                      onClick={() => setMode("rent")}
                    >
                      Rent
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "sale" ? "default" : "outline"}
                      onClick={() => setMode("sale")}
                    >
                      Sale
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "both" ? "default" : "outline"}
                      onClick={() => setMode("both")}
                    >
                      Both
                    </Button>
                  </div>
                  <Field orientation="horizontal" className="delivery-check">
                    <Checkbox
                      id="delivery"
                      checked={delivery}
                      onCheckedChange={(checked) => {
                        const enabled = Boolean(checked);
                        setDelivery(enabled);
                        if (!enabled) setDeliveryCharge("0");
                      }}
                    />
                    <FieldLabel htmlFor="delivery">{text.delivery}</FieldLabel>
                  </Field>
                  <Field orientation="horizontal" className="delivery-check">
                    <Checkbox
                      id="operator"
                      checked={operatorAvailable}
                      onCheckedChange={(checked) =>
                        setOperatorAvailable(Boolean(checked))
                      }
                    />
                    <FieldLabel htmlFor="operator">{text.operator}</FieldLabel>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="owner-phone">{text.phone}</FieldLabel>
                    <Input
                      id="owner-phone"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value.replace(/\D/g, ""))
                      }
                    />
                  </Field>
                </section>
              </div>
              <aside className="listing-preview-column">
                <div className="preview-sticky">
                  <div className="preview-title">
                    <span>{completed}/4 complete</span>
                    <PackageCheck />
                  </div>
                  <div className="preview-card">
                    <div className="preview-image">
                      {previews[0] ? (
                        <img src={previews[0]} alt="Preview" />
                      ) : (
                        <img src="/equipment/tractor-red.png" alt="Tractor" />
                      )}
                      <span>{category}</span>
                    </div>
                    <div className="preview-body">
                      <h3>{title || "Your equipment"}</h3>
                      <p>
                        {brand} {modelName}
                      </p>
                      <div className="preview-location">
                        <MapPin /> {location.village || "Village"},{" "}
                        {location.district || "District"}
                      </div>
                      <div className="preview-owner">
                        <span>{ownerName.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <strong>{ownerName}</strong>
                          <small>
                            <CheckCircle2 /> Verified owner
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="publish-box">
                    <BorderBeam
                      colorFrom="#f4b400"
                      colorTo="#0d7a3a"
                      duration={8}
                    />
                    <Button type="submit" size="lg" disabled={working}>
                      {working ? "Publishing…" : text.publish}
                    </Button>
                    <button type="button" onClick={saveDraft}>
                      <Save /> {text.saveDraft}
                    </button>
                  </div>
                </div>
              </aside>
            </form>
          </>
        )}
        {section === "requests" && (
          <section className="owner-empty-state">
            <ClipboardList />
            <h2>
              {requests.length
                ? `${requests.length} ${text.requests}`
                : text.requestsEmpty}
            </h2>
            {requests.map((request) => (
              <div className="request-row" key={request.id}>
                <strong>
                  {request.farmerName} · {request.listingTitle}
                </strong>
                <small>
                  {request.mode} · {request.phone} · {request.start}
                  {request.end && request.end !== request.start
                    ? ` → ${request.end}`
                    : ""}{" "}
                  · {request.rentalStatus} · {request.paymentStatus}
                </small>
                <span>{rupees(request.totalAmount)}</span>
              </div>
            ))}
          </section>
        )}
        {section === "payments" && (
          <section className="owner-empty-state">
            <WalletCards />
            <h2>{paidTotal ? rupees(paidTotal) : text.paymentsEmpty}</h2>
            {requests
              .filter((request) => request.paymentStatus === "paid")
              .map((request) => (
                <div className="request-row" key={request.id}>
                  <span>{text.paid}</span>
                  <strong>{rupees(request.ownerAmount)}</strong>
                  <small>
                    Rental {rupees(request.rentalAmount)} · Commission -{rupees(request.platformCommission)} · Delivery {rupees(request.deliveryCharge)} · Payout {request.payoutStatus}
                  </small>
                </div>
              ))}
          </section>
        )}
      </section>
    </main>
  );
}
