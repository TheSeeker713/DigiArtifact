import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isValidEntityId, normalizeSortOrder, sanitizeLabel } from "@/lib/checklist";

type TodoItemRow = {
  id: string;
  list_id: string;
  section: string | null;
  label: string;
  sort_order: number;
  is_checked: number;
  updated_at: string;
  deleted_at: string | null;
};

type CreateItemBody = {
  id?: unknown;
  label?: unknown;
  section?: unknown;
  sortOrder?: unknown;
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;
    if (!isValidEntityId(listId)) {
      return NextResponse.json({ error: "Invalid list id." }, { status: 400 });
    }

    const db = getDb();
    const list = await db
      .prepare("SELECT id, name FROM todo_lists WHERE id = ? AND archived_at IS NULL")
      .bind(listId)
      .first<{ id: string; name: string }>();

    if (!list) {
      return NextResponse.json({ error: "List not found." }, { status: 404 });
    }

    const result = await db
      .prepare(
        `SELECT id, list_id, section, label, sort_order, is_checked, updated_at, deleted_at
         FROM todo_items
         WHERE list_id = ?
           AND deleted_at IS NULL
         ORDER BY
           CASE section
             WHEN 'Bathroom' THEN 1
             WHEN 'Kitchen' THEN 2
             WHEN 'Living Room' THEN 3
             WHEN 'Main Bedroom' THEN 4
             WHEN NULL THEN 98
             ELSE 99
           END,
           sort_order ASC,
           created_at ASC`
      )
      .bind(listId)
      .all<TodoItemRow>();

    return NextResponse.json({
      list,
      items: (result.results ?? []).map((row) => ({
        id: row.id,
        listId: row.list_id,
        section: row.section,
        label: row.label,
        sortOrder: row.sort_order,
        isChecked: row.is_checked === 1,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
      })),
    });
  } catch (error) {
    console.error("Failed to load list items", error);
    return NextResponse.json({ error: "Failed to load list items." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;
    if (!isValidEntityId(listId)) {
      return NextResponse.json({ error: "Invalid list id." }, { status: 400 });
    }

    const db = getDb();
    const listExists = await db
      .prepare("SELECT id FROM todo_lists WHERE id = ? AND archived_at IS NULL")
      .bind(listId)
      .first<{ id: string }>();

    if (!listExists) {
      return NextResponse.json({ error: "List not found." }, { status: 404 });
    }

    const body = (await request.json()) as CreateItemBody;
    const label = sanitizeLabel(typeof body.label === "string" ? body.label : "");
    if (label.length < 1 || label.length > 200) {
      return NextResponse.json(
        { error: "Item label must be between 1 and 200 characters." },
        { status: 400 }
      );
    }

    const idCandidate = typeof body.id === "string" ? body.id : crypto.randomUUID();
    if (!isValidEntityId(idCandidate)) {
      return NextResponse.json({ error: "Invalid item id format." }, { status: 400 });
    }

    let sortOrder = 0;
    if (typeof body.sortOrder === "number") {
      sortOrder = normalizeSortOrder(body.sortOrder);
    } else {
      const maxSort = await db
        .prepare(
          `SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order
           FROM todo_items
           WHERE list_id = ?
             AND deleted_at IS NULL`
        )
        .bind(listId)
        .first<{ max_sort_order: number }>();
      sortOrder = Number(maxSort?.max_sort_order ?? -1) + 1;
    }

    const section = normalizeOptionalSection(body.section);

    await db
      .prepare(
        `INSERT INTO todo_items (
           id, list_id, section, label, sort_order, is_checked, created_at, updated_at
         )
         VALUES (?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))`
      )
      .bind(idCandidate, listId, section, label, sortOrder)
      .run();

    return NextResponse.json(
      {
        item: {
          id: idCandidate,
          listId,
          section,
          label,
          sortOrder,
          isChecked: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create list item", error);
    return NextResponse.json({ error: "Failed to create list item." }, { status: 500 });
  }
}
