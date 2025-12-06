/**
 * Admin routes - user management, data export/purge
 */
import { Env, User, jsonResponse, hashPin } from '../utils';

// ============================================
// USER MANAGEMENT
// ============================================

export async function handleGetUsers(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  const users = await env.DB.prepare(`
    SELECT id, email, name, role, created_at,
      (SELECT MAX(clock_in) FROM time_entries WHERE user_id = users.id) as last_activity
    FROM users
    ORDER BY name ASC
  `).all();

  return jsonResponse({ users: users.results }, 200, origin);
}

export async function handleCreateUser(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  const { name, email, pin, role } = await request.json() as {
    name: string;
    email: string;
    pin: string;
    role?: 'admin' | 'worker';
  };

  if (!name || !email || !pin) {
    return jsonResponse({ error: 'Name, email, and PIN required' }, 400, origin);
  }

  const pinHash = await hashPin(pin);

  try {
    const result = await env.DB.prepare(
      'INSERT INTO users (name, email, pin_hash, role) VALUES (?, ?, ?, ?) RETURNING id, email, name, role, created_at'
    ).bind(name, email, pinHash, role || 'worker').first();

    return jsonResponse({ user: result }, 201, origin);
  } catch (e: any) {
    if (e.message?.includes('UNIQUE constraint')) {
      return jsonResponse({ error: 'Email already exists' }, 400, origin);
    }
    throw e;
  }
}

