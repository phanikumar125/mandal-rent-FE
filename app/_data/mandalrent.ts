export type Role = "farmer" | "owner" | "admin";

export type EquipmentListing = {
  id: number;
  title: string;
  category: string;
  owner: string;
  phone: string;
  district: string;
  mandal: string;
  village: string;
  price: number;
  unit: "hour" | "day" | "acre" | "job";
  rating: number;
  verified: boolean;
  available: boolean;
  responseTime: string;
  summary: string;
  features: string[];
};

export type TaskItem = {
  title: string;
  detail: string;
  status: "Today" | "Due soon" | "Pending";
};

export type MasterLocation = {
  district: string;
  mandals: {
    name: string;
    villages: string[];
  }[];
};

export const portalNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/listings", label: "My Listings" },
  { href: "/profile", label: "Profile" },
  { href: "/admin", label: "Admin" },
] as const;

export const heroStats = [
  { value: "1,240+", label: "verified equipment owners" },
  { value: "18", label: "mandals covered in the demo" },
  { value: "2 min", label: "from search to contact" },
] as const;

export const appModules = [
  {
    title: "Foundation and auth",
    href: "/login",
    detail: "Login, registration, role selection, and protected portal entry.",
  },
  {
    title: "Profiles and location data",
    href: "/profile",
    detail: "District, mandal, village, language, and account settings.",
  },
  {
    title: "Owner listings",
    href: "/listings",
    detail: "Publish equipment, manage availability, and track leads.",
  },
  {
    title: "Farmer marketplace",
    href: "/marketplace",
    detail: "Search, filter, favorite, and contact nearby equipment owners.",
  },
  {
    title: "Admin and analytics",
    href: "/admin",
    detail: "Master data, review queues, and operational health.",
  },
] as const;

export const categories = [
  "Tractor",
  "Rotavator",
  "Harvester",
  "Sprayer",
  "Transplanter",
  "Drone",
  "Cultivator",
  "Power Tiller",
] as const;

export const districtLocations: MasterLocation[] = [
  {
    district: "Krishna",
    mandals: [
      { name: "Kanchikacherla", villages: ["Moguluru", "Srirampuram", "Tanikella"] },
      { name: "Nandigama", villages: ["Weileru", "Munagacherla", "Vellanki"] },
    ],
  },
  {
    district: "Guntur",
    mandals: [
      { name: "Mangalagiri", villages: ["Atmakur", "Kaza", "Nidamarru"] },
      { name: "Tadepalli", villages: ["Undavalli", "Penumaka", "Velagapudi"] },
    ],
  },
  {
    district: "West Godavari",
    mandals: [
      { name: "Bhimadole", villages: ["Chebrole", "Dubbagudem", "Pulla"] },
      { name: "Eluru Rural", villages: ["Sanivarapupeta", "Denduluru", "Komadavole"] },
    ],
  },
];

