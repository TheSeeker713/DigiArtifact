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
    const topSection = await db
      .prepare(
        `SELECT section, COUNT(*) AS completions
         FROM todo_items i
         INNER JOIN todo_list_members m ON m.list_id = i.list_id
         WHERE i.is_checked = 1
           AND i.deleted_at IS NULL
           AND i.section IS NOT NULL
           AND m.user_id = ?
         GROUP BY section
         ORDER BY completions DESC
         LIMIT 1`
      )
      .bind(user.id)
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
