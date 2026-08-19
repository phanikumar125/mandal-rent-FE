export type EquipmentCategory = {
  name: string;
  te: string;
  rent: string;
  sale: string;
};

export const equipmentCatalog: EquipmentCategory[] = [
  { name: "Tractor", te: "ట్రాక్టర్", rent: "₹1,500–₹3,500 / day", sale: "₹3.5L–₹12L" },
  { name: "Harvester", te: "హార్వెస్టర్", rent: "₹2,500–₹4,500 / acre", sale: "₹18L–₹35L" },
  { name: "Rotavator", te: "రోటావేటర్", rent: "₹700–₹1,200 / acre", sale: "₹85,000–₹2.2L" },
  { name: "Power Tiller", te: "పవర్ టిల్లర్", rent: "₹900–₹1,800 / day", sale: "₹1.2L–₹3L" },
  { name: "Sprayer", te: "స్ప్రేయర్", rent: "₹400–₹1,000 / day", sale: "₹8,000–₹75,000" },
  { name: "Drone", te: "డ్రోన్", rent: "₹400–₹700 / acre", sale: "₹4L–₹10L" },
  { name: "Seed Drill", te: "సీడ్ డ్రిల్", rent: "₹600–₹1,200 / acre", sale: "₹55,000–₹1.8L" },
  { name: "Cultivator", te: "కల్టివేటర్", rent: "₹500–₹900 / acre", sale: "₹35,000–₹1.2L" },
  { name: "Plough", te: "నాగలి", rent: "₹450–₹850 / acre", sale: "₹28,000–₹90,000" },
  { name: "Transplanter", te: "నాటు యంత్రం", rent: "₹2,000–₹3,500 / acre", sale: "₹2L–₹8L" },
  { name: "Baler", te: "బేలర్", rent: "₹1,500–₹3,000 / acre", sale: "₹4L–₹15L" },
  { name: "Thresher", te: "త్రెషర్", rent: "₹1,200–₹2,400 / day", sale: "₹1.1L–₹5L" },
  { name: "Reaper", te: "రీపర్", rent: "₹1,000–₹2,000 / acre", sale: "₹1.5L–₹6L" },
  { name: "Ridger", te: "రిడ్జర్", rent: "₹500–₹900 / acre", sale: "₹38,000–₹1L" },
  { name: "Mulcher", te: "మల్చర్", rent: "₹1,000–₹2,000 / acre", sale: "₹1.4L–₹4.5L" },
  { name: "Water Pump", te: "నీటి పంపు", rent: "₹300–₹900 / day", sale: "₹12,000–₹1.2L" },
  { name: "Trailer", te: "ట్రైలర్", rent: "₹800–₹1,800 / day", sale: "₹1L–₹4L" },
  { name: "Loader", te: "లోడర్", rent: "₹1,500–₹3,500 / day", sale: "₹4L–₹15L" },
  { name: "Post Hole Digger", te: "గుంతల యంత్రం", rent: "₹700–₹1,400 / day", sale: "₹70,000–₹2L" },
  { name: "Fertilizer Spreader", te: "ఎరువు చల్లే యంత్రం", rent: "₹400–₹850 / acre", sale: "₹25,000–₹1.5L" },
  { name: "Paddy Weeder", te: "వరి కలుపు యంత్రం", rent: "₹500–₹1,000 / day", sale: "₹35,000–₹1.2L" },
  { name: "Sugarcane Harvester", te: "చెరకు కోత యంత్రం", rent: "₹3,000–₹6,000 / acre", sale: "₹55L–₹1.2Cr" },
  { name: "Maize Sheller", te: "మొక్కజొన్న షెల్లర్", rent: "₹900–₹1,800 / day", sale: "₹75,000–₹3L" },
  { name: "Chaff Cutter", te: "గడ్డి కోత యంత్రం", rent: "₹400–₹900 / day", sale: "₹18,000–₹1.5L" },
];

export type MarketplaceListing = {
  id: string;
  title: string;
  titleTe: string;
  category: string;
  owner: string;
  location: string;
  distance: string;
  image: string;
  rentPrice?: number;
  rentUnit?: "day" | "acre" | "hour";
  salePrice?: number;
  rating: number;
  available: boolean;
  delivery: boolean;
  ownerId: string;
  district?: string;
};

export const demoListings: MarketplaceListing[] = [
  { id: "demo-tractor", title: "Mahindra 575 DI Tractor", titleTe: "మహీంద్రా 575 డీఐ ట్రాక్టర్", category: "Tractor", owner: "Suresh Farm Machines", location: "Moguluru, Kanchikacherla", distance: "4 km", image: "/equipment/tractor-red.png", rentPrice: 1800, rentUnit: "day", salePrice: 675000, rating: 4.9, available: true, delivery: true, ownerId: "demo-owner-1" },
  { id: "demo-rotavator", title: "7 Feet Heavy Rotavator", titleTe: "7 అడుగుల హెవీ రోటావేటర్", category: "Rotavator", owner: "Lakshmi Agro Service", location: "Srirampuram, Kanchikacherla", distance: "7 km", image: "/equipment/rotavator-orange.png", rentPrice: 750, rentUnit: "acre", salePrice: 118000, rating: 4.8, available: true, delivery: true, ownerId: "demo-owner-2" },
  { id: "demo-harvester", title: "John Deere Combine Harvester", titleTe: "జాన్ డీర్ కంబైన్ హార్వెస్టర్", category: "Harvester", owner: "Krishna Harvest Hub", location: "Ibrahimpatnam, NTR", distance: "16 km", image: "/equipment/harvester-green.png", rentPrice: 3200, rentUnit: "acre", salePrice: 2450000, rating: 4.7, available: true, delivery: false, ownerId: "demo-owner-3" },
];
