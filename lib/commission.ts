export const PLATFORM_COMMISSION_PERCENT = 10;

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePaymentSplit(rentalAmount: number, deliveryCharge: number) {
  const rentalSubtotal = money(rentalAmount);
  const delivery = money(deliveryCharge);
  const platformCommission = money(rentalSubtotal * PLATFORM_COMMISSION_PERCENT / 100);
  const grossAmount = money(rentalSubtotal + delivery);
  const ownerAmount = money(rentalSubtotal - platformCommission + delivery);
  return { rentalAmount: rentalSubtotal, deliveryCharge: delivery, grossAmount, platformCommission, ownerAmount };
}
