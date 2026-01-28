/**
 * Time entries routes
 * Refactored to use Drizzle ORM for type safety
 */
import { Env, User } from '../types/env';
import { jsonResponse } from '../utils/responses';
import { getDb } from '../db/client';
import { timeEntries, projects } from '../db/schema';
import { eq, desc, and, sql, between, or } from 'drizzle-orm';
import { XP_REWARDS } from '../constants';

export async function handleGetEntries(
  url: URL,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const db = getDb(env);
  const date = url.searchParams.get('date');
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  // Build where conditions
  const conditions = [eq(timeEntries.userId, user.id)];

  if (date) {
    conditions.push(sql`date(${timeEntries.clockIn}) = ${date}`);
  } else if (start && end) {
    conditions.push(sql`date(${timeEntries.clockIn}) BETWEEN ${start} AND ${end}`);
  }

  const result = await db
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
    .where(and(...conditions))
    .orderBy(desc(timeEntries.clockIn))
    .limit(100);

  return jsonResponse({ entries: result }, 200, origin);
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

  const db = getDb(env);
  await db.delete(timeEntries).where(eq(timeEntries.id, parseInt(entryId)));

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

  const db = getDb(env);

  // Get the old entry to check if notes are being added
  const oldEntryResult = await db
    .select({ notes: timeEntries.notes })
    .from(timeEntries)
    .where(eq(timeEntries.id, parseInt(entryId)))
    .limit(1);

  const oldEntry = oldEntryResult[0];

  // Build update object with only provided fields
  const updateData: any = {
    updatedAt: sql`datetime('now')`,
  };

  if (clock_in !== undefined) updateData.clockIn = clock_in;
  if (clock_out !== undefined) updateData.clockOut = clock_out;
  if (project_id !== undefined) updateData.projectId = project_id;
  if (notes !== undefined) updateData.notes = notes;
  if (break_minutes !== undefined) updateData.breakMinutes = break_minutes;

  const result = await db
    .update(timeEntries)
    .set(updateData)
    .where(eq(timeEntries.id, parseInt(entryId)))
    .returning();

  if (result.length === 0) {
    return jsonResponse({ error: 'Entry not found' }, 404, origin);
  }

  // Award XP if notes were added (or updated with new notes)
  if (notes !== undefined && notes && !oldEntry?.notes) {
    const xpAmount = XP_REWARDS.NOTE_ADDED;
    try {
      await env.DB.prepare(`
        INSERT INTO user_gamification (user_id, total_xp, level, current_streak, updated_at)
        VALUES (?, ?, 1, 0, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          total_xp = total_xp + excluded.total_xp,
          updated_at = CURRENT_TIMESTAMP
      `).bind(user.id, xpAmount).run();

      // Log XP transaction
      await env.DB.prepare(`
        INSERT INTO xp_transactions (user_id, amount, reason, action_type)
        VALUES (?, ?, ?, ?)
      `).bind(user.id, xpAmount, 'Note added to time entry', 'NOTE_ADDED').run();
    } catch (error) {
      console.error(`Failed to award XP for note added for user ${user.id}:`, error);
      // Don't fail the request if XP award fails
    }
  }

  return jsonResponse({ entry: result[0] }, 200, origin);
}
