/**
 * DigiArtifact Workers API - Main Entry Point
 * Cloudflare Worker for time tracking backend
 *
 * Architecture:
 * - Hono router with middleware pipeline (CORS, Auth, Error handling)
 * - Modular route handlers in src/routes/
 * - Drizzle ORM for type-safe database queries
 */

import { Env } from './types/env';
import app from './router';

export { Env } from './types/env';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return app.fetch(request, env);
  },
};
