import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureCoreSchema } from "@/lib/schema";

export const SESSION_COOKIE = "kaia_session";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 120_000;

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
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

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return `${toBase64Url(salt)}.${toBase64Url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [saltPart, hashPart] = storedHash.split(".");
  if (!saltPart || !hashPart) {
    return false;
  }
  const salt = fromBase64Url(saltPart);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  const computed = toBase64Url(new Uint8Array(bits));
  return computed === hashPart;
}

export async function createSession(userId: string) {
  await ensureCoreSchema();
  const token = `${crypto.randomUUID()}_${crypto.randomUUID()}`;
  const tokenHash = await sha256Hex(token);
  const db = getDb();
  await db
    .prepare(
      `INSERT INTO app_sessions (token_hash, user_id, expires_at, created_at)
       VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'), datetime('now'))`
    )
    .bind(tokenHash, userId)
    .run();
  return token;
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return null;
  }

  await ensureCoreSchema();
  const tokenHash = await sha256Hex(sessionToken);
  const db = getDb();
  const result = await db
    .prepare(
      `SELECT u.id, u.email, u.display_name
       FROM app_sessions s
       INNER JOIN app_users u ON u.id = s.user_id
       WHERE s.token_hash = ?
         AND datetime(s.expires_at) > datetime('now')
       LIMIT 1`
    )
    .bind(tokenHash)
    .first<{
      id: string;
      email: string;
      display_name: string;
    }>();

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    email: result.email,
    displayName: result.display_name,
  };
}

export async function requireAuthUser(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return null;
  }
  return user;
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}

export async function invalidateSession(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return;
  }
  await ensureCoreSchema();
  const tokenHash = await sha256Hex(sessionToken);
  const db = getDb();
  await db
    .prepare("DELETE FROM app_sessions WHERE token_hash = ?")
    .bind(tokenHash)
    .run();
}
