import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { attachSessionCookie, createSession, verifyPassword } from "@/lib/auth";
import { ensureUserBootstrap } from "@/lib/bootstrap";
import { ensureCoreSchema } from "@/lib/schema";

type SigninBody = {
  email?: unknown;
  password?: unknown;
};

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreSchema();
    const body = (await request.json()) as SigninBody;
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const db = getDb();
    const user = await db
      .prepare("SELECT id, email, password_hash, display_name FROM app_users WHERE email = ?")
      .bind(email)
      .first<{
        id: string;
        email: string;
        password_hash: string;
        display_name: string;
      }>();

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await ensureUserBootstrap(user.id);
    const sessionToken = await createSession(user.id);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
    });
    attachSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    console.error("Failed to sign in user", error);
    return NextResponse.json({ error: "Failed to sign in user." }, { status: 500 });
  }
}
