import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { DEFAULT_LIST_ID, isValidEntityId, normalizeSortOrder, sanitizeLabel } from "@/lib/checklist";
import { publishCollabEvent } from "@/lib/realtime";
import { trackAnalyticsEvent } from "@/lib/telemetry";

type UpdateListBody = {
  name?: unknown;
  sortOrder?: unknown;
  archived?: unknown;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidEntityId(id)) {
      return NextResponse.json({ error: "Invalid list id." }, { status: 400 });
    }

    const body = (await request.json()) as UpdateListBody;
    const updates: string[] = [];
    const values: unknown[] = [];

    if (typeof body.name === "string") {
      const name = sanitizeLabel(body.name);
      if (name.length < 1 || name.length > 80) {
        return NextResponse.json(
          { error: "List name must be between 1 and 80 characters." },
          { status: 400 }
        );
      }
      updates.push("name = ?");
      values.push(name);
    }

    if (typeof body.sortOrder === "number") {
      updates.push("sort_order = ?");
      values.push(normalizeSortOrder(body.sortOrder));
    }

    if (typeof body.archived === "boolean") {
      if (id === DEFAULT_LIST_ID && body.archived) {
        return NextResponse.json(
          { error: "Default list cannot be archived." },
          { status: 400 }
        );
      }
      updates.push(body.archived ? "archived_at = datetime('now')" : "archived_at = NULL");
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
      .prepare(`UPDATE todo_lists SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await db
      .prepare(
        `SELECT id, name, sort_order, archived_at
         FROM todo_lists
         WHERE id = ?`
      )
      .bind(id)
      .first<{
        id: string;
        name: string;
        sort_order: number;
        archived_at: string | null;
      }>();

    if (!updated) {
      return NextResponse.json({ error: "List not found." }, { status: 404 });
    }

    const eventType = updated.archived_at ? "list_archived" : "list_updated";
    await publishCollabEvent(updated.id, eventType, updated.id, {
      id: updated.id,
      name: updated.name,
      sortOrder: updated.sort_order,
      archivedAt: updated.archived_at,
    });
    await trackAnalyticsEvent(eventType, { listId: updated.id });

    return NextResponse.json({
      list: {
        id: updated.id,
        name: updated.name,
        sortOrder: updated.sort_order,
        archivedAt: updated.archived_at,
      },
    });
  } catch (error) {
    console.error("Failed to update list", error);
    return NextResponse.json({ error: "Failed to update list." }, { status: 500 });
  }
}
