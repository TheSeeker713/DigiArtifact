/**
 * User profile routes
 */
import { Env, User, jsonResponse, hashPin } from '../utils';

export async function handleGetProfile(
  user: User,
  origin: string
): Promise<Response> {
  return jsonResponse({ user }, 200, origin);
}

export async function handleChangePin(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const { currentPin, newPin } = await request.json() as {
    currentPin: string;
    newPin: string;
  };

  if (!currentPin || !newPin) {
    return jsonResponse({ error: 'Current PIN and new PIN required' }, 400, origin);
  }

  if (newPin.length < 4 || newPin.length > 6) {
    return jsonResponse({ error: 'PIN must be 4-6 digits' }, 400, origin);
  }

  // Verify current PIN
  const currentPinHash = await hashPin(currentPin);
  const verified = await env.DB.prepare(
    'SELECT id FROM users WHERE id = ? AND pin_hash = ?'
  ).bind(user.id, currentPinHash).first();

  if (!verified) {
    return jsonResponse({ error: 'Current PIN is incorrect' }, 401, origin);
  }

  // Update to new PIN
  const newPinHash = await hashPin(newPin);
  await env.DB.prepare(
    'UPDATE users SET pin_hash = ?, updated_at = datetime("now") WHERE id = ?'
  ).bind(newPinHash, user.id).run();

  return jsonResponse({ success: true, message: 'PIN updated successfully' }, 200, origin);
}
