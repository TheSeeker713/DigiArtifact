"use client";

import { useEffect, useRef } from "react";
import { SyncTimestamps } from "@/lib/admin/types";

type SyncHandlers = {
  onDailyChange?: () => void | Promise<void>;
  onStreakChange?: () => void | Promise<void>;
  onChoresChange?: () => void | Promise<void>;
  onPlanChange?: () => void | Promise<void>;
  intervalMs?: number;
};

const EMPTY: SyncTimestamps = {
  daily: "",
  streak: "",
  chores: "",
  plan: "",
};

export function useSync(handlers: SyncHandlers) {
  const cacheRef = useRef<SyncTimestamps>(EMPTY);
  const runningRef = useRef(false);
  const {
    onDailyChange,
    onStreakChange,
    onChoresChange,
    onPlanChange,
    intervalMs = 5000,
  } = handlers;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const loop = async () => {
      if (cancelled || runningRef.current) {
        return;
      }
      runningRef.current = true;
      try {
        const response = await fetch("/api/admin/sync", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { sync: SyncTimestamps };
        const next = data.sync ?? EMPTY;
        const prev = cacheRef.current;

        if (prev.daily && next.daily !== prev.daily) {
          await onDailyChange?.();
        }
        if (prev.streak && next.streak !== prev.streak) {
          await onStreakChange?.();
        }
        if (prev.chores && next.chores !== prev.chores) {
          await onChoresChange?.();
        }
        if (prev.plan && next.plan !== prev.plan) {
          await onPlanChange?.();
        }

        cacheRef.current = next;
      } catch (error) {
        console.error("Admin sync poll failed", error);
      } finally {
        runningRef.current = false;
        if (!cancelled) {
          timer = setTimeout(() => void loop(), intervalMs);
        }
      }
    };

    void loop();
    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [intervalMs, onChoresChange, onDailyChange, onPlanChange, onStreakChange]);
}
