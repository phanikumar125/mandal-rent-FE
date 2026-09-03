import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, profile: currentUser.profile });
  } catch (error) {
    console.error("Session API error", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
