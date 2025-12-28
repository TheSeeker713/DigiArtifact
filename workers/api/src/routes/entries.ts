/**
 * Time entries routes
 * Refactored to use Drizzle ORM for type safety
 */
import { Env, User } from '../types/env';
import { jsonResponse } from '../utils/responses';
import { getDb } from '../db/client';
import { timeEntries, projects } from '../db/schema';
import { eq, desc, and, sql, between, or } from 'drizzle-orm';

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

  return jsonResponse({ entry: result[0] }, 200, origin);
}
