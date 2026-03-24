import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const topSection = await db
      .prepare(
        `SELECT section, COUNT(*) AS completions
         FROM todo_items
         WHERE is_checked = 1
           AND deleted_at IS NULL
           AND section IS NOT NULL
         GROUP BY section
         ORDER BY completions DESC
         LIMIT 1`
      )
      .first<{ section: string | null; completions: number }>();

    const suggestion = topSection?.section
      ? `You usually finish ${topSection.section} items. Start there for a quick win.`
      : "Start with one tiny item to build momentum.";

    return NextResponse.json({
      suggestion,
      topSection: topSection?.section ?? null,
    });
  } catch (error) {
    console.error("Failed to load personalization", error);
    return NextResponse.json({ error: "Failed to load personalization." }, { status: 500 });
  }
}
