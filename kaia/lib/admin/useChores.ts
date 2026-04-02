"use client";

import { useCallback, useEffect, useState } from "react";
import { ChoreItem } from "@/lib/admin/types";

export function useChores(day: ChoreItem["day"]) {
  const [items, setItems] = useState<ChoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/admin/chores?day=${encodeURIComponent(day)}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load chores.");
      }
      const data = (await response.json()) as { chores: ChoreItem[] };
      setItems(data.chores ?? []);
    } catch (err) {
      console.error(err);
      setError("Could not load chores.");
    } finally {
      setLoading(false);
    }
  }, [day]);

  const add = useCallback(async (text: string) => {
    const response = await fetch("/api/admin/chores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, text }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error ?? "Failed to add chore.");
    }
    await refresh();
  }, [day, refresh]);

  const patch = useCallback(async (id: string, update: Partial<Pick<ChoreItem, "done" | "sortOrder" | "text">>) => {
    const response = await fetch("/api/admin/chores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        done: update.done,
        sortOrder: update.sortOrder,
        text: update.text,
      }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error ?? "Failed to update chore.");
    }
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const response = await fetch(`/api/admin/chores?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error ?? "Failed to delete chore.");
    }
    await refresh();
  }, [refresh]);

  const clearDay = useCallback(async () => {
    const response = await fetch(`/api/admin/chores?day=${encodeURIComponent(day)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error ?? "Failed to clear chores.");
    }
    await refresh();
  }, [day, refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    loading,
    error,
    refresh,
    add,
    patch,
    remove,
    clearDay,
  };
}
