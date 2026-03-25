import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isValidEntityId, sanitizeLabel } from "@/lib/checklist";
import { trackAnalyticsEvent } from "@/lib/telemetry";
import { requireAuthUser } from "@/lib/auth";

type CreateRoutineBody = {
  id?: unknown;
  name?: unknown;
  scheduleWindow?: unknown;
  steps?: unknown;
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const routines = await db
      .prepare(
        `SELECT r.id, r.name, r.schedule_window, r.is_active, r.created_at, r.updated_at
         FROM routines r
         INNER JOIN user_routines ur ON ur.routine_id = r.id
         WHERE r.is_active = 1
           AND ur.user_id = ?
         ORDER BY r.created_at ASC`
      )
      .bind(user.id)
      .all<{
        id: string;
        name: string;
        schedule_window: string;
        is_active: number;
        created_at: string;
        updated_at: string;
      }>();

    const steps = await db
      .prepare(
        `SELECT rs.id, rs.routine_id, rs.label, rs.sort_order, rs.duration_minutes
         FROM routine_steps rs
         INNER JOIN user_routines ur ON ur.routine_id = rs.routine_id
         WHERE ur.user_id = ?
         ORDER BY rs.routine_id ASC, rs.sort_order ASC`
      )
      .bind(user.id)
      .all<{
        id: string;
        routine_id: string;
        label: string;
        sort_order: number;
        duration_minutes: number;
      }>();

    const byRoutine = new Map<string, Array<{ id: string; label: string; sortOrder: number; durationMinutes: number }>>();
    for (const step of steps.results ?? []) {
      if (!byRoutine.has(step.routine_id)) {
        byRoutine.set(step.routine_id, []);
      }
      byRoutine.get(step.routine_id)?.push({
        id: step.id,
        label: step.label,
        sortOrder: step.sort_order,
        durationMinutes: step.duration_minutes,
      });
    }

    return NextResponse.json({
      routines: (routines.results ?? []).map((routine) => ({
        id: routine.id,
        name: routine.name,
        scheduleWindow: routine.schedule_window,
        isActive: routine.is_active === 1,
        steps: byRoutine.get(routine.id) ?? [],
      })),
    });
  } catch (error) {
    console.error("Failed to load routines", error);
    return NextResponse.json({ error: "Failed to load routines." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateRoutineBody;
    const name = sanitizeLabel(typeof body.name === "string" ? body.name : "");
    if (name.length < 1 || name.length > 120) {
      return NextResponse.json(
        { error: "Routine name must be between 1 and 120 characters." },
        { status: 400 }
      );
    }

    const routineId = typeof body.id === "string" ? body.id : crypto.randomUUID();
    if (!isValidEntityId(routineId)) {
      return NextResponse.json({ error: "Invalid routine id." }, { status: 400 });
    }

    const scheduleWindow =
      typeof body.scheduleWindow === "string" && body.scheduleWindow.trim().length > 0
        ? sanitizeLabel(body.scheduleWindow).toLowerCase()
        : "anytime";

    const db = getDb();
    await db
      .prepare(
        `INSERT INTO routines (id, name, schedule_window, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`
      )
      .bind(routineId, name, scheduleWindow)
      .run();
    await db
      .prepare(
        `INSERT INTO user_routines (routine_id, user_id, created_at)
         VALUES (?, ?, datetime('now'))`
      )
      .bind(routineId, user.id)
      .run();

    const inputSteps = Array.isArray(body.steps) ? body.steps : [];
    let idx = 0;
    for (const step of inputSteps) {
      if (!step || typeof step !== "object") {
        continue;
      }
      const label = sanitizeLabel(
        typeof (step as Record<string, unknown>).label === "string"
          ? ((step as Record<string, unknown>).label as string)
          : ""
      );
      if (!label) {
        continue;
      }
      const durationMinutes = Number(
        (step as Record<string, unknown>).durationMinutes ?? 5
      );
      const stepId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO routine_steps (
             id, routine_id, label, sort_order, duration_minutes, created_at, updated_at
           )
           VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
        )
        .bind(
          stepId,
          routineId,
          label,
          idx,
          Number.isFinite(durationMinutes) ? Math.max(1, Math.floor(durationMinutes)) : 5
        )
        .run();
      idx += 1;
    }

    await trackAnalyticsEvent("routine_created", { routineId }, user.id);

    return NextResponse.json(
      {
        routine: {
          id: routineId,
          name,
          scheduleWindow,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create routine", error);
    return NextResponse.json({ error: "Failed to create routine." }, { status: 500 });
  }
}
