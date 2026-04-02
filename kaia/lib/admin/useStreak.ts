"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LEVELS } from "@/lib/admin/constants";
import { StreakState } from "@/lib/admin/types";

const EMPTY_STREAK: StreakState = {
  currentStreak: 0,
  bestStreak: 0,
  sprintDay: 0,
  sprintStart: null,
  totalXp: 0,
  history: [],
};

export function useStreak() {
  const [state, setState] = useState<StreakState>(EMPTY_STREAK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/streak", { cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load streak.");
      }
      const data = (await response.json()) as { streak: StreakState };
      setState(data.streak ?? EMPTY_STREAK);
    } catch (err) {
      console.error(err);
      setError("Could not load streak.");
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (patch: Partial<StreakState> & { deltaXp?: number }) => {
    const response = await fetch("/api/admin/streak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentStreak: patch.currentStreak,
        bestStreak: patch.bestStreak,
        sprintDay: patch.sprintDay,
        sprintStart: patch.sprintStart,
        totalXp: patch.totalXp,
        history: patch.history,
        deltaXp: patch.deltaXp,
      }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error ?? "Failed to update streak.");
    }
    await refresh();
  }, [refresh]);

  const levelMeta = useMemo(() => {
    const current = LEVELS.reduce((acc, level) => (state.totalXp >= level.xp ? level : acc), LEVELS[0]);
    const next = LEVELS[LEVELS.indexOf(current) + 1] ?? null;
    const progress = next ? (state.totalXp - current.xp) / Math.max(1, next.xp - current.xp) : 1;
    return { current, next, progress };
  }, [state.totalXp]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    state,
    loading,
    error,
    refresh,
    update,
    levelMeta,
  };
}
