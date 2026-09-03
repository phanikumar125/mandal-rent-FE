import { NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/server-auth";

export async function POST() {
  try {
    await revokeCurrentSession();
  } catch (error) {
    console.error("Logout API error", error);
  }
  return NextResponse.json({ success: true });
}
