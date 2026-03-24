import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const todoCounts = await db
      .prepare(
        `SELECT
           COUNT(*) AS total_items,
           SUM(CASE WHEN is_checked = 1 THEN 1 ELSE 0 END) AS checked_items
         FROM todo_items
         WHERE deleted_at IS NULL`
      )
      .first<{ total_items: number; checked_items: number | null }>();

    const routinesStarted = await db
      .prepare(
        `SELECT COUNT(*) AS started
         FROM routine_runs
         WHERE date(started_at) = date('now')`
      )
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
