"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, ClipboardList, IndianRupee, LayoutDashboard, LogOut, MapPin, PackageCheck, Save, Tractor, Upload, WalletCards, X } from "lucide-react";
import { toast } from "sonner";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker, type LocationValue } from "@/app/_components/location-picker";
import { equipmentCatalog } from "@/app/_data/catalog";
import { clearSessionProfile, readSessionProfile } from "@/app/_data/session";
import { useLanguage } from "@/app/_components/language-toggle";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

type Section = "overview" | "equipment" | "requests" | "payments";
type ListingMode = "rent" | "sale" | "both";
type Request = { id?: string; mode: string; phone: string; date: string; createdAt: string; paymentStatus?: string; totalAmount?: number; platformFee?: number; ownerId?: string };
const emptyLocation: LocationValue = { districtCode: "", district: "", mandalCode: "", mandal: "", villageCode: "", village: "" };

const copy = {
  en: { dashboard: "Dashboard", equipment: "My equipment", requests: "Farmer requests", payments: "Payments", add: "Add equipment", overview: "Owner dashboard", overviewBody: "Manage your machinery, requests, and earnings in one place.", published: "Published equipment", requestCount: "Requests received", earnings: "Paid order value", addAction: "Add equipment", openRequests: "Open requests", viewPayments: "View payments", details: "Equipment details", detailsBody: "Give farmers clear information.", category: "Equipment type", title: "Equipment name", brand: "Brand", model: "Model", condition: "Condition", description: "Description", photos: "Equipment photos", location: "Equipment location", pricing: "Rental or sale pricing", rent: "Rental price", sale: "Sale price", delivery: "I can deliver to the farmer", phone: "Contact number", publish: "Publish equipment", saveDraft: "Save draft", requestsEmpty: "No farmer requests yet", requestsBody: "Rental and purchase requests will appear here.", paymentsEmpty: "No paid orders yet", paymentsBody: "Successful customer payments and platform fees will appear here.", paid: "Paid", call: "Call farmer", logout: "Log out", language: "తెలుగు", success: "Equipment is now visible to nearby farmers" },
  te: { dashboard: "డాష్‌బోర్డ్", equipment: "నా పరికరాలు", requests: "రైతుల అభ్యర్థనలు", payments: "చెల్లింపులు", add: "పరికరం జోడించండి", overview: "యజమాని డాష్‌బోర్డ్", overviewBody: "మీ పరికరాలు, అభ్యర్థనలు, ఆదాయాన్ని ఒకే చోట నిర్వహించండి.", published: "ప్రచురించిన పరికరాలు", requestCount: "వచ్చిన అభ్యర్థనలు", earnings: "చెల్లించిన ఆర్డర్ విలువ", addAction: "పరికరం జోడించండి", openRequests: "అభ్యర్థనలు తెరవండి", viewPayments: "చెల్లింపులు చూడండి", details: "పరికరం వివరాలు", detailsBody: "రైతులకు స్పష్టమైన సమాచారం ఇవ్వండి.", category: "పరికరం రకం", title: "పరికరం పేరు", brand: "బ్రాండ్", model: "మోడల్", condition: "స్థితి", description: "వివరణ", photos: "పరికరం ఫోటోలు", location: "పరికరం ఉన్న ప్రదేశం", pricing: "అద్దె లేదా అమ్మకపు ధర", rent: "అద్దె ధర", sale: "అమ్మకపు ధర", delivery: "రైతుకు పరికరం అందించగలను", phone: "సంప్రదింపు నంబర్", publish: "పరికరం ప్రచురించండి", saveDraft: "డ్రాఫ్ట్ సేవ్ చేయండి", requestsEmpty: "ఇంకా రైతుల అభ్యర్థనలు లేవు", requestsBody: "అద్దె, కొనుగోలు అభ్యర్థనలు ఇక్కడ కనిపిస్తాయి.", paymentsEmpty: "ఇంకా చెల్లింపులు లేవు", paymentsBody: "కస్టమర్ చెల్లింపులు, ప్లాట్‌ఫారమ్ ఫీజులు ఇక్కడ కనిపిస్తాయి.", paid: "చెల్లింపు పూర్తయింది", call: "రైతుకు కాల్ చేయండి", logout: "లాగ్ అవుట్", language: "English", success: "మీ పరికరం దగ్గరలోని రైతులకు కనిపిస్తోంది" },
} as const;

