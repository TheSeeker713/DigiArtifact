import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ChecklistItem, ChecklistSection, SECTION_ORDER } from "@/lib/checklist";
import { requireAuthUser } from "@/lib/auth";

type ChecklistRow = {
  id: string;
  section: string | null;
  label: string;
  sort_order: number;
  is_checked: number;
  updated_at: string;
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ sections: [] });
    }

    let result: { results: ChecklistRow[] };
    try {
      result = await db
        .prepare(
          `SELECT id, section, label, sort_order, is_checked, updated_at
           FROM todo_items
           WHERE list_id = ?
             AND deleted_at IS NULL
           ORDER BY
             CASE section
               WHEN 'Bathroom' THEN 1
               WHEN 'Kitchen' THEN 2
               WHEN 'Living Room' THEN 3
               WHEN 'Main Bedroom' THEN 4
               ELSE 99
             END,
             sort_order ASC`
        )
        .bind(defaultList.id)
        .all<ChecklistRow>();
    } catch {
      result = await db
        .prepare(
          `SELECT id, section, label, sort_order, is_checked, updated_at
           FROM checklist_items
           ORDER BY
             CASE section
               WHEN 'Bathroom' THEN 1
               WHEN 'Kitchen' THEN 2
               WHEN 'Living Room' THEN 3
               WHEN 'Main Bedroom' THEN 4
               ELSE 99
             END,
             sort_order ASC`
        )
        .all<ChecklistRow>();
    }

    const items: ChecklistItem[] = (result.results ?? []).map((row) => ({
      id: row.id,
      section: row.section ?? "General",
      label: row.label,
      sortOrder: row.sort_order,
      isChecked: row.is_checked === 1,
      updatedAt: row.updated_at,
    }));

    const sectionsMap = new Map<string, ChecklistItem[]>();
    for (const section of SECTION_ORDER) {
      sectionsMap.set(section, []);
    }

    for (const item of items) {
      if (!sectionsMap.has(item.section)) {
        sectionsMap.set(item.section, []);
      }
      sectionsMap.get(item.section)?.push(item);
    }

    const sections: ChecklistSection[] = Array.from(sectionsMap.entries())
      .map(([section, checklistItems]) => ({
        section,
        items: checklistItems,
      }))
      .filter((sectionGroup) => sectionGroup.items.length > 0);

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Failed to load checklist items", error);
    return NextResponse.json(
      { error: "Failed to load checklist items." },
      { status: 500 }
    );
  }
}
