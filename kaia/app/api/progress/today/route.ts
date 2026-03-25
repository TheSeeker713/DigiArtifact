import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const todoCounts = await db
      .prepare(
        `SELECT
           COUNT(*) AS total_items,
           SUM(CASE WHEN is_checked = 1 THEN 1 ELSE 0 END) AS checked_items
         FROM todo_items i
         INNER JOIN todo_list_members m ON m.list_id = i.list_id
         WHERE i.deleted_at IS NULL
           AND m.user_id = ?`
      )
      .bind(user.id)
      .first<{ total_items: number; checked_items: number | null }>();

    const routinesStarted = await db
      .prepare(
        `SELECT COUNT(*) AS started
         FROM user_routine_runs urr
         INNER JOIN routine_runs rr ON rr.id = urr.run_id
         WHERE urr.user_id = ?
           AND date(rr.started_at) = date('now')`
      )
      .bind(user.id)
      .first<{ started: number }>();

    return NextResponse.json({
      today: {
        totalItems: Number(todoCounts?.total_items ?? 0),
        checkedItems: Number(todoCounts?.checked_items ?? 0),
        routinesStarted: Number(routinesStarted?.started ?? 0),
      },
    });
  } catch (error) {
    console.error("Failed to load today progress", error);
    return NextResponse.json({ error: "Failed to load today progress." }, { status: 500 });
  }
}
