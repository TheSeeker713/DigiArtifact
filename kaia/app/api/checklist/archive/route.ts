import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth";

type ArchiveSetRow = {
  id: string;
  source_version: string;
  created_at: string;
};

type ArchiveItemRow = {
  archive_set_id: string;
  original_id: string;
  section: string;
  label: string;
  sort_order: number;
  is_checked: number;
  updated_at: string;
  archived_at: string;
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    const archiveSet = await db
      .prepare(
        `SELECT id, source_version, created_at
         FROM checklist_archive_sets
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .first<ArchiveSetRow>();

    if (!archiveSet) {
      return NextResponse.json({
        archive: null,
        items: [],
        migrationStatus: "archive_missing",
      });
    }

    const itemsResult = await db
      .prepare(
        `SELECT archive_set_id, original_id, section, label, sort_order, is_checked, updated_at, archived_at
         FROM checklist_archive_items
         WHERE archive_set_id = ?
         ORDER BY section ASC, sort_order ASC`
      )
      .bind(archiveSet.id)
      .all<ArchiveItemRow>();

    return NextResponse.json({
      archive: {
        id: archiveSet.id,
        sourceVersion: archiveSet.source_version,
        createdAt: archiveSet.created_at,
      },
      migrationStatus: "archive_ready",
      itemCount: (itemsResult.results ?? []).length,
      items: (itemsResult.results ?? []).map((item) => ({
        archiveSetId: item.archive_set_id,
        originalId: item.original_id,
        section: item.section,
        label: item.label,
        sortOrder: item.sort_order,
        isChecked: item.is_checked === 1,
        updatedAt: item.updated_at,
        archivedAt: item.archived_at,
      })),
    });
  } catch (error) {
    console.error("Failed to load checklist archive", error);
    return NextResponse.json(
      { error: "Failed to load checklist archive." },
      { status: 500 }
    );
  }
}
