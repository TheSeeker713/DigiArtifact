/**
 * Statistics routes
 */
import { Env, User, jsonResponse } from '../utils';

export async function handleWeeklyStats(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const result = await env.DB.prepare(`
    WITH RECURSIVE dates(d, dow) AS (
      SELECT date('now', 'weekday 0', '-6 days'), 0
      UNION ALL
      SELECT date(d, '+1 day'), dow + 1 FROM dates WHERE dow < 6
    )
    SELECT 
      dates.dow,
      COALESCE(SUM(
        (julianday(COALESCE(te.clock_out, datetime('now'))) - julianday(te.clock_in)) * 24 - te.break_minutes / 60.0
      ), 0) as hours
    FROM dates
    LEFT JOIN time_entries te ON date(te.clock_in) = dates.d AND te.user_id = ?
    GROUP BY dates.dow
    ORDER BY dates.dow
  `).bind(user.id).all();

  const hours = result.results.map((r: any) => Math.max(0, r.hours));

  return jsonResponse({ hours }, 200, origin);
}

export async function handleMonthlyStats(
  url: URL,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

  const entries = await env.DB.prepare(`
    SELECT 
      date(clock_in) as date,
      SUM((julianday(COALESCE(clock_out, datetime('now'))) - julianday(clock_in)) * 24 - break_minutes / 60.0) as hours
    FROM time_entries
    WHERE user_id = ? AND strftime('%Y-%m', clock_in) = ?
    GROUP BY date(clock_in)
  `).bind(user.id, month).all();

  const projectBreakdown = await env.DB.prepare(`
    SELECT 
      COALESCE(p.name, 'No Project') as name,
      COALESCE(p.color, '#94a3b8') as color,
      SUM((julianday(COALESCE(te.clock_out, datetime('now'))) - julianday(te.clock_in)) * 24 - te.break_minutes / 60.0) as hours
    FROM time_entries te
    LEFT JOIN projects p ON te.project_id = p.id
    WHERE te.user_id = ? AND strftime('%Y-%m', te.clock_in) = ?
    GROUP BY te.project_id
  `).bind(user.id, month).all();

  const totalHours = entries.results.reduce((sum: number, e: any) => sum + Math.max(0, e.hours), 0);
  const daysWorked = entries.results.filter((e: any) => e.hours > 0).length;

  return jsonResponse({
    totalHours,
    totalEntries: entries.results.length,
    averagePerDay: daysWorked > 0 ? totalHours / daysWorked : 0,
    projectBreakdown: projectBreakdown.results.map((p: any) => ({
      name: p.name,
      color: p.color,
      hours: Math.max(0, p.hours),
    })),
    dailyHours: entries.results.map((e: any) => ({
      date: e.date,
      hours: Math.max(0, e.hours),
    })),
  }, 200, origin);
}
