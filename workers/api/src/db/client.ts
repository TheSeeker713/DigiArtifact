/**
 * Drizzle ORM Client for Cloudflare D1
 */

import { drizzle } from 'drizzle-orm/d1';
import { Env } from '../types/env';
import * as schema from './schema';

/**
 * Get a Drizzle database client for the given D1 database
 */
export function getDb(env: Env) {
  return drizzle(env.DB, { schema });
}

/**
 * Export schema for use in migrations and queries
 */
export { schema };

