/**
 * Clock and break management routes
 * Refactored to use Drizzle ORM for type safety
 */
import { Env, User } from '../types/env';
import { jsonResponse } from '../utils/responses';
import { getDb } from '../db/client';
import { timeEntries, breaks, projects } from '../db/schema';
import { eq, isNull, desc, sql, and } from 'drizzle-orm';

export async function handleClockStatus(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const db = getDb(env);

  // Get current active time entry with project info
  const entryResult = await db
    .select({
      id: timeEntries.id,
      userId: timeEntries.userId,
      projectId: timeEntries.projectId,
      clockIn: timeEntries.clockIn,
      clockOut: timeEntries.clockOut,
      breakMinutes: timeEntries.breakMinutes,
      notes: timeEntries.notes,
      createdAt: timeEntries.createdAt,
      updatedAt: timeEntries.updatedAt,
      projectName: projects.name,
      projectColor: projects.color,
    })
    .from(timeEntries)
    .leftJoin(projects, eq(timeEntries.projectId, projects.id))
    .where(and(eq(timeEntries.userId, user.id), isNull(timeEntries.clockOut)))
    .orderBy(desc(timeEntries.clockIn))
    .limit(1);

  const entry = entryResult[0];

  if (!entry) {
    return jsonResponse({ status: 'clocked-out', currentEntry: null }, 200, origin);
  }

  // Check if on break
  const activeBreakResult = await db
    .select()
    .from(breaks)
    .where(and(eq(breaks.timeEntryId, entry.id), isNull(breaks.endTime)))
    .limit(1);

  const activeBreak = activeBreakResult[0];

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
  const db = getDb(env);

  // Check if already clocked in
  const existing = await db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, user.id), isNull(timeEntries.clockOut)))
    .limit(1);

  if (existing.length > 0) {
    return jsonResponse({ error: 'Already clocked in' }, 400, origin);
  }

  // Insert new time entry
  const result = await db
    .insert(timeEntries)
    .values({
      userId: user.id,
      projectId: project_id || null,
      clockIn: sql`datetime('now')`,
    })
    .returning();

  return jsonResponse({ entry: result[0] }, 201, origin);
}

export async function handleClockOut(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const { notes } = await request.json() as { notes?: string };
  const db = getDb(env);

  // Get current active time entry
  const entryResult = await db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, user.id), isNull(timeEntries.clockOut)))
    .limit(1);

  const entry = entryResult[0];

  if (!entry) {
    return jsonResponse({ error: 'Not clocked in' }, 400, origin);
  }

  // End any active breaks first
  await db
    .update(breaks)
    .set({ endTime: sql`datetime('now')` })
    .where(
      and(
        eq(breaks.timeEntryId, entry.id),
        isNull(breaks.endTime)
      )
    );

  // Calculate total break minutes using raw SQL for the complex calculation
  // Access underlying D1 database for complex SQL queries
  const breakTotalResult = await env.DB.prepare(`
    SELECT COALESCE(SUM(
      (julianday(COALESCE(end_time, datetime('now'))) - julianday(start_time)) * 24 * 60
    ), 0) as total
    FROM breaks WHERE time_entry_id = ?
  `).bind(entry.id).first<{ total: number }>();

  const breakTotal = breakTotalResult?.total || 0;

  // Update time entry
  const result = await db
    .update(timeEntries)
    .set({
      clockOut: sql`datetime('now')`,
      notes: notes || null,
      breakMinutes: Math.round(breakTotal),
      updatedAt: sql`datetime('now')`,
    })
    .where(eq(timeEntries.id, entry.id))
    .returning();

  return jsonResponse({ entry: result[0] }, 200, origin);
}

export async function handleBreakStart(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const db = getDb(env);

  // Get current active time entry
  const entryResult = await db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, user.id), isNull(timeEntries.clockOut)))
    .limit(1);

  const entry = entryResult[0];

  if (!entry) {
    return jsonResponse({ error: 'Not clocked in' }, 400, origin);
  }

  // Check if already on break
  const activeBreakResult = await db
    .select({ id: breaks.id })
    .from(breaks)
    .where(and(eq(breaks.timeEntryId, entry.id), isNull(breaks.endTime)))
    .limit(1);

  if (activeBreakResult.length > 0) {
    return jsonResponse({ error: 'Already on break' }, 400, origin);
  }

  // Insert new break
  const result = await db
    .insert(breaks)
    .values({
      timeEntryId: entry.id,
      startTime: sql`datetime('now')`,
    })
    .returning();

  return jsonResponse({ break: result[0] }, 201, origin);
}

export async function handleBreakEnd(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const db = getDb(env);

  // Get current active time entry
  const entryResult = await db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, user.id), isNull(timeEntries.clockOut)))
    .limit(1);

  const entry = entryResult[0];

  if (!entry) {
    return jsonResponse({ error: 'Not clocked in' }, 400, origin);
  }

  // End the active break
  const result = await db
    .update(breaks)
    .set({ endTime: sql`datetime('now')` })
    .where(and(eq(breaks.timeEntryId, entry.id), isNull(breaks.endTime)))
    .returning();

  if (result.length === 0) {
    return jsonResponse({ error: 'Not on break' }, 400, origin);
  }

  return jsonResponse({ break: result[0] }, 200, origin);
}
