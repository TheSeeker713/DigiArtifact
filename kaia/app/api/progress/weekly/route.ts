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
    const events = await db
      .prepare(
        `SELECT date(created_at) AS day, COUNT(*) AS completions
         FROM analytics_events
         WHERE profile_id = ?
           AND event_name = 'item_checked'
           AND datetime(created_at) >= datetime('now', '-7 days')
         GROUP BY date(created_at)
         ORDER BY day ASC`
      )
      .bind(user.id)
      .all<{ day: string; completions: number }>();

    return NextResponse.json({
      weekly: events.results ?? [],
    });
  } catch (error) {
    console.error("Failed to load weekly progress", error);
    return NextResponse.json({ error: "Failed to load weekly progress." }, { status: 500 });
  }
}
