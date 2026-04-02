import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export async function GET(request: NextRequest) {
  try {
    const { unauthorized } = await requireAdmin(request);
    if (unauthorized) {
      return unauthorized;
    }

    const db = getDb();
    const [daily, streak, chores, plan] = await Promise.all([
      db
        .prepare("SELECT COALESCE(MAX(updated_at), '') AS ts FROM schedule_daily")
        .first<{ ts: string }>(),
      db
        .prepare("SELECT COALESCE(MAX(updated_at), '') AS ts FROM schedule_streak")
        .first<{ ts: string }>(),
      db
        .prepare("SELECT COALESCE(MAX(updated_at), '') AS ts FROM schedule_chores")
        .first<{ ts: string }>(),
      db
        .prepare("SELECT COALESCE(MAX(updated_at), '') AS ts FROM schedule_plan")
        .first<{ ts: string }>(),
    ]);

    return NextResponse.json({
      sync: {
        daily: daily?.ts ?? "",
        streak: streak?.ts ?? "",
        chores: chores?.ts ?? "",
        plan: plan?.ts ?? "",
      },
    });
  } catch (error) {
    console.error("Failed to load admin sync timestamps", error);
    return NextResponse.json({ error: "Failed to load sync timestamps." }, { status: 500 });
  }
}
