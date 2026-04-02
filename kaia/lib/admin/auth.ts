import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const ADMIN_SESSION_COOKIE = "kaia-admin-session";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 120_000;

export type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  mustChangePassword: boolean;
};

type AdminUserRow = {
  id: string;
  username: string;
  display_name: string;
  role: string;
  must_change_password: number;
};

type SessionUserRow = AdminUserRow & {
  expires_at: string;
};

function toBase64Url(bytes: Uint8Array) {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    mustChangePassword: row.must_change_password === 1,
  };
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function derivePasswordHash(password: string, saltBytes: Uint8Array) {
  const saltBuffer = saltBytes.buffer.slice(
    saltBytes.byteOffset,
    saltBytes.byteOffset + saltBytes.byteLength
  ) as ArrayBuffer;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuffer, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return toBase64Url(new Uint8Array(bits));
}

export function normalizeUsername(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
}

export async function hashAdminPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt);
  return {
    salt: toBase64Url(salt),
    hash,
  };
}

export async function verifyAdminPassword(password: string, salt: string, storedHash: string) {
  const saltBytes = fromBase64Url(salt);
  const computed = await derivePasswordHash(password, saltBytes);
  return timingSafeEqual(computed, storedHash);
}

export async function createAdminSession(userId: string) {
  const token = `${crypto.randomUUID()}_${crypto.randomUUID()}`;
  const tokenHash = await sha256Hex(token);
  const db = getDb();
  await db
    .prepare(
      `INSERT INTO admin_sessions (token_hash, user_id, expires_at, created_at)
       VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'), datetime('now'))`
    )
    .bind(tokenHash, userId)
    .run();
  return token;
}

export async function getAdminSessionUser(request: NextRequest): Promise<AdminUser | null> {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return null;
  }
  return getAdminSessionUserFromToken(sessionToken);
}

export async function getAdminSessionUserFromToken(sessionToken: string): Promise<AdminUser | null> {
  if (!sessionToken) {
    return null;
  }
  const tokenHash = await sha256Hex(sessionToken);
  const db = getDb();
  const row = await db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.role, u.must_change_password, s.expires_at
       FROM admin_sessions s
       INNER JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_hash = ?
         AND datetime(s.expires_at) > datetime('now')
       LIMIT 1`
    )
    .bind(tokenHash)
    .first<SessionUserRow>();

  if (!row) {
    return null;
  }
  return toAdminUser(row);
}

export async function invalidateAdminSession(request: NextRequest) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return;
  }
  const tokenHash = await sha256Hex(sessionToken);
  const db = getDb();
  await db
    .prepare("DELETE FROM admin_sessions WHERE token_hash = ?")
    .bind(tokenHash)
    .run();
}

export function attachAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}

export async function countRecentLoginAttempts(ipHash: string) {
  const db = getDb();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM admin_login_attempts
       WHERE ip_hash = ?
         AND datetime(attempted_at) > datetime('now', '-1 minute')`
    )
    .bind(ipHash)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function recordLoginAttempt(ipHash: string) {
  const db = getDb();
  await db
    .prepare(
      `INSERT INTO admin_login_attempts (ip_hash, attempted_at)
       VALUES (?, datetime('now'))`
    )
    .bind(ipHash)
    .run();
}

export async function trimOldLoginAttempts() {
  const db = getDb();
  await db
    .prepare(
      `DELETE FROM admin_login_attempts
       WHERE datetime(attempted_at) < datetime('now', '-1 day')`
    )
    .run();
}

export async function hashIp(ip: string) {
  return sha256Hex(ip);
}