export async function handleUpdateUser(
  userId: string,
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  const { name, email, role } = await request.json() as {
    name?: string;
    email?: string;
    role?: 'admin' | 'worker';
  };

  const result = await env.DB.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        role = COALESCE(?, role),
        updated_at = datetime('now')
    WHERE id = ?
    RETURNING id, email, name, role, created_at
  `).bind(name || null, email || null, role || null, userId).first();

  if (!result) {
    return jsonResponse({ error: 'User not found' }, 404, origin);
  }

  return jsonResponse({ user: result }, 200, origin);
}

export async function handleResetUserPin(
  userId: string,
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  const { newPin } = await request.json() as { newPin: string };

  if (!newPin) {
    return jsonResponse({ error: 'New PIN required' }, 400, origin);
  }

  if (newPin.length < 4 || newPin.length > 6) {
    return jsonResponse({ error: 'PIN must be 4-6 digits' }, 400, origin);
  }

  const pinHash = await hashPin(newPin);
  const result = await env.DB.prepare(
    'UPDATE users SET pin_hash = ?, updated_at = datetime("now") WHERE id = ? RETURNING id, name, email'
  ).bind(pinHash, userId).first();

  if (!result) {
    return jsonResponse({ error: 'User not found' }, 404, origin);
  }

  return jsonResponse({ success: true, user: result }, 200, origin);
}

// ============================================
// STATISTICS
// ============================================

export async function handleGetGlobalStats(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  const stats = await env.DB.batch([
    env.DB.prepare(`SELECT COUNT(*) as count FROM time_entries`),
    env.DB.prepare(`SELECT COUNT(*) as count FROM schedule_blocks`),
    env.DB.prepare(`SELECT COUNT(*) as count FROM xp_transactions`),
    env.DB.prepare(`SELECT COUNT(*) as count FROM projects`),
  ]);

  return jsonResponse({
    totalTimeEntries: (stats[0].results[0] as any)?.count || 0,
    totalBlocks: (stats[1].results[0] as any)?.count || 0,
    totalXpTransactions: (stats[2].results[0] as any)?.count || 0,
    totalNotes: (stats[3].results[0] as any)?.count || 0,
    storageUsed: 'N/A',
  }, 200, origin);
}

export async function handleGetUserStats(
  userId: string,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  const stats = await env.DB.batch([
    env.DB.prepare(`SELECT COUNT(*) as count FROM time_entries WHERE user_id = ?`).bind(userId),
    env.DB.prepare(`SELECT COUNT(*) as count FROM schedule_blocks WHERE user_id = ?`).bind(userId),
    env.DB.prepare(`SELECT COUNT(*) as count FROM xp_transactions WHERE user_id = ?`).bind(userId),
  ]);

  return jsonResponse({
    totalTimeEntries: (stats[0].results[0] as any)?.count || 0,
    totalBlocks: (stats[1].results[0] as any)?.count || 0,
    totalXpTransactions: (stats[2].results[0] as any)?.count || 0,
    totalNotes: 0,
    storageUsed: 'N/A',
  }, 200, origin);
}

// ============================================
// ADMIN ENTRIES
// ============================================

export async function handleGetAllEntries(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  const result = await env.DB.prepare(`
    SELECT te.*, 
      u.name as user_name, u.email as user_email,
      p.name as project_name, p.color as project_color
    FROM time_entries te
    JOIN users u ON te.user_id = u.id
    LEFT JOIN projects p ON te.project_id = p.id
    ORDER BY te.clock_in DESC
    LIMIT 200
  `).all();

  return jsonResponse({ entries: result.results }, 200, origin);
}

// ============================================
// DATA EXPORT
// ============================================

export async function handleExportUserData(
  userId: string,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  const [userInfo, timeEntries, blocks, xpTxs, gamification] = await Promise.all([
    env.DB.prepare(`SELECT id, email, name, role, created_at FROM users WHERE id = ?`).bind(userId).first(),
    env.DB.prepare(`SELECT * FROM time_entries WHERE user_id = ?`).bind(userId).all(),
    env.DB.prepare(`SELECT * FROM schedule_blocks WHERE user_id = ?`).bind(userId).all(),
    env.DB.prepare(`SELECT * FROM xp_transactions WHERE user_id = ?`).bind(userId).all(),
    env.DB.prepare(`SELECT * FROM user_gamification WHERE user_id = ?`).bind(userId).first(),
  ]);

  return jsonResponse({
    exportedAt: new Date().toISOString(),
    scope: `User: ${(userInfo as any)?.name || 'Unknown'}`,
    user: userInfo,
    timeEntries: timeEntries.results,
    blocks: blocks.results,
    xpTransactions: xpTxs.results,
    gamification: gamification,
  }, 200, origin);
}

export async function handleExportAllData(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  const [users, timeEntries, blocks, xpTxs, gamification, projects] = await Promise.all([
    env.DB.prepare(`SELECT id, email, name, role, created_at FROM users`).all(),
    env.DB.prepare(`SELECT * FROM time_entries`).all(),
    env.DB.prepare(`SELECT * FROM schedule_blocks`).all(),
    env.DB.prepare(`SELECT * FROM xp_transactions`).all(),
    env.DB.prepare(`SELECT * FROM user_gamification`).all(),
    env.DB.prepare(`SELECT * FROM projects`).all(),
  ]);

  return jsonResponse({
    exportedAt: new Date().toISOString(),
    scope: 'Global',
    users: users.results,
    timeEntries: timeEntries.results,
    blocks: blocks.results,
    xpTransactions: xpTxs.results,
    gamification: gamification.results,
    projects: projects.results,
  }, 200, origin);
}

// ============================================
// DATA PURGE
// ============================================

export async function handlePurgeUserData(
  userId: string,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  // Delete user data but preserve the user account
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM time_entries WHERE user_id = ?`).bind(userId),
    env.DB.prepare(`DELETE FROM schedule_blocks WHERE user_id = ?`).bind(userId),
    env.DB.prepare(`DELETE FROM xp_transactions WHERE user_id = ?`).bind(userId),
    env.DB.prepare(`DELETE FROM user_gamification WHERE user_id = ?`).bind(userId),
  ]);

  return jsonResponse({
    success: true,
    message: `All data for user ${userId} has been purged`,
  }, 200, origin);
}

export async function handlePurgeAllData(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  // Delete all data but preserve user accounts
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM time_entries`),
    env.DB.prepare(`DELETE FROM schedule_blocks`),
    env.DB.prepare(`DELETE FROM xp_transactions`),
    env.DB.prepare(`DELETE FROM user_gamification`),
    // Keep projects but clear assignments
    env.DB.prepare(`UPDATE projects SET description = NULL`),
  ]);

  return jsonResponse({
    success: true,
    message: 'All database data has been purged. User accounts preserved.',
  }, 200, origin);
}
