import { NextRequest, NextResponse } from "next/server";
import { isValidEntityId, normalizeSortOrder } from "@/lib/checklist";
import { loadCollabEventsSince } from "@/lib/realtime";
import { getDb } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const user = await requireAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await params;
    if (!isValidEntityId(listId)) {
      return NextResponse.json({ error: "Invalid list id." }, { status: 400 });
    }

    const db = getDb();
    const membership = await db
      .prepare("SELECT list_id FROM todo_list_members WHERE list_id = ? AND user_id = ?")
      .bind(listId, user.id)
      .first<{ list_id: string }>();
    if (!membership) {
      return NextResponse.json({ error: "List not found." }, { status: 404 });
    }

    const sinceRaw = request.nextUrl.searchParams.get("since");
    if (sinceRaw && !/^\d+$/.test(sinceRaw)) {
      return NextResponse.json({ error: "Invalid since cursor." }, { status: 400 });
    }
    const since = normalizeSortOrder(sinceRaw ? Number(sinceRaw) : 0);
    const result = await loadCollabEventsSince(listId, since);
    const events = (result.results ?? []).map((event) => ({
      id: event.id,
      listId: event.list_id,
      type: event.event_type,
      entityId: event.entity_id,
      payload: (() => {
        try {
          return JSON.parse(event.payload);
        } catch {
          return { parseError: true };
        }
      })(),
      createdAt: event.created_at,
    }));

    const latestCursor = events.length > 0 ? events[events.length - 1].id : since;
    return NextResponse.json({
      cursor: latestCursor,
      events,
    });
  } catch (error) {
    console.error("Failed to load collab events", error);
    return NextResponse.json({ error: "Failed to load collab events." }, { status: 500 });
  }
}
