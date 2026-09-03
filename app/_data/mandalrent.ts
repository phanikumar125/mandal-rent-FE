export type Role = "farmer" | "owner";

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
      {
        name: "Kanchikacherla",
        villages: ["Moguluru", "Srirampuram", "Tanikella"],
      },
      {
        name: "A Konduru",
        villages: ["Atlapragada", "Cheemalapadu", "Kummarakuntla"],
      },
    ],
  },
  {
    district: "Guntur",
    mandals: [
      { name: "Mangalagiri", villages: ["Kaza", "Nidamarru", "Atmakur"] },
      { name: "Tadepalli", villages: ["Undavalli", "Penumaka", "Mandam"] },
    ],
  },
  {
    district: "West Godavari",
    mandals: [
      {
        name: "Bhimavaram",
        villages: ["Narasimhapuram", "Chinamiram", "Rayalam"],
      },
      {
        name: "Akividu",
        villages: ["Kolleru", "Pedakapavaram", "Chinakapavaram"],
      },
    ],
  },
  {
    district: "East Godavari",
    mandals: [
      {
        name: "Mummidivaram",
        villages: ["Kothalanka", "Muramalla", "Serilanka"],
      },
      {
        name: "Peddapudi",
        villages: ["Gollala Mamidada", "Sampara", "Konkuduru"],
      },
    ],
  },
  {
    district: "Konaseema",
    mandals: [
      {
        name: "Amalapuram",
        villages: ["Palagummi", "Bandarulanka", "Mukkamala"],
      },
      { name: "Rayavaram", villages: ["Lolla", "Vedurupaka", "Someswaram"] },
    ],
  },
  {
    district: "Prakasam",
    mandals: [
      {
        name: "Chimakurthy",
        villages: ["Bandlamudi", "P.Naidupalem", "Pallamalli"],
      },
      { name: "Kothapatnam", villages: ["Madanur", "Rajupalem", "Padarthi"] },
    ],
  },
  {
    district: "Tirupati",
    mandals: [
      { name: "Dakkili", villages: ["Althurupadu", "Amuduru", "Chapalapalle"] },
      { name: "Naidupeta", villages: ["Kuchiwada", "Marlapalle", "Menakuru"] },
    ],
  },
  {
    district: "SPSR Nellore",
    mandals: [
      { name: "Gudluru", villages: ["Ravuru", "Chevuru", "Salipeta"] },
      { name: "Ulavapadu", villages: ["Karedu", "Rudrakota", "Cherukur"] },
    ],
  },
  {
    district: "Kurnool",
    mandals: [
      { name: "Adoni", villages: ["Ballekallu", "Basapuram", "Basarakodu"] },
      { name: "Alur", villages: ["Arikera", "Hathi Belgal", "Kammarachedu"] },
    ],
  },
  {
    district: "Ananthapuramu",
    mandals: [
      {
        name: "Anantapur Rural",
        villages: ["Papampeta", "A.Narayanapuram", "Akkampalli"],
      },
      {
        name: "Rapthadu",
        villages: ["Kakkalapalli", "Kamarupalli", "Kurugunta"],
      },
    ],
  },
  {
    district: "Srikakulam",
    mandals: [
      { name: "Palasa", villages: ["Kasibugga", "Divisala", "Muddada"] },
      { name: "Mandasa", villages: ["Haripuram", "Makuluru", "Kuntibadra"] },
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
    summary:
      "Reliable tractor with driver support for ploughing and haulage work.",
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
    summary:
      "Precision spraying for fertilizer and crop protection applications.",
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
    detail:
      "Mahindra 575 DI Tractor reserved for Kanchikacherla rice field prep.",
    status: "Today",
  },
  {
    title: "Check diesel surcharge",
    detail:
      "Owner requested a small fuel adjustment for a distant village booking.",
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
    subtitle:
      "Find trusted owners in your mandal, book fast, and keep farm work moving.",
  },
  te: {
    greeting: "ప్రతి పొలానికి దగ్గరలోనే అవసరమైన పరికరాలు.",
    subtitle:
      "మీ మండలంలో ఉన్న నమ్మకమైన యజమానులను చూడండి, వేగంగా బుక్ చేయండి, పనిని ఆపకుండా కొనసాగించండి.",
  },
} as const;

