import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const events = await db
      .prepare(
        `SELECT date(created_at) AS day, COUNT(*) AS completions
         FROM analytics_events
         WHERE event_name = 'item_checked'
           AND datetime(created_at) >= datetime('now', '-7 days')
         GROUP BY date(created_at)
         ORDER BY day ASC`
      )
      .all<{ day: string; completions: number }>();

    return NextResponse.json({
      weekly: events.results ?? [],
    });
  } catch (error) {
    console.error("Failed to load weekly progress", error);
    return NextResponse.json({ error: "Failed to load weekly progress." }, { status: 500 });
  }
}
