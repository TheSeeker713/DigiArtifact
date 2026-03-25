import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isValidEntityId } from "@/lib/checklist";
import { trackAnalyticsEvent } from "@/lib/telemetry";
import { requireAuthUser } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthUser(_request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidEntityId(id)) {
      return NextResponse.json({ error: "Invalid routine id." }, { status: 400 });
    }

    const db = getDb();
    const routine = await db
      .prepare(
        `SELECT r.id, r.name
         FROM routines r
         INNER JOIN user_routines ur ON ur.routine_id = r.id
         WHERE r.id = ?
           AND r.is_active = 1
           AND ur.user_id = ?`
      )
      .bind(id, user.id)
      .first<{ id: string; name: string }>();

    if (!routine) {
      return NextResponse.json({ error: "Routine not found." }, { status: 404 });
    }

    const runId = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO routine_runs (id, routine_id, status, started_at, created_at, updated_at)
         VALUES (?, ?, 'started', datetime('now'), datetime('now'), datetime('now'))`
      )
      .bind(runId, id)
      .run();
    await db
      .prepare(
        `INSERT INTO user_routine_runs (run_id, user_id, created_at)
         VALUES (?, ?, datetime('now'))`
      )
      .bind(runId, user.id)
      .run();

    await trackAnalyticsEvent("routine_started", { routineId: id, runId }, user.id);

    return NextResponse.json(
      {
        run: {
          id: runId,
          routineId: id,
          status: "started",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to start routine", error);
    return NextResponse.json({ error: "Failed to start routine." }, { status: 500 });
  }
}
