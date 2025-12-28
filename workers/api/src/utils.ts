/**
 * Shared utility functions for DigiArtifact Workers API
 */

import { LEVEL_THRESHOLDS } from '../../shared/constants';
import { getDb } from './db/client';
import { users } from './db/schema';
import { eq, and } from 'drizzle-orm';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  API_BASE_URL: string;      // e.g., https://digiartifact-workers-api.digitalartifact11.workers.dev
  FRONTEND_URL: string;      // e.g., https://workers.digiartifact.com
  ALLOW_SIGNUPS: string;     // 'true' or 'false'
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'worker';
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

// Simple JWT implementation for Cloudflare Workers
export async function createJWT(payload: Omit<JWTPayload, 'exp'>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, exp: now + 7 * 24 * 60 * 60 }; // 7 days

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '');
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureStr = atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/'));
    const signature = new Uint8Array([...signatureStr].map(c => c.charCodeAt(0)));
    
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(`${headerB64}.${payloadB64}`)
    );

    if (!valid) return null;

    const payload: JWTPayload = JSON.parse(atob(payloadB64));
    
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch {
    return null;
  }
}


export function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function jsonResponse(data: any, status = 200, origin: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

export async function getUser(request: Request, env: Env): Promise<User | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return null;
  
  // Use Drizzle for type-safe query
  const db = getDb(env);
  
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(and(eq(users.id, payload.userId), eq(users.active, true)))
    .limit(1);
  
  return result[0] || null;
}

export function calculateLevel(totalXP: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

// Storage limits
export const STORAGE_LIMIT_WORKER = 50 * 1024 * 1024; // 50MB
export const STORAGE_LIMIT_ADMIN = 500 * 1024 * 1024; // 500MB

export function getStorageLimit(role: string): number {
  return role === 'admin' ? STORAGE_LIMIT_ADMIN : STORAGE_LIMIT_WORKER;
}
