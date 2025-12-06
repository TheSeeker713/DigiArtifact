/**
 * Authentication routes
 */
import { Env, User, createJWT, hashPin, jsonResponse } from '../utils';

export async function handleAuthLogin(
  request: Request,
  env: Env,
  origin: string
): Promise<Response> {
  const { email, pin } = await request.json() as { email: string; pin: string };
  
  if (!email || !pin) {
    return jsonResponse({ error: 'Email and PIN required' }, 400, origin);
  }

  const pinHash = await hashPin(pin);
  const user = await env.DB.prepare(
    'SELECT id, email, name, role FROM users WHERE email = ? AND pin_hash = ? AND active = 1'
  ).bind(email, pinHash).first<User>();

  if (!user) {
    return jsonResponse({ error: 'Invalid credentials' }, 401, origin);
  }

  const token = await createJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  }, env.JWT_SECRET);

  return jsonResponse({ token, user }, 200, origin);
}
