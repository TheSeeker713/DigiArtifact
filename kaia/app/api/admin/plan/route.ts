import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type UpdatePlanBody = {
  top_1?: unknown;
  top_2?: unknown;
  top_3?: unknown;
  notes?: unknown;
  week_of?: unknown;
};

function normalizeField(value: unknown, max = 300) {
  if (typeof value !== "string") {
    return null;
  }
  return value.slice(0, max);
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
        `SELECT top_1, top_2, top_3, notes, week_of, updated_by, updated_at
         FROM schedule_plan
         WHERE id = 'shared'`
      )
      .first<{
        top_1: string;
        top_2: string;
        top_3: string;
        notes: string;
        week_of: string | null;
        updated_by: string | null;
        updated_at: string;
      }>();
    if (!row) {
      return NextResponse.json({ error: "Plan state not initialized." }, { status: 404 });
    }
    return NextResponse.json({
      plan: {
        top_1: row.top_1,
        top_2: row.top_2,
        top_3: row.top_3,
        notes: row.notes,
        week_of: row.week_of,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error("Failed to load admin plan", error);
    return NextResponse.json({ error: "Failed to load plan." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, unauthorized } = await requireAdmin(request, { requirePasswordReady: true });
    if (unauthorized || !user) {
      return unauthorized;
    }

    const body = (await request.json()) as UpdatePlanBody;
    const db = getDb();
    const current = await db
      .prepare(
        `SELECT top_1, top_2, top_3, notes, week_of
         FROM schedule_plan
         WHERE id = 'shared'`
      )
      .first<{
        top_1: string;
        top_2: string;
        top_3: string;
        notes: string;
        week_of: string | null;
      }>();
    if (!current) {
      return NextResponse.json({ error: "Plan state not initialized." }, { status: 404 });
    }

    const top1 = normalizeField(body.top_1, 200);
    const top2 = normalizeField(body.top_2, 200);
    const top3 = normalizeField(body.top_3, 200);
    const notes = normalizeField(body.notes, 5000);
    const weekOf = normalizeField(body.week_of, 20);

    await db
      .prepare(
        `UPDATE schedule_plan
         SET top_1 = ?,
             top_2 = ?,
             top_3 = ?,
             notes = ?,
             week_of = ?,
             updated_by = ?,
             updated_at = datetime('now')
         WHERE id = 'shared'`
      )
      .bind(
        top1 ?? current.top_1,
        top2 ?? current.top_2,
        top3 ?? current.top_3,
        notes ?? current.notes,
        weekOf ?? current.week_of,
        user.id
      )
      .run();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update admin plan", error);
    return NextResponse.json({ error: "Failed to update plan." }, { status: 500 });
  }
}
