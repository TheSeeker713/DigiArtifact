/**
 * Clock and break management routes
 */
import { Env, User, jsonResponse } from '../utils';

export async function handleClockStatus(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const entry = await env.DB.prepare(`
    SELECT te.*, p.name as project_name, p.color as project_color
    FROM time_entries te
    LEFT JOIN projects p ON te.project_id = p.id
    WHERE te.user_id = ? AND te.clock_out IS NULL
    ORDER BY te.clock_in DESC
    LIMIT 1
  `).bind(user.id).first();

  if (!entry) {
    return jsonResponse({ status: 'clocked-out', currentEntry: null }, 200, origin);
  }

  // Check if on break
  const activeBreak = await env.DB.prepare(`
    SELECT * FROM breaks WHERE time_entry_id = ? AND end_time IS NULL
  `).bind(entry.id).first();

  return jsonResponse({
    status: activeBreak ? 'on-break' : 'clocked-in',
    currentEntry: entry,
  }, 200, origin);
}

export async function handleClockIn(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const { project_id } = await request.json() as { project_id?: number };

  // Check if already clocked in
  const existing = await env.DB.prepare(
    'SELECT id FROM time_entries WHERE user_id = ? AND clock_out IS NULL'
  ).bind(user.id).first();

  if (existing) {
    return jsonResponse({ error: 'Already clocked in' }, 400, origin);
  }

  const result = await env.DB.prepare(
    'INSERT INTO time_entries (user_id, project_id, clock_in) VALUES (?, ?, datetime("now")) RETURNING *'
  ).bind(user.id, project_id || null).first();

  return jsonResponse({ entry: result }, 201, origin);
}

export async function handleClockOut(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const { notes } = await request.json() as { notes?: string };

  // End any active break first
  await env.DB.prepare(`
    UPDATE breaks SET end_time = datetime('now')
    WHERE time_entry_id IN (
      SELECT id FROM time_entries WHERE user_id = ? AND clock_out IS NULL
    ) AND end_time IS NULL
  `).bind(user.id).run();

  // Calculate total break minutes
  const entry = await env.DB.prepare(
    'SELECT id FROM time_entries WHERE user_id = ? AND clock_out IS NULL'
  ).bind(user.id).first<{ id: number }>();

  if (!entry) {
    return jsonResponse({ error: 'Not clocked in' }, 400, origin);
  }

  const breakTotal = await env.DB.prepare(`
    SELECT COALESCE(SUM(
      (julianday(COALESCE(end_time, datetime('now'))) - julianday(start_time)) * 24 * 60
    ), 0) as total
    FROM breaks WHERE time_entry_id = ?
  `).bind(entry.id).first<{ total: number }>();

  const result = await env.DB.prepare(`
    UPDATE time_entries 
    SET clock_out = datetime('now'), notes = ?, break_minutes = ?, updated_at = datetime('now')
    WHERE id = ?
    RETURNING *
  `).bind(notes || null, Math.round(breakTotal?.total || 0), entry.id).first();

  return jsonResponse({ entry: result }, 200, origin);
}

export async function handleBreakStart(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const entry = await env.DB.prepare(
    'SELECT id FROM time_entries WHERE user_id = ? AND clock_out IS NULL'
  ).bind(user.id).first<{ id: number }>();

  if (!entry) {
    return jsonResponse({ error: 'Not clocked in' }, 400, origin);
  }

  // Check if already on break
  const activeBreak = await env.DB.prepare(
    'SELECT id FROM breaks WHERE time_entry_id = ? AND end_time IS NULL'
  ).bind(entry.id).first();

  if (activeBreak) {
    return jsonResponse({ error: 'Already on break' }, 400, origin);
  }

  const result = await env.DB.prepare(
    'INSERT INTO breaks (time_entry_id, start_time) VALUES (?, datetime("now")) RETURNING *'
  ).bind(entry.id).first();

  return jsonResponse({ break: result }, 201, origin);
}

export async function handleBreakEnd(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const entry = await env.DB.prepare(
    'SELECT id FROM time_entries WHERE user_id = ? AND clock_out IS NULL'
  ).bind(user.id).first<{ id: number }>();

  if (!entry) {
    return jsonResponse({ error: 'Not clocked in' }, 400, origin);
  }

  const result = await env.DB.prepare(`
    UPDATE breaks SET end_time = datetime('now')
    WHERE time_entry_id = ? AND end_time IS NULL
    RETURNING *
  `).bind(entry.id).first();

  if (!result) {
    return jsonResponse({ error: 'Not on break' }, 400, origin);
  }

  return jsonResponse({ break: result }, 200, origin);
}
