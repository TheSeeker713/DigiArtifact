import { getDb } from "@/lib/db";

export const ANON_PROFILE_ID = "anonymous";

export async function trackAnalyticsEvent(
  eventName: string,
  metadata: Record<string, unknown> = {},
  profileId = ANON_PROFILE_ID
) {
  const db = getDb();
  await db
    .prepare(
      `INSERT INTO analytics_events (profile_id, event_name, metadata, created_at)
       VALUES (?, ?, ?, datetime('now'))`
    )
    .bind(profileId, eventName, JSON.stringify(metadata))
    .run();
}

export async function recordGamificationEvent(
  eventType: string,
  deltaXp: number,
  metadata: Record<string, unknown> = {},
  profileId = ANON_PROFILE_ID
) {
  const db = getDb();
  await db
    .prepare(
      `INSERT INTO gamification_events (profile_id, event_type, delta_xp, metadata, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
    .bind(profileId, eventType, deltaXp, JSON.stringify(metadata))
    .run();

  await db
    .prepare(
      `UPDATE gamification_state
       SET
         xp = xp + ?,
         momentum = CASE
           WHEN ? > 0 THEN momentum + 1
           ELSE momentum
         END,
         level = ((xp + ?) / 100) + 1,
         updated_at = datetime('now')
       WHERE profile_id = ?`
    )
    .bind(deltaXp, deltaXp, deltaXp, profileId)
    .run();
}
