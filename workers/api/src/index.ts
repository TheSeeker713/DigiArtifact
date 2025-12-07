/**
 * DigiArtifact Workers API - Main Entry Point
 * Cloudflare Worker for time tracking backend
 *
 * Architecture:
 * - Middleware pipeline (CORS, Auth, Error handling)
 * - Route registry pattern (public & protected routes)
 * - Modular route handlers in src/routes/
 */

import { Env, jsonResponse, RouteContext, ProtectedRouteContext } from './utils/responses';
import { handleCorsPreFlight } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { handlePublicRoutes } from './registry/publicRoutes';
import { handleProtectedRoutes } from './registry/protectedRoutes';
import { getUser } from './utils';

export { Env } from './utils/responses';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const origin = env.CORS_ORIGIN;

    try {
      // ========================================
      // CORS Preflight Handling
      // ========================================
      if (method === 'OPTIONS') {
        return handleCorsPreFlight(origin);
      }

      // ========================================
      // PUBLIC ROUTES (no authentication)
      // ========================================
      const publicContext: RouteContext = { url, method, origin };
      const publicResponse = await handlePublicRoutes(request, env, publicContext);
      if (publicResponse) return publicResponse;

      // ========================================
      // AUTHENTICATION CHECK
      // ========================================
      const user = await getUser(request, env);
      if (!user) {
        return jsonResponse({ error: 'Unauthorized' }, 401, origin);
      }

      // ========================================
      // PROTECTED ROUTES (authentication required)
      // ========================================
      const protectedContext: ProtectedRouteContext = {
        url,
        method,
        origin,
        user,
      };
      const protectedResponse = await handleProtectedRoutes(
        request,
        env,
        protectedContext
      );
      if (protectedResponse) return protectedResponse;

      // ========================================
      // 404 Not Found
      // ========================================
      return jsonResponse({ error: 'Not found' }, 404, origin);

    } catch (error: any) {
      return errorHandler(error, env, origin);
    }
  },
};
