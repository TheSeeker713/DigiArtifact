/**
 * Public routes registry (no auth required)
 */

import { Env, RouteContext } from '../types/env';
import { handleAuthLogin } from '../routes/auth';
import { handleOAuthStart, handleOAuthCallback, handleVerifyGoogleToken } from '../routes/oauth';

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

  // Legacy PIN login
  if (path === '/api/auth/login' && method === 'POST') {
    return handleAuthLogin(request, env, origin);
  }

  // Google OAuth: Start
  if (path === '/api/auth/google/start' && method === 'GET') {
    return handleOAuthStart(request, env, origin);
  }

  // Google OAuth: Callback
  if (path === '/api/auth/google/callback' && method === 'GET') {
    return handleOAuthCallback(request, env, origin);
  }

  // Google OAuth: Verify Token
  if (path === '/api/auth/google/verify' && method === 'POST') {
    return handleVerifyGoogleToken(request, env, origin);
  }

  return null; // No public route matched
}
