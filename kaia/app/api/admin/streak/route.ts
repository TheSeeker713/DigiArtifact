import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type UpdateStreakBody = {
  currentStreak?: unknown;
  bestStreak?: unknown;
  sprintDay?: unknown;
  sprintStart?: unknown;
  totalXp?: unknown;
  history?: unknown;
  deltaXp?: unknown;
};

function asOptionalInt(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return Math.floor(value);
}

export async function GET(request: NextRequest) {
  try {
    const { unauthorized } = await requireAdmin(request);
    if (unauthorized) {
      return unauthorized;
    }

    const db = getDb();
    const row = await db
      .prepare(
        `SELECT id, current_streak, best_streak, sprint_day, sprint_start, total_xp, history, updated_by, updated_at
         FROM schedule_streak
         WHERE id = 'shared'`
      )
      .first<{
        id: string;
        current_streak: number;
        best_streak: number;
        sprint_day: number;
        sprint_start: string | null;
        total_xp: number;
        history: string;
        updated_by: string | null;
        updated_at: string;
      }>();

    if (!row) {
      return NextResponse.json({ error: "Streak state not initialized." }, { status: 404 });
    }

    return NextResponse.json({
      streak: {
        currentStreak: row.current_streak,
        bestStreak: row.best_streak,
        sprintDay: row.sprint_day,
        sprintStart: row.sprint_start,
        totalXp: row.total_xp,
        history: JSON.parse(row.history || "[]"),
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error("Failed to load schedule streak", error);
    return NextResponse.json({ error: "Failed to load streak." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, unauthorized } = await requireAdmin(request, { requirePasswordReady: true });
    if (unauthorized || !user) {
      return unauthorized;
    }

    const body = (await request.json()) as UpdateStreakBody;
    const nextCurrent = asOptionalInt(body.currentStreak);
    const nextBest = asOptionalInt(body.bestStreak);
    const nextSprintDay = asOptionalInt(body.sprintDay);
    const nextTotalXp = asOptionalInt(body.totalXp);
    const deltaXp = asOptionalInt(body.deltaXp) ?? 0;
    const sprintStart =
      typeof body.sprintStart === "string" && body.sprintStart.length <= 32 ? body.sprintStart : null;

    let nextHistory: string | null = null;
    if (Array.isArray(body.history)) {
      const sanitized = body.history
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item))
        .slice(-120);
      nextHistory = JSON.stringify(sanitized);
    }

    const db = getDb();
    const current = await db
      .prepare(
        `SELECT current_streak, best_streak, sprint_day, sprint_start, total_xp, history
         FROM schedule_streak
         WHERE id = 'shared'`
      )
      .first<{
        current_streak: number;
        best_streak: number;
        sprint_day: number;
        sprint_start: string | null;
        total_xp: number;
        history: string;
      }>();
    if (!current) {
      return NextResponse.json({ error: "Streak state not initialized." }, { status: 404 });
    }

    await db
      .prepare(
        `UPDATE schedule_streak
         SET current_streak = ?,
             best_streak = ?,
             sprint_day = ?,
             sprint_start = ?,
             total_xp = ?,
             history = ?,
             updated_by = ?,
             updated_at = datetime('now')
         WHERE id = 'shared'`
      )
      .bind(
        nextCurrent ?? current.current_streak,
        nextBest ?? current.best_streak,
        nextSprintDay ?? current.sprint_day,
        sprintStart ?? current.sprint_start,
        Math.max(0, (nextTotalXp ?? current.total_xp) + deltaXp),
        nextHistory ?? current.history,
        user.id
      )
      .run();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update schedule streak", error);
    return NextResponse.json({ error: "Failed to update streak." }, { status: 500 });
  }
}
