import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ANON_PROFILE_ID } from "@/lib/telemetry";

export async function GET() {
  try {
    const db = getDb();
    const state = await db
      .prepare(
        `SELECT profile_id, xp, level, momentum, streak_days, freeze_tokens, updated_at
         FROM gamification_state
         WHERE profile_id = ?`
      )
      .bind(ANON_PROFILE_ID)
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
          profileId: ANON_PROFILE_ID,
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
