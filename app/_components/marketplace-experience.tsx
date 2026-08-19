"use client";

import Image from "next/image";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cog,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  SlidersHorizontal,
  Tractor,
  Wheat,
} from "lucide-react";
import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import {
  marketplaceCategories,
  marketplaceListings,
  productCopy,
} from "../_data/product";
import { useLanguage } from "./language-toggle";
import { MobileBottomNav, ProductHeader } from "./product-shell";

const FAVORITES_KEY = "mandalrent-favorites:v1";
const FAVORITES_EVENT = "mandalrent-favorites-change";
const EVENT_KEY = "mandalrent-events:v1";

function subscribeToFavorites(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(FAVORITES_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(FAVORITES_EVENT, onStoreChange);
  };
}

function getFavoritesSnapshot() {
  return window.localStorage.getItem(FAVORITES_KEY) ?? "[]";
}

const categoryIcons = {
  tractor: Tractor,
  rotavator: Cog,
  harvester: Wheat,
} as const;

function recordEvent(name: string, listingId?: number) {
  const raw = window.localStorage.getItem(EVENT_KEY);
  const existing = raw ? (JSON.parse(raw) as unknown[]) : [];
  window.localStorage.setItem(
    EVENT_KEY,
    JSON.stringify([
      ...existing.slice(-99),
      { name, listingId, at: new Date().toISOString() },
    ]),
  );
}

