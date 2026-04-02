"use client";

import { useCallback, useEffect, useState } from "react";
import { WeeklyPlanState } from "@/lib/admin/types";

const EMPTY_PLAN: WeeklyPlanState = {
  top_1: "",
  top_2: "",
  top_3: "",
  notes: "",
  week_of: null,
};

export function usePlan() {
  const [plan, setPlan] = useState<WeeklyPlanState>(EMPTY_PLAN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/plan", { cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load plan.");
      }
      const data = (await response.json()) as { plan: WeeklyPlanState };
      setPlan(data.plan ?? EMPTY_PLAN);
    } catch (err) {
      console.error(err);
      setError("Could not load plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (patch: Partial<WeeklyPlanState>) => {
    const optimistic = { ...plan, ...patch };
    setPlan(optimistic);
    const response = await fetch("/api/admin/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setPlan(plan);
      throw new Error(body.error ?? "Failed to save plan.");
    }
    await refresh();
  }, [plan, refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    plan,
    loading,
    error,
    refresh,
    update,
  };
}
