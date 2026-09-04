export const rentalStatuses = [
  "requested",
  "accepted",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "rejected",
  "fulfilled",
] as const;

export type RentalStatus = (typeof rentalStatuses)[number];

const transitions: Record<RentalStatus, readonly RentalStatus[]> = {
  requested: ["confirmed", "accepted", "rejected", "cancelled"],
  accepted: ["confirmed", "rejected", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
  rejected: [],
  fulfilled: [],
};

export function canTransition(from: string, to: RentalStatus) {
  return (transitions[from as RentalStatus] ?? []).includes(to);
}

export function displayRentalStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function isCancellable(value: string) {
  return value === "requested" || value === "accepted" || value === "confirmed";
}
