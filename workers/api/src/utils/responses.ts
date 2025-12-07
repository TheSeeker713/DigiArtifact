/**
 * Shared response utilities and re-exports for backward compatibility
 */

import { corsHeaders } from '../middleware/cors';

export { Env, User, JWTPayload, RouteContext, ProtectedRouteContext } from '../types/env';
export { corsHeaders } from '../middleware/cors';

export function jsonResponse(
  data: any,
  status = 200,
  origin: string
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}
