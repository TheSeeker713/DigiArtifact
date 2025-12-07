/**
 * Environment types for Cloudflare Worker bindings
 */

import { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  API_BASE_URL: string;
  FRONTEND_URL: string;
  ALLOW_SIGNUPS: string;
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

export interface RouteContext {
  url: URL;
  method: string;
  origin: string;
}

export interface ProtectedRouteContext extends RouteContext {
  user: User;
}
