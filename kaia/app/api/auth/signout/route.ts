import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, invalidateSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await invalidateSession(request);
    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Failed to sign out user", error);
    return NextResponse.json({ error: "Failed to sign out user." }, { status: 500 });
  }
}
