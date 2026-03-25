import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sanitizeLabel } from "@/lib/checklist";
import { trackAnalyticsEvent } from "@/lib/telemetry";
import { requireAuthUser } from "@/lib/auth";

type KaiaMessageBody = {
  prompt?: unknown;
  phase?: unknown;
};

function buildKaiaMessage(prompt: string, phase: string) {
  const normalizedPhase = phase.toLowerCase();
  if (normalizedPhase === "pre-task") {
    return `KAIA: Keep At It, Always. Pick one 2-5 minute action for "${prompt}" and start now.`;
  }
  if (normalizedPhase === "during-task") {
    return `KAIA: You are in motion. One tiny step now keeps momentum alive for "${prompt}".`;
  }
  if (normalizedPhase === "post-task") {
    return `KAIA: Nice work. Mark what you finished in "${prompt}" and choose your next easy win.`;
  }
  return `KAIA: Keep At It, Always. Let's break "${prompt}" into one tiny next action.`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as KaiaMessageBody;
    const prompt = sanitizeLabel(typeof body.prompt === "string" ? body.prompt : "");
    if (prompt.length < 1 || prompt.length > 200) {
      return NextResponse.json(
        { error: "Prompt must be between 1 and 200 characters." },
        { status: 400 }
      );
    }

    const phase =
      typeof body.phase === "string" && body.phase.trim().length > 0
        ? sanitizeLabel(body.phase)
        : "general";
    const response = buildKaiaMessage(prompt, phase);

    const db = getDb();
    await db
      .prepare(
        `INSERT INTO kaia_messages (profile_id, message_type, prompt, response, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`
      )
      .bind(user.id, phase, prompt, response)
      .run();

    await trackAnalyticsEvent("kaia_message_generated", { phase }, user.id);

    return NextResponse.json({
      message: {
        prompt,
        phase,
        response,
      },
    });
  } catch (error) {
    console.error("Failed to generate KAIA message", error);
    return NextResponse.json({ error: "Failed to generate KAIA message." }, { status: 500 });
  }
}
