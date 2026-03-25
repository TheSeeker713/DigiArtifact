import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { ensureUserBootstrap } from "@/lib/bootstrap";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserBootstrap(user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("Failed to load session user", error);
    return NextResponse.json({ error: "Failed to load session user." }, { status: 500 });
  }
}
