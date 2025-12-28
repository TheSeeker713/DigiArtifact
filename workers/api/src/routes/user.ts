/**
 * User profile routes
 */
import { Env, User, jsonResponse } from '../utils';

export async function handleGetProfile(
  user: User,
  origin: string
): Promise<Response> {
  return jsonResponse({ user }, 200, origin);
}


