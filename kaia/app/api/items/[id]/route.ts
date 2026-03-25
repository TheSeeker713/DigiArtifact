import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isValidEntityId, normalizeSortOrder, sanitizeLabel } from "@/lib/checklist";
import { publishCollabEvent } from "@/lib/realtime";
import { recordGamificationEvent, trackAnalyticsEvent } from "@/lib/telemetry";
import { requireAuthUser } from "@/lib/auth";

type UpdateItemBody = {
  label?: unknown;
  isChecked?: unknown;
  sortOrder?: unknown;
  section?: unknown;
};

function normalizeOptionalSection(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const section = sanitizeLabel(value);
  if (section.length === 0) {
    return null;
  }
  return section.slice(0, 80);
}

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
    if (!isValidEntityId(id)) {
      return NextResponse.json({ error: "Invalid item id." }, { status: 400 });
    }

    const body = (await request.json()) as UpdateItemBody;
    const updates: string[] = [];
    const values: unknown[] = [];

    if (typeof body.label === "string") {
      const label = sanitizeLabel(body.label);
      if (label.length < 1 || label.length > 200) {
        return NextResponse.json(
          { error: "Item label must be between 1 and 200 characters." },
          { status: 400 }
        );
      }
      updates.push("label = ?");
      values.push(label);
    }

    if (typeof body.isChecked === "boolean") {
      updates.push("is_checked = ?");
      values.push(body.isChecked ? 1 : 0);
    }

    if (typeof body.sortOrder === "number") {
      updates.push("sort_order = ?");
      values.push(normalizeSortOrder(body.sortOrder));
    }

    if (body.section !== undefined) {
      updates.push("section = ?");
      values.push(normalizeOptionalSection(body.section));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No supported update fields were provided." },
        { status: 400 }
      );
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const db = getDb();
    await db
      .prepare(
        `UPDATE todo_items
         SET ${updates.join(", ")}
         WHERE id = ?
           AND EXISTS (
             SELECT 1
             FROM todo_list_members m
             WHERE m.list_id = todo_items.list_id
               AND m.user_id = ?
           )
           AND deleted_at IS NULL`
      )
      .bind(...values, user.id)
      .run();

    const item = await db
      .prepare(
        `SELECT i.id, i.list_id, i.section, i.label, i.sort_order, i.is_checked, i.updated_at, i.deleted_at
         FROM todo_items i
         INNER JOIN todo_list_members m ON m.list_id = i.list_id
         WHERE i.id = ?
           AND m.user_id = ?`
      )
      .bind(id, user.id)
      .first<{
        id: string;
        list_id: string;
        section: string | null;
        label: string;
        sort_order: number;
        is_checked: number;
        updated_at: string;
        deleted_at: string | null;
      }>();

    if (!item || item.deleted_at) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }

    const checkedUpdate = typeof body.isChecked === "boolean";
    const eventType = checkedUpdate
      ? "item_checked"
      : "item_updated";

    await publishCollabEvent(item.list_id, eventType, item.id, {
      id: item.id,
      listId: item.list_id,
      section: item.section,
      label: item.label,
      sortOrder: item.sort_order,
      isChecked: item.is_checked === 1,
      updatedAt: item.updated_at,
    });

    await trackAnalyticsEvent(eventType, {
      listId: item.list_id,
      itemId: item.id,
      isChecked: item.is_checked === 1,
    }, user.id);

    if (checkedUpdate && body.isChecked === true) {
      await recordGamificationEvent("item_checked", 5, {
        listId: item.list_id,
        itemId: item.id,
      }, user.id);
    }

    return NextResponse.json({
      item: {
        id: item.id,
        listId: item.list_id,
        section: item.section,
        label: item.label,
        sortOrder: item.sort_order,
        isChecked: item.is_checked === 1,
        updatedAt: item.updated_at,
      },
    });
  } catch (error) {
    console.error("Failed to update item", error);
    return NextResponse.json({ error: "Failed to update item." }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: "Invalid item id." }, { status: 400 });
    }

    const db = getDb();
    const existing = await db
      .prepare(
        `SELECT i.id, i.list_id
         FROM todo_items i
         INNER JOIN todo_list_members m ON m.list_id = i.list_id
         WHERE i.id = ?
           AND i.deleted_at IS NULL
           AND m.user_id = ?`
      )
      .bind(id, user.id)
      .first<{ id: string; list_id: string }>();

    await db
      .prepare(
        `UPDATE todo_items
         SET deleted_at = datetime('now'), updated_at = datetime('now')
         WHERE id = ?
           AND EXISTS (
             SELECT 1
             FROM todo_list_members m
             WHERE m.list_id = todo_items.list_id
               AND m.user_id = ?
           )
           AND deleted_at IS NULL`
      )
      .bind(id, user.id)
      .run();

    if (existing) {
      await publishCollabEvent(existing.list_id, "item_deleted", existing.id, {
        id: existing.id,
        listId: existing.list_id,
      });
      await trackAnalyticsEvent("item_deleted", {
        listId: existing.list_id,
        itemId: existing.id,
      }, user.id);
    }

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (error) {
    console.error("Failed to delete item", error);
    return NextResponse.json({ error: "Failed to delete item." }, { status: 500 });
  }
}
