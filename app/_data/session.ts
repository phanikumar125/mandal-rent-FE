export type SessionRole = "farmer" | "owner";

export type FarmerProfileFields = {
  landSize: string;
  cropType: string;
  machineryNeed: string;
};

export type OwnerProfileFields = {
  equipmentType: string;
  machineCount: string;
  serviceArea: string;
};

export type ProfileSession = {
  authenticated: boolean;
  entryType: "register" | "login";
  role: SessionRole;
  fullName: string;
  phone: string;
  city: string;
  pincode: string;
  language: "en" | "te";
  district: string;
  mandal: string;
  village: string;
  farmerProfile?: FarmerProfileFields;
  ownerProfile?: OwnerProfileFields;
  signedInAt: string;
};

export const SESSION_STORAGE_KEY = "mandalrent-session";

export const defaultSessionProfile: ProfileSession = {
  authenticated: false,
  entryType: "register",
  role: "farmer",
  fullName: "",
  phone: "",
  city: "",
  pincode: "",
  language: "en",
  district: "Krishna",
  mandal: "Kanchikacherla",
  village: "Moguluru",
  farmerProfile: {
    landSize: "",
    cropType: "",
    machineryNeed: "",
  },
  ownerProfile: {
    equipmentType: "",
    machineCount: "",
    serviceArea: "",
  },
  signedInAt: new Date().toISOString(),
};

export function readSessionProfile(): ProfileSession {
  if (typeof window === "undefined") {
    return defaultSessionProfile;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) {
    return defaultSessionProfile;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProfileSession>;
    return {
      ...defaultSessionProfile,
      ...parsed,
      role: parsed.role === "owner" ? "owner" : "farmer",
      language: parsed.language === "te" ? "te" : "en",
    };
  } catch {
    return defaultSessionProfile;
  }
}

export function saveSessionProfile(next: Partial<ProfileSession>) {
  if (typeof window === "undefined") {
    return defaultSessionProfile;
  }

  const current = readSessionProfile();
  const updated: ProfileSession = {
    ...current,
    ...next,
    role: next.role === "owner" ? "owner" : "farmer",
    language: next.language === "te" ? "te" : "en",
    signedInAt: new Date().toISOString(),
  };

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearSessionProfile() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
