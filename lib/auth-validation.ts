const WEAK_PINS = new Set(["000000", "111111", "123456", "654321"]);

/** Return the canonical E.164 representation for an Indian mobile number. */
export function normalizeIndianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const nationalNumber = digits.startsWith("91") && digits.length === 12
    ? digits.slice(2)
    : digits;

  if (!/^[6-9]\d{9}$/.test(nationalNumber)) return null;
  return `+91${nationalNumber}`;
}

export function isValidPin(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export function isWeakPin(value: string): boolean {
  if (WEAK_PINS.has(value) || /^([0-9])\1{5}$/.test(value)) return true;
  const digits = value.split("").map(Number);
  return digits.length === 6 && (digits.every((digit, index) => index === 0 || digit === digits[index - 1] + 1) || digits.every((digit, index) => index === 0 || digit === digits[index - 1] - 1));
}
