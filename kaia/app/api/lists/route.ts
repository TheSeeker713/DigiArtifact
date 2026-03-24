import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { DEFAULT_LIST_ID, DEFAULT_LIST_NAME, isValidEntityId, sanitizeLabel } from "@/lib/checklist";

type ListRow = {
  id: string;
  name: string;
  sort_order: number;
  item_count: number;
};

type CreateListBody = {
  id?: unknown;
  name?: unknown;
};

function normalizeListName(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return sanitizeLabel(value);
}

export async function GET() {
  try {
    const db = getDb();
    const result = await db
      .prepare(
        `SELECT
           l.id,
           l.name,
           l.sort_order,
           COUNT(i.id) AS item_count
         FROM todo_lists l
         LEFT JOIN todo_items i
           ON i.list_id = l.id
          AND i.deleted_at IS NULL
         WHERE l.archived_at IS NULL
         GROUP BY l.id, l.name, l.sort_order
         ORDER BY l.sort_order ASC, l.created_at ASC`
      )
      .all<ListRow>();

    return NextResponse.json({
      lists: (result.results ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        sortOrder: row.sort_order,
        itemCount: Number(row.item_count) || 0,
      })),
    });
  } catch (error) {
    console.error("Failed to load lists", error);
    return NextResponse.json({ error: "Failed to load lists." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateListBody;
    const name = normalizeListName(body.name);
    if (name.length < 1 || name.length > 80) {
      return NextResponse.json(
        { error: "List name must be between 1 and 80 characters." },
        { status: 400 }
      );
    }

    const requestedId = typeof body.id === "string" ? body.id : "";
    const id = requestedId.length > 0 ? requestedId : crypto.randomUUID();
    if (!isValidEntityId(id)) {
      return NextResponse.json({ error: "Invalid list id format." }, { status: 400 });
    }

    const db = getDb();
    const maxSortOrder = await db
      .prepare(
        "SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order FROM todo_lists WHERE archived_at IS NULL"
      )
      .first<{ max_sort_order: number }>();
    const nextSortOrder = Number(maxSortOrder?.max_sort_order ?? -1) + 1;

    await db
      .prepare(
        `INSERT INTO todo_lists (id, name, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, datetime('now'), datetime('now'))`
      )
      .bind(id, name, nextSortOrder)
      .run();

    return NextResponse.json(
      {
        list: {
          id,
          name,
          sortOrder: nextSortOrder,
          itemCount: 0,
          isDefault: id === DEFAULT_LIST_ID && name === DEFAULT_LIST_NAME,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create list", error);
    return NextResponse.json({ error: "Failed to create list." }, { status: 500 });
  }
}
