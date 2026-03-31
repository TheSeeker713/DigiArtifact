import { getDb } from "@/lib/db";
import { ensureCoreSchema } from "@/lib/schema";

const FALLBACK_CHECKLIST_ITEMS: Array<{
  section: string;
  label: string;
  sortOrder: number;
}> = [
  { section: "Bathroom", label: "wall paper", sortOrder: 1 },
  { section: "Bathroom", label: "shelf", sortOrder: 2 },
  { section: "Bathroom", label: "bathtub", sortOrder: 3 },
  { section: "Bathroom", label: "shower curtain", sortOrder: 4 },
  { section: "Bathroom", label: "sweep and mop", sortOrder: 5 },
  { section: "Bathroom", label: "hang picture", sortOrder: 6 },
  { section: "Kitchen", label: "clean fan thingy", sortOrder: 1 },
  { section: "Kitchen", label: "water removed from top of fridge", sortOrder: 2 },
  { section: "Kitchen", label: "sweep and mop", sortOrder: 3 },
  { section: "Kitchen", label: "bake a cake", sortOrder: 4 },
  { section: "Living Room", label: "charging extension cord", sortOrder: 1 },
  { section: "Living Room", label: "desk area cleaned", sortOrder: 2 },
  { section: "Living Room", label: "weights moved to desk area", sortOrder: 3 },
  { section: "Living Room", label: "dust", sortOrder: 4 },
  { section: "Living Room", label: "put away jackets", sortOrder: 5 },
  { section: "Living Room", label: "fix rack", sortOrder: 6 },
  { section: "Living Room", label: "add hat pegs", sortOrder: 7 },
  { section: "Main Bedroom", label: "move things to bathroom", sortOrder: 1 },
  { section: "Main Bedroom", label: "sweep", sortOrder: 2 },
  { section: "Main Bedroom", label: "vacuum", sortOrder: 3 },
  { section: "Main Bedroom", label: "mop", sortOrder: 4 },
  { section: "Main Bedroom", label: "dust", sortOrder: 5 },
  { section: "Main Bedroom", label: "wash bedding", sortOrder: 6 },
];

export async function ensureUserBootstrap(userId: string) {
  await ensureCoreSchema();
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

    const seededCount = await db
      .prepare("SELECT COUNT(*) AS count FROM todo_items WHERE list_id = ? AND deleted_at IS NULL")
      .bind(listId)
      .first<{ count: number }>();

    if (Number(seededCount?.count ?? 0) === 0) {
      for (const item of FALLBACK_CHECKLIST_ITEMS) {
        await db
          .prepare(
            `INSERT INTO todo_items (
               id, list_id, section, label, sort_order, is_checked, created_at, updated_at
             )
             VALUES (?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))`
          )
          .bind(
            lowerHexUuid(),
            listId,
            item.section,
            item.label,
            item.sortOrder
          )
          .run();
      }
    }
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

function lowerHexUuid() {
  return crypto.randomUUID().replace(/-/g, "").toLowerCase();
}
