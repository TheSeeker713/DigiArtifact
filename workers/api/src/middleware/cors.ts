/**
 * CORS middleware utilities
 */

export function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCorsPreFlight(origin: string): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
