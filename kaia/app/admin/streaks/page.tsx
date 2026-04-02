"use client";

import { useMemo } from "react";
import { useStreak } from "@/lib/admin/useStreak";

function lastDays(days: number) {
  const out: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return out;
}

export default function AdminStreaksPage() {
  const { state, loading, levelMeta, update } = useStreak();
  const days = useMemo(() => lastDays(60), []);
  const historySet = useMemo(() => new Set(state.history ?? []), [state.history]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#3a3628] bg-[#23211a] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c9a84c]">Streak Engine</p>
        <h1 className="mt-1 text-2xl font-semibold">Momentum Tracker</h1>
        {loading ? <p className="mt-2 text-sm text-[#9b9484]">Loading streak...</p> : null}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Current streak" value={String(state.currentStreak)} />
          <Stat label="Best streak" value={String(state.bestStreak)} />
          <Stat label="Sprint day" value={String(state.sprintDay)} />
          <Stat label="Total XP" value={String(state.totalXp)} />
        </div>
        <div className="mt-4 rounded-lg border border-[#3a3628] bg-[#1a1812] p-3">
          <p className="text-sm font-medium">
            Level: {levelMeta.current.name}
            {levelMeta.next ? ` -> ${levelMeta.next.name}` : " (max)"}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded bg-[#3a3628]">
            <div
              className="h-full bg-[#c9a84c]"
              style={{ width: `${Math.max(0, Math.min(100, levelMeta.progress * 100))}%` }}
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => void update({ sprintDay: 0, sprintStart: new Date().toISOString().slice(0, 10) })}
            className="rounded-md border border-[#3a3628] px-3 py-2 text-sm hover:border-[#c9a84c]"
          >
            Reset Sprint
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[#3a3628] bg-[#23211a] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c9a84c]">Last 60 Days</p>
        <div className="mt-3 grid grid-cols-12 gap-1">
          {days.map((day) => {
            const active = historySet.has(day);
            return (
              <div
                key={day}
                title={day}
                className={`h-4 rounded ${
                  active ? "bg-[#6ba368]" : "bg-[#3a3628]"
                }`}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#3a3628] bg-[#1a1812] p-3">
      <p className="text-xs uppercase tracking-wide text-[#9b9484]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
