import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  attachAdminSessionCookie,
  countRecentLoginAttempts,
  createAdminSession,
  hashIp,
  normalizeUsername,
  recordLoginAttempt,
  trimOldLoginAttempts,
  verifyAdminPassword,
} from "@/lib/admin/auth";
import { ensureAdminSchema } from "@/lib/admin/schema";

type LoginBody = {
  username?: unknown;
  password?: unknown;
};

function getRequestIp(request: NextRequest) {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    await ensureAdminSchema();
    if (Math.random() < 0.05) {
      await trimOldLoginAttempts();
    }

    const ipHash = await hashIp(getRequestIp(request));
    const recentAttempts = await countRecentLoginAttempts(ipHash);
    if (recentAttempts >= 5) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in about a minute." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as LoginBody;
    const username = normalizeUsername(body.username);
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) {
      await recordLoginAttempt(ipHash);
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    const db = getDb();
    const user = await db
      .prepare(
        `SELECT id, username, password_hash, password_salt, display_name, role, must_change_password
         FROM admin_users
         WHERE username = ?`
      )
      .bind(username)
      .first<{
        id: string;
        username: string;
        password_hash: string;
        password_salt: string;
        display_name: string;
        role: string;
        must_change_password: number;
      }>();

    if (!user) {
      await recordLoginAttempt(ipHash);
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const valid = await verifyAdminPassword(password, user.password_salt, user.password_hash);
    if (!valid) {
      await recordLoginAttempt(ipHash);
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const sessionToken = await createAdminSession(user.id);
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
      },
      mustChangePassword: user.must_change_password === 1,
    });
    attachAdminSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    console.error("Admin login failed", error);
    return NextResponse.json({ error: "Failed to log in." }, { status: 500 });
  }
}
