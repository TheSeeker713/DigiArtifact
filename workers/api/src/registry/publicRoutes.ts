/**
 * Public routes registry (no auth required)
 */

import { Env, RouteContext } from '../types/env';
import { jsonResponse } from '../utils/responses';
import {
  handleOAuthStart,
  handleOAuthCallback,
  handleVerifyGoogleToken,
} from '../routes/oauth';

/**
 * Try to match and handle public routes
 * Returns Response if matched, null otherwise
 */
export async function handlePublicRoutes(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response | null> {
  const { url, method, origin } = context;
  const path = url.pathname;

  // =========================================================
  // GOOGLE OAUTH ROUTES ONLY
  // PIN Login has been deprecated and removed.
  // =========================================================

  // Google OAuth: Start
  if (path === '/api/auth/google/start' && method === 'GET') {
    return handleOAuthStart(request, env, origin);
  }

  // Google OAuth: Callback
  if (path === '/api/auth/google/callback' && method === 'GET') {
    return handleOAuthCallback(request, env, origin);
  }

  // Google OAuth: Verify Token (for frontend session checks)
  if (path === '/api/auth/google/verify' && method === 'POST') {
    return handleVerifyGoogleToken(request, env, origin);
  }

  return null; // No match
}