function rupees(value: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }

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
  const [delivery, setDelivery] = useState(true);
  const [phone, setPhone] = useState("");
  const [ownerName, setOwnerName] = useState("Equipment owner");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const profile = readSessionProfile();
    if (!profile.authenticated || profile.role !== "owner") { router.replace("/login"); return; }
    queueMicrotask(() => { setPhone(profile.phone); setOwnerName(profile.fullName || "Equipment owner"); });
    const localOrders = JSON.parse(localStorage.getItem("mandalrent-demo-orders") ?? "[]") as Request[];
    queueMicrotask(() => setRequests(localOrders.filter((order) => !order.ownerId || order.ownerId === profile.phone || order.ownerId.startsWith("demo-owner"))));
    const supabase = getSupabaseBrowserClient();
    if (supabase) supabase.auth.getUser().then(async ({ data: auth }) => {
      if (!auth.user) return;
      const { data } = await supabase.from("marketplace_orders").select("id, transaction_type, contact_phone, rental_start, payment_status, total_amount, platform_fee, created_at").eq("owner_id", auth.user.id).order("created_at", { ascending: false });
      if (data) setRequests(data.map((order) => ({ id: String(order.id), mode: String(order.transaction_type), phone: String(order.contact_phone), date: String(order.rental_start ?? ""), paymentStatus: String(order.payment_status ?? "pending"), totalAmount: Number(order.total_amount ?? 0), platformFee: Number(order.platform_fee ?? 0), createdAt: String(order.created_at) })));
    });
  }, [router]);

  const completed = useMemo(() => [Boolean(title && category), files.length > 0, Boolean(location.villageCode), Boolean((mode === "rent" ? rentPrice : salePrice) && phone)].filter(Boolean).length, [category, files.length, location.villageCode, mode, phone, rentPrice, salePrice, title]);
  const paidTotal = requests.filter((request) => request.paymentStatus === "paid").reduce((sum, request) => sum + (request.totalAmount ?? 0), 0);

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) { const next = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/")).slice(0, 5); previews.forEach((url) => URL.revokeObjectURL(url)); setFiles(next); setPreviews(next.map((file) => URL.createObjectURL(file))); }
  function saveDraft() { localStorage.setItem("mandalrent-owner-draft", JSON.stringify({ category, title, brand, modelName, condition, description, rentPrice, rentUnit, salePrice, mode, delivery, phone, location })); toast.success(language === "te" ? "డ్రాఫ్ట్ సేవ్ అయ్యింది" : "Draft saved"); }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!title || !location.villageCode || !phone) return toast.error(language === "te" ? "పేరు, ప్రదేశం, ఫోన్ పూర్తి చేయండి" : "Complete the name, location, and phone fields");
    if ((mode === "rent" || mode === "both") && !rentPrice) return toast.error(text.rent);
    if ((mode === "sale" || mode === "both") && !salePrice) return toast.error(text.sale);
    setWorking(true);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setWorking(false); return router.push("/login"); }
      const [{ data: categoryRow }, { data: districtRow }, { data: mandalRow }, { data: villageRow }] = await Promise.all([supabase.from("equipment_categories").select("id").eq("name", category).single(), supabase.from("districts").select("id").eq("lgd_code", Number(location.districtCode)).single(), supabase.from("mandals").select("id").eq("lgd_code", Number(location.mandalCode)).single(), supabase.from("villages").select("id").eq("lgd_code", Number(location.villageCode)).single()]);
      if (!categoryRow || !districtRow || !mandalRow || !villageRow) { setWorking(false); return toast.error("Location data is not available"); }
      const { data: listing, error } = await supabase.from("listings").insert({ owner_id: auth.user.id, category_id: categoryRow.id, title, description, brand, model_name: modelName, condition, district_id: districtRow.id, mandal_id: mandalRow.id, village_id: villageRow.id, listing_mode: mode, price: mode === "sale" ? 0 : Number(rentPrice), price_unit: rentUnit, sale_price: mode === "rent" ? null : Number(salePrice), delivery_available: delivery, phone, whatsapp_number: phone, status: "live" }).select("id").single();
      if (error || !listing) { setWorking(false); return toast.error(error?.message ?? "Could not publish equipment"); }
      for (const [index, file] of files.entries()) { const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-"); const path = `${auth.user.id}/${listing.id}/${crypto.randomUUID()}-${safeName}`; const { error: uploadError } = await supabase.storage.from("equipment-images").upload(path, file, { cacheControl: "3600", upsert: false }); if (!uploadError) await supabase.from("listing_images").insert({ listing_id: listing.id, storage_path: path, is_primary: index === 0, sort_order: index }); }
    } else {
      const current = JSON.parse(localStorage.getItem("mandalrent-demo-listings") ?? "[]");
      localStorage.setItem("mandalrent-demo-listings", JSON.stringify([...current, { title, category, location, mode, rentPrice, salePrice, phone, ownerId: readSessionProfile().phone || "demo-owner-local", createdAt: new Date().toISOString() }]));
    }
    setWorking(false); setSection("equipment"); setTitle(""); setDescription(""); setFiles([]); setPreviews([]); toast.success(text.success);
  }

  function logout() { clearSessionProfile(); void getSupabaseBrowserClient()?.auth.signOut(); router.push("/login"); }
  return <main className="owner-shell"><aside className="owner-sidebar"><Link href="/" className="site-brand owner-brand"><span className="brand-mark"><Tractor /></span><span>Mandal<span>Rent</span></span></Link><div className="owner-profile"><span>{ownerName.slice(0, 2).toUpperCase()}</span><div><strong>{ownerName}</strong><small>Equipment owner</small></div></div><nav><button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><LayoutDashboard /> {text.dashboard}</button><button className={section === "equipment" ? "active" : ""} onClick={() => setSection("equipment")}><Tractor /> {text.equipment}</button><button className={section === "requests" ? "active" : ""} onClick={() => setSection("requests")}><ClipboardList /> {text.requests}<span>{requests.length}</span></button><button className={section === "payments" ? "active" : ""} onClick={() => setSection("payments")}><WalletCards /> {text.payments}</button></nav><button className="language-button" onClick={toggleLanguage}><IndianRupee /> {text.language}</button><button className="logout" onClick={logout}><LogOut /> {text.logout}</button></aside><section className="owner-content"><header className="owner-header"><div><p>MandalRent</p><h1>{section === "overview" ? text.overview : section === "equipment" ? text.add : section === "requests" ? text.requests : text.payments}</h1></div><button aria-label="Notifications"><Bell /></button></header>
    {section === "overview" && <section className="owner-overview"><div className="owner-overview-card"><LayoutDashboard /><span>{text.published}</span><strong>Manage your machinery listings</strong><Button onClick={() => setSection("equipment")}>{text.addAction}</Button></div><div className="owner-overview-card"><ClipboardList /><span>{text.requestCount}</span><strong>{requests.length}</strong><Button onClick={() => setSection("requests")}>{text.openRequests}</Button></div><div className="owner-overview-card"><WalletCards /><span>{text.earnings}</span><strong>{rupees(paidTotal)}</strong><Button onClick={() => setSection("payments")}>{text.viewPayments}</Button></div></section>}
    {section === "equipment" && <form className="owner-workspace" onSubmit={publish}><div className="owner-form-column"><section className="form-section"><div className="form-section-title"><span>1</span><div><h2>{text.details}</h2><p>{text.detailsBody}</p></div></div><FieldGroup><Field><FieldLabel htmlFor="category">{text.category}</FieldLabel><select id="category" value={category} onChange={(event) => setCategory(event.target.value)}>{equipmentCatalog.map((item) => <option key={item.name} value={item.name}>{language === "te" ? item.te : item.name}</option>)}</select></Field><Field><FieldLabel htmlFor="title">{text.title}</FieldLabel><Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Mahindra 575 DI Tractor" /></Field><div className="two-fields"><Field><FieldLabel htmlFor="brand">{text.brand}</FieldLabel><Input id="brand" value={brand} onChange={(event) => setBrand(event.target.value)} /></Field><Field><FieldLabel htmlFor="model">{text.model}</FieldLabel><Input id="model" value={modelName} onChange={(event) => setModelName(event.target.value)} /></Field></div><Field><FieldLabel htmlFor="condition">{text.condition}</FieldLabel><select id="condition" value={condition} onChange={(event) => setCondition(event.target.value)}><option value="new">New</option><option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option></select></Field><Field><FieldLabel htmlFor="description">{text.description}</FieldLabel><Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} /></Field></FieldGroup></section><section className="form-section"><div className="form-section-title"><span>2</span><div><h2>{text.photos}</h2></div></div><label className="photo-upload"><input type="file" accept="image/*" multiple onChange={chooseFiles} /><Upload /><strong>{text.photos}</strong><span>JPG / PNG · up to 5</span></label>{previews.length > 0 && <div className="upload-previews">{previews.map((url, index) => <div key={url}><Image src={url} alt={`Equipment ${index + 1}`} fill sizes="120px" unoptimized /><button type="button" onClick={() => { URL.revokeObjectURL(url); setFiles(files.filter((_, i) => i !== index)); setPreviews(previews.filter((_, i) => i !== index)); }}><X /></button></div>)}</div>}</section><section className="form-section"><div className="form-section-title"><span>3</span><div><h2>{text.location}</h2></div></div><LocationPicker value={location} onChange={setLocation} compact /></section><section className="form-section"><div className="form-section-title"><span>4</span><div><h2>{text.pricing}</h2></div></div><div className="price-fields">{(mode === "rent" || mode === "both") && <Field><FieldLabel htmlFor="rent-price">{text.rent}</FieldLabel><div className="money-input"><IndianRupee /><Input id="rent-price" type="number" min="1" value={rentPrice} onChange={(event) => setRentPrice(event.target.value)} /><select value={rentUnit} onChange={(event) => setRentUnit(event.target.value)}><option value="day">day</option><option value="acre">acre</option><option value="hour">hour</option></select></div></Field>}{(mode === "sale" || mode === "both") && <Field><FieldLabel htmlFor="sale-price">{text.sale}</FieldLabel><div className="money-input"><IndianRupee /><Input id="sale-price" type="number" min="1" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} /></div></Field>}</div><div className="owner-mode"><Button type="button" variant={mode === "rent" ? "default" : "outline"} onClick={() => setMode("rent")}>Rent</Button><Button type="button" variant={mode === "sale" ? "default" : "outline"} onClick={() => setMode("sale")}>Sale</Button><Button type="button" variant={mode === "both" ? "default" : "outline"} onClick={() => setMode("both")}>Both</Button></div><Field orientation="horizontal" className="delivery-check"><Checkbox id="delivery" checked={delivery} onCheckedChange={(checked) => setDelivery(Boolean(checked))} /><FieldLabel htmlFor="delivery">{text.delivery}</FieldLabel></Field><Field><FieldLabel htmlFor="owner-phone">{text.phone}</FieldLabel><Input id="owner-phone" inputMode="numeric" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))} /></Field></section></div><aside className="listing-preview-column"><div className="preview-sticky"><div className="preview-title"><span>{completed}/4 complete</span><PackageCheck /></div><div className="preview-card"><div className="preview-image">{previews[0] ? <Image src={previews[0]} alt="Preview" fill sizes="350px" unoptimized /> : <Image src="/equipment/tractor-red.png" alt="Tractor" fill sizes="350px" />}<span>{category}</span></div><div className="preview-body"><h3>{title || "Your equipment"}</h3><p>{brand} {modelName}</p><div className="preview-location"><MapPin /> {location.village || "Village"}, {location.district || "District"}</div><div className="preview-owner"><span>{ownerName.slice(0, 2).toUpperCase()}</span><div><strong>{ownerName}</strong><small><CheckCircle2 /> Verified owner</small></div></div></div></div><div className="publish-box"><BorderBeam colorFrom="#f4b400" colorTo="#0d7a3a" duration={8} /><Button type="submit" size="lg" disabled={working}>{working ? "Publishing…" : text.publish}</Button><button type="button" onClick={saveDraft}><Save /> {text.saveDraft}</button></div></div></aside></form>}
    {section === "requests" && <section className="owner-empty-state"><ClipboardList /><h2>{requests.length ? `${requests.length} ${text.requests}` : text.requestsEmpty}</h2><p>{text.requestsBody}</p>{requests.map((request, index) => <div className="request-row" key={`${request.createdAt}-${index}`}><span>{request.mode === "rent" ? "Rent" : "Purchase"}</span><strong>{request.phone}</strong><small>{request.date || "Date to confirm"}</small><Button size="sm" onClick={() => { window.location.href = `tel:${request.phone}`; }}>{text.call}</Button></div>)}</section>}
    {section === "payments" && <section className="owner-empty-state"><WalletCards /><h2>{requests.some((request) => request.paymentStatus === "paid") ? rupees(paidTotal) : text.paymentsEmpty}</h2><p>{text.paymentsBody}</p>{requests.filter((request) => request.paymentStatus === "paid").map((request, index) => <div className="request-row" key={`${request.createdAt}-${index}`}><span>{text.paid}</span><strong>{rupees(request.totalAmount ?? 0)}</strong><small>Platform fee {rupees(request.platformFee ?? 0)}</small></div>)}</section>}
  </section></main>;
}
