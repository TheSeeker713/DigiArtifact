"use client";

import { useCallback, useEffect, useState } from "react";
import { DailyScheduleState } from "@/lib/admin/types";

export function useSchedule(date: string) {
  const [state, setState] = useState<DailyScheduleState>({
    date,
    values: {},
    updatedAt: {},
    updatedBy: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/admin/schedule?date=${encodeURIComponent(date)}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load schedule.");
      }
      const data = (await response.json()) as DailyScheduleState;
      setState({
        date: data.date,
        values: data.values ?? {},
        updatedAt: data.updatedAt ?? {},
        updatedBy: data.updatedBy ?? {},
      });
    } catch (err) {
      console.error(err);
      setError("Could not load schedule.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  const setValue = useCallback(async (key: string, value: string) => {
    const previous = state.values[key] ?? "";
    setState((current) => ({ ...current, values: { ...current.values, [key]: value } }));
    const response = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, key, value }),
    });
    if (!response.ok) {
      setState((current) => ({ ...current, values: { ...current.values, [key]: previous } }));
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error ?? "Failed to update schedule value.");
    }
  }, [date, state.values]);

  useEffect(() => {
    setState((current) => ({ ...current, date }));
    void refresh();
  }, [date, refresh]);

  return {
    state,
    loading,
    error,
    refresh,
    setValue,
  };
}