export default function MarketplaceExperience({ embedded = false }: { embedded?: boolean }) {
  const { language } = useLanguage();
  const copy = productCopy[language];
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [mandal, setMandal] = useState("all");
  const [village, setVillage] = useState("all");
  const [category, setCategory] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(1);
  const favoritesJson = useSyncExternalStore(
    subscribeToFavorites,
    getFavoritesSnapshot,
    () => "[]",
  );
  const favorites = useMemo(() => JSON.parse(favoritesJson) as number[], [favoritesJson]);

  const districts = useMemo(
    () => Array.from(new Set(marketplaceListings.map((item) => item.district))),
    [],
  );
  const mandals = useMemo(
    () =>
      Array.from(
        new Set(
          marketplaceListings
            .filter((item) => district === "all" || item.district === district)
            .map((item) => item.mandal),
        ),
      ),
    [district],
  );
  const villages = useMemo(
    () =>
      Array.from(
        new Set(
          marketplaceListings
            .filter(
              (item) =>
                (district === "all" || item.district === district) &&
                (mandal === "all" || item.mandal === mandal),
            )
            .map((item) => item.village),
        ),
      ),
    [district, mandal],
  );

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return marketplaceListings.filter((listing) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${listing.title} ${listing.category} ${listing.mandal} ${listing.village}`
          .toLowerCase()
          .includes(normalizedQuery);
      return (
        matchesQuery &&
        (district === "all" || listing.district === district) &&
        (mandal === "all" || listing.mandal === mandal) &&
        (village === "all" || listing.village === village) &&
        (category === "all" || listing.category === category) &&
        (!availableOnly || listing.available)
      );
    });
  }, [availableOnly, category, district, mandal, query, village]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    recordEvent("search_performed");
  }

  function toggleFavorite(listingId: number) {
    const next = favorites.includes(listingId)
      ? favorites.filter((id) => id !== listingId)
      : [...favorites, listingId];
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(FAVORITES_EVENT));
    if (next.includes(listingId)) recordEvent("favorite_added", listingId);
  }

  function resetFilters() {
    setQuery("");
    setDistrict("all");
    setMandal("all");
    setVillage("all");
    setCategory("all");
    setAvailableOnly(false);
  }

  return (
    <div className={embedded ? "marketplace-root is-embedded" : "marketplace-root"}>
      {embedded ? null : <ProductHeader activeVersion="v1" />}

      <main className="marketplace-main">
        <section className="search-intro" aria-labelledby="marketplace-title">
          <h1 id="marketplace-title">{copy.headline}</h1>
          <p>{copy.subheadline}</p>

          <form className="location-search" onSubmit={handleSearch}>
            <label className="search-field search-field-query">
              <span>{copy.searchLabel}</span>
              <div>
                <Search size={20} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                />
              </div>
            </label>
            <label className="search-field">
              <span>{copy.district}</span>
              <select
                value={district}
                onChange={(event) => {
                  setDistrict(event.target.value);
                  setMandal("all");
                  setVillage("all");
                }}
              >
                <option value="all">{copy.all}</option>
                {districts.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="search-field">
              <span>{copy.mandal}</span>
              <select
                value={mandal}
                onChange={(event) => {
                  setMandal(event.target.value);
                  setVillage("all");
                }}
              >
                <option value="all">{copy.all}</option>
                {mandals.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="search-field">
              <span>{copy.village}</span>
              <select value={village} onChange={(event) => setVillage(event.target.value)}>
                <option value="all">{copy.all}</option>
                {villages.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="primary-search-button">
              <Search size={21} aria-hidden="true" />
              {copy.search}
            </button>
          </form>
        </section>

        <section className="category-section" aria-label="Equipment categories">
          <div className="category-rail">
            {marketplaceCategories.map((item) => {
              const Icon = categoryIcons[item.id];
              const isSelected = category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(isSelected ? "all" : item.id)}
                  className={isSelected ? "category-option is-selected" : "category-option"}
                  aria-pressed={isSelected}
                >
                  <span><Icon size={28} strokeWidth={1.8} aria-hidden="true" /></span>
                  {item[language]}
                  {isSelected ? <CheckCircle2 className="category-check" size={18} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={filtersOpen || availableOnly ? "filter-button is-active" : "filter-button"}
            onClick={() => setFiltersOpen((current) => !current)}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal size={19} aria-hidden="true" />
            {copy.filters}
          </button>
        </section>

        {filtersOpen ? (
          <div className="quick-filters">
            <button
              type="button"
              className={availableOnly ? "is-active" : undefined}
              onClick={() => setAvailableOnly((current) => !current)}
              aria-pressed={availableOnly}
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              {copy.availableNow}
            </button>
            <button type="button" onClick={resetFilters}>{copy.reset}</button>
          </div>
        ) : null}

        <section className="results-section" aria-labelledby="results-title">
          <div className="results-heading">
            <h2 id="results-title">{copy.results}</h2>
            <span>{filteredListings.length}</span>
          </div>

          <div className="listing-stack">
            {filteredListings.map((listing, index) => {
              const expanded = listing.id === expandedId;
              const favorite = favorites.includes(listing.id);
              const whatsappMessage = encodeURIComponent(
                language === "te"
                  ? `MandalRent లో ${listing.title} చూశాను. అద్దెకు కావాలి. స్థలం: ${listing.mandal}.`
                  : `Hello, I found your ${listing.title} on MandalRent. I am interested in renting it. Location: ${listing.mandal}.`,
              );

              return (
                <article key={listing.id} className={expanded ? "listing-row is-expanded" : "listing-row"}>
                  <div className="listing-image-wrap">
                    <Image
                      src={listing.image}
                      alt={listing.imageAlt[language]}
                      width={640}
                      height={480}
                      priority={index === 0}
                      sizes="(max-width: 720px) 36vw, 300px"
                      className="listing-image"
                    />
                  </div>

                  <div className="listing-summary">
                    <div className="listing-title-row">
                      <div>
                        <h3>{listing.title}</h3>
                        <p className="listing-price">₹{listing.price.toLocaleString("en-IN")} <span>/ {listing.unit[language]}</span></p>
                      </div>
                      <button
                        type="button"
                        className={favorite ? "favorite-button is-saved" : "favorite-button"}
                        onClick={() => toggleFavorite(listing.id)}
                        aria-label={favorite ? copy.saved : copy.save}
                        aria-pressed={favorite}
                      >
                        <Heart size={23} fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
                      </button>
                    </div>

                    <p className="listing-location"><MapPin size={17} aria-hidden="true" /> {listing.mandal} • {listing.village}</p>
                    <p className={listing.available ? "availability is-available" : "availability is-busy"}>
                      <span aria-hidden="true" />
                      {listing.available ? copy.availableNow : copy.busy}
                    </p>

                    <div className="listing-actions">
                      <button
                        type="button"
                        className="details-button"
                        onClick={() => {
                          setExpandedId(expanded ? 0 : listing.id);
                          if (!expanded) recordEvent("listing_view", listing.id);
                        }}
                        aria-expanded={expanded}
                      >
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        {expanded ? copy.hideDetails : copy.details}
                      </button>
                      <a href={`tel:${listing.phone}`} onClick={() => recordEvent("call_click", listing.id)} className="call-button">
                        <Phone size={18} aria-hidden="true" /> {copy.call}
                      </a>
                      <a
                        href={`https://wa.me/91${listing.phone}?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => recordEvent("whatsapp_click", listing.id)}
                        className="whatsapp-button"
                      >
                        <MessageCircle size={19} aria-hidden="true" /> {copy.whatsapp}
                      </a>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="listing-detail-panel">
                      <div>
                        <span>{language === "te" ? "మోడల్" : "Model"}</span>
                        <strong>{listing.title.replace(" Tractor", "")}</strong>
                      </div>
                      <div>
                        <span>{language === "te" ? "సంవత్సరం" : "Year"}</span>
                        <strong>{listing.year}</strong>
                      </div>
                      <div>
                        <span>{language === "te" ? "వివరాలు" : "Specification"}</span>
                        <strong>{listing.specification}</strong>
                      </div>
                      <div className="owner-detail">
                        <span>{copy.ownerDetails}</span>
                        <strong>{listing.owner}</strong>
                        <small>{listing.verified ? copy.verifiedOwner : listing.responseTime[language]}</small>
                      </div>
                      <p>{listing.description[language]}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          {filteredListings.length === 0 ? (
            <div className="empty-results">
              <Search size={32} aria-hidden="true" />
              <p>{copy.noResults}</p>
              <button type="button" onClick={resetFilters}>{copy.reset}</button>
            </div>
          ) : null}
        </section>
      </main>

      {embedded ? null : <MobileBottomNav active="discover" />}
    </div>
  );
}
