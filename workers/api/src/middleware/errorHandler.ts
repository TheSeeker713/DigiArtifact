/**
 * Error handling middleware
 */

import { Env } from '../types/env';
import { jsonResponse } from '../utils/responses';

export async function errorHandler(
  error: any,
  env: Env,
  origin: string = env.CORS_ORIGIN
): Promise<Response> {
  console.error('API Error:', error);

  // Log to external service if needed
  if (error.stack) {
    console.error(error.stack);
  }

  return jsonResponse(
    {
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
    },
    500,
    origin
  );
}
