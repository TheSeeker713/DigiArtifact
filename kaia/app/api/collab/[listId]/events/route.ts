import { NextRequest, NextResponse } from "next/server";
import { isValidEntityId, normalizeSortOrder } from "@/lib/checklist";
import { loadCollabEventsSince } from "@/lib/realtime";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;
    if (!isValidEntityId(listId)) {
      return NextResponse.json({ error: "Invalid list id." }, { status: 400 });
    }

    const sinceRaw = request.nextUrl.searchParams.get("since");
    const since = normalizeSortOrder(sinceRaw ? Number(sinceRaw) : 0);
    const result = await loadCollabEventsSince(listId, since);
    const events = (result.results ?? []).map((event) => ({
      id: event.id,
      listId: event.list_id,
      type: event.event_type,
      entityId: event.entity_id,
      payload: JSON.parse(event.payload),
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
