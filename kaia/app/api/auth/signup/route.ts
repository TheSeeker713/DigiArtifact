import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { attachSessionCookie, createSession, hashPassword } from "@/lib/auth";
import { ensureUserBootstrap } from "@/lib/bootstrap";

type SignupBody = {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
};

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupBody;
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim().slice(0, 80) : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { error: "Password must be between 8 and 200 characters." },
        { status: 400 }
      );
    }
    if (!displayName || displayName.length < 2) {
      return NextResponse.json(
        { error: "Display name must be at least 2 characters." },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = await db
      .prepare("SELECT id FROM app_users WHERE email = ?")
      .bind(email)
      .first<{ id: string }>();
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    await db
      .prepare(
        `INSERT INTO app_users (id, email, password_hash, display_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .bind(userId, email, passwordHash, displayName)
      .run();

    await ensureUserBootstrap(userId);
    const sessionToken = await createSession(userId);
    const response = NextResponse.json(
      {
        user: {
          id: userId,
          email,
          displayName,
        },
      },
      { status: 201 }
    );
    attachSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    console.error("Failed to sign up user", error);
    return NextResponse.json({ error: "Failed to sign up user." }, { status: 500 });
  }
}