export const equipmentListings: EquipmentListing[] = [
  {
    id: 1,
    title: "Mahindra 575 DI Tractor",
    category: "Tractor",
    owner: "Suresh Farm Rentals",
    phone: "9876543210",
    district: "Krishna",
    mandal: "Kanchikacherla",
    village: "Moguluru",
    price: 1500,
    unit: "day",
    rating: 4.9,
    verified: true,
    available: true,
    responseTime: "12 min",
    summary: "Reliable tractor with driver support for ploughing and haulage work.",
    features: ["Driver available", "Fuel extra", "Same-day booking"],
  },
  {
    id: 2,
    title: "Heavy Duty Rotavator",
    category: "Rotavator",
    owner: "Lakshmi Agro Service",
    phone: "9848011122",
    district: "Krishna",
    mandal: "Kanchikacherla",
    village: "Srirampuram",
    price: 700,
    unit: "acre",
    rating: 4.8,
    verified: true,
    available: true,
    responseTime: "20 min",
    summary: "Wide rotavator for faster land preparation before sowing.",
    features: ["Operator optional", "Single day slots", "Verified owner"],
  },
  {
    id: 3,
    title: "Agricultural Drone Sprayer",
    category: "Drone",
    owner: "SkyField Services",
    phone: "9701234567",
    district: "Guntur",
    mandal: "Mangalagiri",
    village: "Kaza",
    price: 2200,
    unit: "acre",
    rating: 4.7,
    verified: false,
    available: false,
    responseTime: "35 min",
    summary: "Precision spraying for fertilizer and crop protection applications.",
    features: ["Pilot included", "Bulk discount", "Weather dependent"],
  },
  {
    id: 4,
    title: "Self-propelled Harvester",
    category: "Harvester",
    owner: "Krishna Harvest Hub",
    phone: "9988776655",
    district: "West Godavari",
    mandal: "Bhimadole",
    village: "Pulla",
    price: 6500,
    unit: "acre",
    rating: 5.0,
    verified: true,
    available: true,
    responseTime: "45 min",
    summary: "For paddy and maize harvesting with operator support.",
    features: ["High capacity", "Night bookings", "Fuel and operator"],
  },
  {
    id: 5,
    title: "Transplanter Unit",
    category: "Transplanter",
    owner: "Ramu Equipment",
    phone: "9123456780",
    district: "Krishna",
    mandal: "Nandigama",
    village: "Munagacherla",
    price: 1800,
    unit: "day",
    rating: 4.6,
    verified: true,
    available: true,
    responseTime: "18 min",
    summary: "Fast paddy transplanting for small and medium fields.",
    features: ["Operator included", "Flexible timing", "Advance booking"],
  },
  {
    id: 6,
    title: "Power Tiller Package",
    category: "Power Tiller",
    owner: "Village Tools Co-op",
    phone: "9000012345",
    district: "Guntur",
    mandal: "Tadepalli",
    village: "Undavalli",
    price: 900,
    unit: "day",
    rating: 4.5,
    verified: false,
    available: true,
    responseTime: "25 min",
    summary: "Compact tiller for small plots and inter-cultivation work.",
    features: ["Easy transport", "Farmer friendly", "Hourly rental"],
  },
];

export const farmerTasks: TaskItem[] = [
  {
    title: "Confirm tomorrow's booking",
    detail: "Mahindra 575 DI Tractor reserved for Kanchikacherla rice field prep.",
    status: "Today",
  },
  {
    title: "Check diesel surcharge",
    detail: "Owner requested a small fuel adjustment for a distant village booking.",
    status: "Due soon",
  },
  {
    title: "Review saved equipment",
    detail: "Two rotavators and one drone sprayer are already in favorites.",
    status: "Pending",
  },
];

export const ownerPipeline = [
  {
    label: "Requests today",
    value: "14",
    hint: "5 new WhatsApp leads, 9 call taps",
  },
  {
    label: "Bookings this week",
    value: "26",
    hint: "3 repeated farmers and 4 repeat slots",
  },
  {
    label: "Availability score",
    value: "92%",
    hint: "Based on response speed and booking confirmation",
  },
] as const;

export const adminOverview = [
  { label: "Active owners", value: "412" },
  { label: "Farmer accounts", value: "1,028" },
  { label: "Verified listings", value: "318" },
  { label: "Pending reviews", value: "17" },
] as const;

export const languagePhrases = {
  en: {
    greeting: "Farm equipment, right where you need it.",
    subtitle: "Find trusted owners in your mandal, book fast, and keep farm work moving.",
  },
  te: {
    greeting: "Mandal level equipment access for every farm.",
    subtitle: "Nearby equipment ni search cheyyandi, verify chesina owners tho direct ga connect avvandi.",
  },
} as const;

export function getMandals(district: string) {
  return districtLocations.find((entry) => entry.district === district)?.mandals ?? [];
}

export function getVillages(district: string, mandal: string) {
  return getMandals(district).find((entry) => entry.name === mandal)?.villages ?? [];
}
