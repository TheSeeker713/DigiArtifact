import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  invalidateAdminSession,
} from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  try {
    await invalidateAdminSession(request);
    const response = NextResponse.json({ ok: true });
    clearAdminSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Admin logout failed", error);
    return NextResponse.json({ error: "Failed to log out." }, { status: 500 });
  }
}
