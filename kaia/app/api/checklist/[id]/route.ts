import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Body = {
  isChecked?: unknown;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const updateResult = await db
      .prepare(
        `UPDATE checklist_items
         SET is_checked = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(body.isChecked ? 1 : 0, id)
      .run();

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
