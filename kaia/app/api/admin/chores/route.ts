import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type ChoreCreateBody = {
  day?: unknown;
  text?: unknown;
};

type ChorePatchBody = {
  id?: unknown;
  done?: unknown;
  sortOrder?: unknown;
  text?: unknown;
};

const VALID_DAYS = new Set(["monday", "thursday", "friday"]);

function normalizeDay(day: unknown) {
  if (typeof day !== "string") {
    return "";
  }
  const normalized = day.trim().toLowerCase();
  return VALID_DAYS.has(normalized) ? normalized : "";
}

export async function GET(request: NextRequest) {
  try {
    const { unauthorized } = await requireAdmin(request);
    if (unauthorized) {
      return unauthorized;
    }
    const day = normalizeDay(request.nextUrl.searchParams.get("day"));
    if (!day) {
      return NextResponse.json({ error: "A valid day is required." }, { status: 400 });
    }
    const db = getDb();
    const result = await db
      .prepare(
        `SELECT id, day_slot, text, done, sort_order, updated_by, updated_at
         FROM schedule_chores
         WHERE day_slot = ?
         ORDER BY sort_order ASC, created_at ASC`
      )
      .bind(day)
      .all<{
        id: string;
        day_slot: string;
        text: string;
        done: number;
        sort_order: number;
        updated_by: string | null;
        updated_at: string;
      }>();
    return NextResponse.json({
      day,
      chores: (result.results ?? []).map((row) => ({
        id: row.id,
        day: row.day_slot,
        text: row.text,
        done: row.done === 1,
        sortOrder: row.sort_order,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error("Failed to load chores", error);
    return NextResponse.json({ error: "Failed to load chores." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, unauthorized } = await requireAdmin(request, { requirePasswordReady: true });
    if (unauthorized || !user) {
      return unauthorized;
    }
    const body = (await request.json()) as ChoreCreateBody;
    const day = normalizeDay(body.day);
    const text = typeof body.text === "string" ? body.text.trim().replace(/\s+/g, " ").slice(0, 200) : "";
    if (!day || !text) {
      return NextResponse.json({ error: "Valid day and text are required." }, { status: 400 });
    }

    const db = getDb();
    const maxSort = await db
      .prepare(
        `SELECT COALESCE(MAX(sort_order), -1) AS max_sort
         FROM schedule_chores
         WHERE day_slot = ?`
      )
      .bind(day)
      .first<{ max_sort: number }>();
    const sortOrder = Number(maxSort?.max_sort ?? -1) + 1;
    const id = `chore_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    await db
      .prepare(
        `INSERT INTO schedule_chores (
           id, day_slot, text, done, sort_order, updated_by, created_at, updated_at
         )
         VALUES (?, ?, ?, 0, ?, ?, datetime('now'), datetime('now'))`
      )
      .bind(id, day, text, sortOrder, user.id)
      .run();

    return NextResponse.json({
      chore: { id, day, text, done: false, sortOrder },
    });
  } catch (error) {
    console.error("Failed to create chore", error);
    return NextResponse.json({ error: "Failed to create chore." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, unauthorized } = await requireAdmin(request, { requirePasswordReady: true });
    if (unauthorized || !user) {
      return unauthorized;
    }
    const body = (await request.json()) as ChorePatchBody;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Chore id is required." }, { status: 400 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    if (typeof body.done === "boolean") {
      updates.push("done = ?");
      values.push(body.done ? 1 : 0);
    }
    if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
      updates.push("sort_order = ?");
      values.push(Math.max(0, Math.floor(body.sortOrder)));
    }
    if (typeof body.text === "string") {
      const text = body.text.trim().replace(/\s+/g, " ").slice(0, 200);
      if (!text) {
        return NextResponse.json({ error: "Text cannot be empty." }, { status: 400 });
      }
      updates.push("text = ?");
      values.push(text);
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates were provided." }, { status: 400 });
    }

    const db = getDb();
    updates.push("updated_by = ?");
    values.push(user.id);
    updates.push("updated_at = datetime('now')");
    await db
      .prepare(
        `UPDATE schedule_chores
         SET ${updates.join(", ")}
         WHERE id = ?`
      )
      .bind(...values, id)
      .run();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update chore", error);
    return NextResponse.json({ error: "Failed to update chore." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { unauthorized } = await requireAdmin(request, { requirePasswordReady: true });
    if (unauthorized) {
      return unauthorized;
    }
    const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
    const day = normalizeDay(request.nextUrl.searchParams.get("day"));
    if (!id && !day) {
      return NextResponse.json({ error: "Provide id or day." }, { status: 400 });
    }
    const db = getDb();
    if (id) {
      await db
        .prepare("DELETE FROM schedule_chores WHERE id = ?")
        .bind(id)
        .run();
      return NextResponse.json({ ok: true, deletedId: id });
    }
    await db
      .prepare("DELETE FROM schedule_chores WHERE day_slot = ?")
      .bind(day)
      .run();
    return NextResponse.json({ ok: true, clearedDay: day });
  } catch (error) {
    console.error("Failed to delete chore(s)", error);
    return NextResponse.json({ error: "Failed to delete chores." }, { status: 500 });
  }
}
