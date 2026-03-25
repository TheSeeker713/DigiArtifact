import { getDb } from "@/lib/db";

export async function ensureUserBootstrap(userId: string) {
  const db = getDb();
  const existingMembership = await db
    .prepare(
      `SELECT list_id
       FROM todo_list_members
       WHERE user_id = ?
       LIMIT 1`
    )
    .bind(userId)
    .first<{ list_id: string }>();

  if (!existingMembership) {
    const listId = `home_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    await db
      .prepare(
        `INSERT INTO todo_lists (id, name, sort_order, created_at, updated_at)
         VALUES (?, 'Home Checklist', 0, datetime('now'), datetime('now'))`
      )
      .bind(listId)
      .run();
    await db
      .prepare(
        `INSERT INTO todo_list_members (list_id, user_id, role, created_at)
         VALUES (?, ?, 'owner', datetime('now'))`
      )
      .bind(listId, userId)
      .run();

    await db
      .prepare(
        `INSERT INTO todo_items (
           id, list_id, section, label, sort_order, is_checked, created_at, updated_at
         )
         SELECT
           lower(hex(randomblob(16))),
           ?,
           section,
           label,
           sort_order,
           is_checked,
           datetime('now'),
           datetime('now')
         FROM checklist_archive_items
         WHERE archive_set_id = 'seed_v1'`
      )
      .bind(listId)
      .run();
  }

  const routineMembership = await db
    .prepare(
      `SELECT routine_id
       FROM user_routines
       WHERE user_id = ?
       LIMIT 1`
    )
    .bind(userId)
    .first<{ routine_id: string }>();

  if (!routineMembership) {
    const routineId = `routine_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    await db
      .prepare(
        `INSERT INTO routines (id, name, schedule_window, is_active, created_at, updated_at)
         VALUES (?, 'Home Checklist Routine', 'anytime', 1, datetime('now'), datetime('now'))`
      )
      .bind(routineId)
      .run();
    await db
      .prepare(
        `INSERT INTO routine_steps (
           id, routine_id, label, sort_order, duration_minutes, created_at, updated_at
         )
         VALUES
           (?, ?, 'Pick one room card', 0, 3, datetime('now'), datetime('now')),
           (?, ?, 'Complete one checklist item', 1, 5, datetime('now'), datetime('now')),
           (?, ?, 'Mark it done and hydrate', 2, 2, datetime('now'), datetime('now'))`
      )
      .bind(
        `step_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
        routineId,
        `step_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
        routineId,
        `step_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
        routineId
      )
      .run();
    await db
      .prepare(
        `INSERT INTO user_routines (routine_id, user_id, created_at)
         VALUES (?, ?, datetime('now'))`
      )
      .bind(routineId, userId)
      .run();
  }

  await db
    .prepare(
      `INSERT OR IGNORE INTO gamification_state (
         profile_id, xp, level, momentum, streak_days, freeze_tokens, updated_at
       )
       VALUES (?, 0, 1, 0, 0, 1, datetime('now'))`
    )
    .bind(userId)
    .run();
}
