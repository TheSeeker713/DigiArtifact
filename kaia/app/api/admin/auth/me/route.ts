import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/admin/auth";
import { ensureAdminSchema } from "@/lib/admin/schema";

export async function GET(request: NextRequest) {
  try {
    await ensureAdminSchema();
    const user = await getAdminSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to load admin user", error);
    return NextResponse.json({ error: "Failed to load admin user." }, { status: 500 });
  }
}
