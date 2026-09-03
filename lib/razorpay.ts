import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
};

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay server configuration is missing");
  return { keyId, keySecret };
}

export function razorpayKeyId() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) throw new Error("Razorpay public configuration is missing");
  return keyId;
}

export async function createRazorpayOrder(input: { amount: number; receipt: string; notes?: Record<string, string> }) {
  const { keyId, keySecret } = credentials();
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: input.amount, currency: "INR", receipt: input.receipt, notes: input.notes }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as Partial<RazorpayOrder> | null;
  if (!response.ok || !body?.id || typeof body.amount !== "number") {
    throw new Error(`Razorpay order creation failed (${response.status})`);
  }
  return { id: body.id, amount: body.amount, currency: body.currency ?? "INR", receipt: body.receipt ?? input.receipt };
}

function safeCompare(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string) {
  const { keySecret } = credentials();
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeCompare(expected, signature);
}

export function verifyRazorpayWebhook(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("Razorpay webhook configuration is missing");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompare(expected, signature);
}
