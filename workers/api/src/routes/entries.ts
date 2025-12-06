/**
 * Time entries routes
 */
import { Env, User, jsonResponse } from '../utils';

export async function handleGetEntries(
  url: URL,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const date = url.searchParams.get('date');
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  let query = `
    SELECT te.*, p.name as project_name, p.color as project_color
    FROM time_entries te
    LEFT JOIN projects p ON te.project_id = p.id
    WHERE te.user_id = ?
  `;
  const params: any[] = [user.id];

  if (date) {
    query += ` AND date(te.clock_in) = ?`;
    params.push(date);
  } else if (start && end) {
    query += ` AND date(te.clock_in) BETWEEN ? AND ?`;
    params.push(start, end);
  }

  query += ` ORDER BY te.clock_in DESC LIMIT 100`;

  const stmt = env.DB.prepare(query);
  const result = await stmt.bind(...params).all();

  return jsonResponse({ entries: result.results }, 200, origin);
}

export async function handleDeleteEntry(
  entryId: string,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  await env.DB.prepare('DELETE FROM time_entries WHERE id = ?').bind(entryId).run();

  return jsonResponse({ success: true }, 200, origin);
}

export async function handleUpdateEntry(
  entryId: string,
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  const { clock_in, clock_out, project_id, notes, break_minutes } = await request.json() as {
    clock_in?: string;
    clock_out?: string;
    project_id?: number | null;
    notes?: string;
    break_minutes?: number;
  };

  const result = await env.DB.prepare(`
    UPDATE time_entries 
    SET clock_in = COALESCE(?, clock_in),
        clock_out = COALESCE(?, clock_out),
        project_id = COALESCE(?, project_id),
        notes = COALESCE(?, notes),
        break_minutes = COALESCE(?, break_minutes),
        updated_at = datetime('now')
    WHERE id = ?
    RETURNING *
  `).bind(clock_in || null, clock_out || null, project_id, notes || null, break_minutes, entryId).first();

  if (!result) {
    return jsonResponse({ error: 'Entry not found' }, 404, origin);
  }

  return jsonResponse({ entry: result }, 200, origin);
}