export const publicCopy = {
  en: {
    brandLine: "Machinery rental for farmers",
    heroTitle: "Find trusted farm machinery near you.",
    heroSubtitle:
      "Farmers can browse and book equipment. Owners can upload machines and receive enquiries from nearby farmers.",
    farmerTitle: "I am a Farmer",
    farmerTag: "Farmer",
    farmerText:
      "Search tractors, rotavators, harvesters, and other machinery for your fields.",
    farmerNeedEquipment: "Need machinery for my farm",
    ownerTitle: "I am an Owner",
    ownerTag: "Owner",
    ownerText:
      "Upload your machines, set rates, and get farmer enquiries faster.",
    ownerWantToList: "Want to list machinery",
    languageButton: "తెలుగు",
    startButton: "Start",
    browseButton: "Browse machinery",
    whyTitle: "Made for equipment trading",
    whyText:
      "The flow helps farmers discover real machines and lets owners list verified equipment with clear local pricing.",
    stepsTitle: "How it works",
    stepFarmer:
      "Farmer browses by district and mandal, then contacts the owner.",
    stepOwner: "Owner uploads machinery details and updates availability.",
    farmerBullets: [
      "Discover nearby tractors and field equipment",
      "Check price, location, and availability before booking",
      "Contact owners directly for quick decisions",
    ],
    ownerBullets: [
      "List machines with clear rates and location",
      "Receive enquiries from nearby farmers",
      "Keep equipment ready for seasonal demand",
    ],
    simpleSteps: [
      "Pick Farmer or Owner",
      "Choose your district and mandal",
      "Find machinery or list equipment",
    ],
    loginTitle: "Sign in",
    loginHeader: "Farmer / Owner login",
    loginSubtitle: "Use phone and password to continue.",
    registerTitle: "Create account",
    registerHeader: "Farmer / Owner registration",
    registerSubtitle: "Pick Farmer or Owner, then continue to the right setup.",
    backHome: "Back home",
    alreadyHaveAccount: "Already have an account?",
    phoneLabel: "Phone number",
    passwordLabel: "Password",
    fullNameLabel: "Full name",
    roleLabel: "You are a",
    farmerShort: "Farmer",
    ownerShort: "Owner",
    farmerNeedEquipmentShort: "Need machinery for my farm",
    ownerWantToListShort: "Want to list machinery",
    namePlaceholder: "Your name",
    phonePlaceholder: "9876543210",
    passwordPlaceholder: "Enter password",
    demoNote: "Starter UI for the equipment marketplace flow.",
  },
  te: {
    brandLine: "రైతుల కోసం యంత్రాల అద్దె మార్కెట్",
    heroTitle: "మీ దగ్గర ఉన్న విశ్వసనీయ పరికరాలను కనుగొనండి.",
    heroSubtitle:
      "రైతులు పరికరాలను చూసి బుక్ చేసుకోవచ్చు. యజమానులు మిషన్లు మరియు పరికరాలను అప్లోడ్ చేసి దగ్గర్లోని రైతుల అభ్యర్థనలను స్వీకరించవచ్చు.",
    farmerTitle: "నేను రైతు",
    farmerTag: "రైతు",
    farmerText:
      "ట్రాక్టర్, రోటావేటర్, హార్వెస్టర్ మరియు మిగిలిన పరికరాలను చూడండి.",
    farmerNeedEquipment: "నా పొలానికి పరికరాలు కావాలి",
    ownerTitle: "నేను యజమాని",
    ownerTag: "యజమాని",
    ownerText:
      "మీ యంత్రాలను అప్‌లోడ్ చేసి, ధరలను సెట్ చేసి, రైతుల అభ్యర్థనలను పొందండి.",
    ownerWantToList: "పరికరాలు జాబితా చేయాలనుకుంటున్నారా",
    languageButton: "EN",
    startButton: "ప్రారంభించండి",
    browseButton: "పరికరాలు చూడండి",
    whyTitle: "పరికరాల వాణిజ్యానికి తయారు",
    whyText:
      "ఈ ఫ్లో రైతులకు నిజమైన యంత్రాల ప్రాప్తిని అందిస్తుంది, యజమానులు స్పష్టమైన స్థానంతో పరికరాలను జాబితా చేయగలుగుతారు.",
    stepsTitle: "ఇది ఎలా పనిచేస్తుంది",
    stepFarmer: "రైతు జిల్లా మరియు మండలాన్ని ఎంచుకుని యజమాని సంప్రదిస్తాడు.",
    stepOwner: "యజమాని యంత్రాల వివరాలను అప్లోడ్ చేసి లభ్యతను నవీకరిస్తాడు.",
    farmerBullets: [
      "దగ్గరలోని ట్రాక్టర్‌లు మరియు పంట పరికరాలను కనుగొనండి",
      "ధర, స్థానం, మరియు లభ్యతను చూసి బుక్ చేయండి",
      "వేగంగా సంప్రదింపు కోసం యజమానులను ఎంచుకోండి",
    ],
    ownerBullets: [
      "స్పష్టమైన ధరలతో యంత్రాలను జాబితా చేయండి",
      "దగ్గరలోని రైతుల అభ్యర్థనలను అందుకోండి",
      "సీజన్ డిమాండ్‌కు యంత్రాలను సిద్ధంగా ఉంచండి",
    ],
    simpleSteps: [
      "రైతు లేదా యజమానిని ఎంచుకోండి",
      "మీ జిల్లా మరియు మండలాన్ని ఎంచుకోండి",
      "పరికరాలు కనుగొనండి లేదా జాబితా చేయండి",
    ],
    loginTitle: "సైన్ ఇన్",
    loginHeader: "రైతు / యజమాని ప్రవేశం",
    loginSubtitle: "కనసాగించడానికి ఫోన్ నంబర్ మరియు పాస్‌వర్డ్ ఉపయోగించండి.",
    registerTitle: "ఖాతా సృష్టించండి",
    registerHeader: "రైతు / యజమాని నమోదు",
    registerSubtitle:
      "ముందు రైతు లేదా యజమానిని ఎంచుకుని, సరైన సెటప్‌కి వెళ్లండి.",
    backHome: "హోమ్‌కి వెళ్లండి",
    alreadyHaveAccount: "ముందే ఖాతా ఉందా?",
    phoneLabel: "ఫోన్ నంబర్",
    passwordLabel: "పాస్‌వర్డ్",
    fullNameLabel: "పూర్తి పేరు",
    roleLabel: "మీరు",
    farmerShort: "రైతు",
    ownerShort: "యజమాని",
    farmerNeedEquipmentShort: "నా పొలానికి పరికరాలు కావాలి",
    ownerWantToListShort: "పరికరాలు జాబితా చేయాలనుకుంటున్నారా",
    namePlaceholder: "మీ పేరు",
    phonePlaceholder: "9876543210",
    passwordPlaceholder: "పాస్‌వర్డ్ ఇవ్వండి",
    demoNote: "ఎక్విప్మెంట్ మార్కెట్‌ ఫ్లో కోసం స్టార్టర్ UI.",
  },
} as const;

export function getMandals(district: string) {
  return (
    districtLocations.find((entry) => entry.district === district)?.mandals ??
    []
  );
}

export function getVillages(district: string, mandal: string) {
  return (
    getMandals(district).find((entry) => entry.name === mandal)?.villages ?? []
  );
}
