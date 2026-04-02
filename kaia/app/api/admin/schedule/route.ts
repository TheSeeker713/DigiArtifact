import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type UpdateScheduleBody = {
  date?: unknown;
  key?: unknown;
  value?: unknown;
};

function normalizeDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function normalizeKey(value: string) {
  return /^[a-z0-9_-]{1,50}$/.test(value) ? value : "";
}

export async function GET(request: NextRequest) {
  try {
    const { unauthorized } = await requireAdmin(request);
    if (unauthorized) {
      return unauthorized;
    }

    const dateParam = request.nextUrl.searchParams.get("date") ?? "";
    const date = normalizeDate(dateParam);
    if (!date) {
      return NextResponse.json({ error: "A valid date is required (YYYY-MM-DD)." }, { status: 400 });
    }

    const db = getDb();
    const result = await db
      .prepare(
        `SELECT data_key, value, updated_by, updated_at
         FROM schedule_daily
         WHERE date = ?`
      )
      .bind(date)
      .all<{ data_key: string; value: string; updated_by: string | null; updated_at: string }>();

    const entries = result.results ?? [];
    return NextResponse.json({
      date,
      values: Object.fromEntries(entries.map((row) => [row.data_key, row.value])),
      updatedBy: Object.fromEntries(entries.map((row) => [row.data_key, row.updated_by])),
      updatedAt: Object.fromEntries(entries.map((row) => [row.data_key, row.updated_at])),
    });
  } catch (error) {
    console.error("Failed to load admin schedule", error);
    return NextResponse.json({ error: "Failed to load schedule." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, unauthorized } = await requireAdmin(request, { requirePasswordReady: true });
    if (unauthorized || !user) {
      return unauthorized;
    }

    const body = (await request.json()) as UpdateScheduleBody;
    const date = normalizeDate(typeof body.date === "string" ? body.date : "");
    const key = normalizeKey(typeof body.key === "string" ? body.key : "");
    const value = typeof body.value === "string" ? body.value.slice(0, 500) : "";
    if (!date || !key) {
      return NextResponse.json({ error: "Valid date and key are required." }, { status: 400 });
    }

    const db = getDb();
    await db
      .prepare(
        `INSERT INTO schedule_daily (date, data_key, value, updated_by, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(date, data_key)
         DO UPDATE SET
           value = excluded.value,
           updated_by = excluded.updated_by,
           updated_at = datetime('now')`
      )
      .bind(date, key, value, user.id)
      .run();

    return NextResponse.json({ ok: true, date, key, value });
  } catch (error) {
    console.error("Failed to update admin schedule", error);
    return NextResponse.json({ error: "Failed to update schedule." }, { status: 500 });
  }
}
