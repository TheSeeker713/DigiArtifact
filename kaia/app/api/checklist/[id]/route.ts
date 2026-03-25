import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth";

type Body = {
  isChecked?: unknown;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!/^[a-z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: "Invalid checklist id." }, { status: 400 });
    }

    const body = (await request.json()) as Body;
    if (typeof body.isChecked !== "boolean") {
      return NextResponse.json(
        { error: "Payload must include boolean isChecked." },
        { status: 400 }
      );
    }

    const db = getDb();
    const defaultList = await db
      .prepare(
        `SELECT l.id
         FROM todo_lists l
         INNER JOIN todo_list_members m ON m.list_id = l.id
         WHERE m.user_id = ?
           AND l.archived_at IS NULL
         ORDER BY l.sort_order ASC, l.created_at ASC
         LIMIT 1`
      )
      .bind(user.id)
      .first<{ id: string }>();
    if (!defaultList) {
      return NextResponse.json({ error: "Checklist not found." }, { status: 404 });
    }

    let updateResult: unknown;
    try {
      updateResult = await db
        .prepare(
          `UPDATE todo_items
           SET is_checked = ?, updated_at = datetime('now')
           WHERE id = ?
             AND list_id = ?
             AND EXISTS (
               SELECT 1
               FROM todo_list_members m
               WHERE m.list_id = todo_items.list_id
                 AND m.user_id = ?
             )
             AND deleted_at IS NULL`
        )
        .bind(body.isChecked ? 1 : 0, id, defaultList.id, user.id)
        .run();
    } catch {
      updateResult = await db
        .prepare(
          `UPDATE checklist_items
           SET is_checked = ?, updated_at = datetime('now')
           WHERE id = ?`
        )
        .bind(body.isChecked ? 1 : 0, id)
        .run();
    }

    return NextResponse.json({
      ok: true,
      result: updateResult,
    });
  } catch (error) {
    console.error("Failed to update checklist item", error);
    return NextResponse.json(
      { error: "Failed to update checklist item." },
      { status: 500 }
    );
  }
}
