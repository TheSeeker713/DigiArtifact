import { getDb } from "@/lib/db";
import { normalizeSortOrder } from "@/lib/checklist";

export type CollabEventType =
  | "item_created"
  | "item_updated"
  | "item_deleted"
  | "item_checked"
  | "list_created"
  | "list_updated"
  | "list_archived";

export async function publishCollabEvent(
  listId: string,
  eventType: CollabEventType,
  entityId: string,
  payload: Record<string, unknown>
) {
  const db = getDb();
  await db
    .prepare(
      `INSERT INTO collab_events (list_id, event_type, entity_id, payload, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
    .bind(listId, eventType, entityId, JSON.stringify(payload))
    .run();
}

export async function loadCollabEventsSince(listId: string, since: number) {
  const db = getDb();
  const safeSince = normalizeSortOrder(since);
  return db
    .prepare(
      `SELECT id, list_id, event_type, entity_id, payload, created_at
       FROM collab_events
       WHERE list_id = ?
         AND id > ?
       ORDER BY id ASC
       LIMIT 200`
    )
    .bind(listId, safeSince)
    .all<{
      id: number;
      list_id: string;
      event_type: CollabEventType;
      entity_id: string;
      payload: string;
      created_at: string;
    }>();
}
