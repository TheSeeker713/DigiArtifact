import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { NextRequest } from "next/server";
import { requireAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const state = await db
      .prepare(
        `SELECT profile_id, xp, level, momentum, streak_days, freeze_tokens, updated_at
         FROM gamification_state
         WHERE profile_id = ?`
      )
      .bind(user.id)
      .first<{
        profile_id: string;
        xp: number;
        level: number;
        momentum: number;
        streak_days: number;
        freeze_tokens: number;
        updated_at: string;
      }>();

    if (!state) {
      return NextResponse.json({
        state: {
          profileId: user.id,
          xp: 0,
          level: 1,
          momentum: 0,
          streakDays: 0,
          freezeTokens: 1,
        },
      });
    }

    return NextResponse.json({
      state: {
        profileId: state.profile_id,
        xp: state.xp,
        level: state.level,
        momentum: state.momentum,
        streakDays: state.streak_days,
        freezeTokens: state.freeze_tokens,
        updatedAt: state.updated_at,
      },
    });
  } catch (error) {
    console.error("Failed to load gamification state", error);
    return NextResponse.json(
      { error: "Failed to load gamification state." },
      { status: 500 }
    );
  }
}
