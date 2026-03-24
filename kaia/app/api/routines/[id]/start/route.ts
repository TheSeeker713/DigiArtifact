import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isValidEntityId } from "@/lib/checklist";
import { trackAnalyticsEvent } from "@/lib/telemetry";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidEntityId(id)) {
      return NextResponse.json({ error: "Invalid routine id." }, { status: 400 });
    }

    const db = getDb();
    const routine = await db
      .prepare("SELECT id, name FROM routines WHERE id = ? AND is_active = 1")
      .bind(id)
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

    await trackAnalyticsEvent("routine_started", { routineId: id, runId });

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
