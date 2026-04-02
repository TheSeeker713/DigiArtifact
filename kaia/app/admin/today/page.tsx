"use client";

import { useMemo } from "react";
import {
  DAY_LABELS,
  DAY_TYPES,
  XP_VALUES,
  getKaiaMessage,
  getScheduleByDayType,
} from "@/lib/admin/constants";
import { useSchedule } from "@/lib/admin/useSchedule";
import { useStreak } from "@/lib/admin/useStreak";
import { useSync } from "@/lib/admin/useSync";
import { useAlarms } from "@/lib/admin/useAlarms";

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export default function AdminTodayPage() {
  const date = todayString();
  const dayType = DAY_TYPES[new Date().getDay()];
  const schedule = getScheduleByDayType(dayType);

  const { state, loading, setValue, refresh } = useSchedule(date);
  const { state: streak, update, refresh: refreshStreak } = useStreak();
  useAlarms(dayType);

  useSync({
    onDailyChange: refresh,
    onStreakChange: refreshStreak,
  });

  const completedCount = useMemo(
    () => schedule.filter((_, index) => state.values[`block_${index}_done`] === "1").length,
    [schedule, state.values]
  );

  const onCheckIn = async () => {
    if (state.values.checked_in === "1") {
      return;
    }
    await setValue("checked_in", "1");
    const history = [...(streak.history ?? []), date].slice(-120);
    await update({
      currentStreak: streak.currentStreak + 1,
      bestStreak: Math.max(streak.bestStreak, streak.currentStreak + 1),
      history,
      deltaXp: XP_VALUES.DAILY_CHECKIN,
    });
  };

  const onToggleBlock = async (index: number) => {
    const key = `block_${index}_done`;
    const next = state.values[key] === "1" ? "0" : "1";
    await setValue(key, next);
    await update({ deltaXp: next === "1" ? XP_VALUES.BLOCK_COMPLETE : -XP_VALUES.BLOCK_COMPLETE });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#3a3628] bg-[#23211a] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c9a84c]">
          {date} · {DAY_LABELS[dayType]}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Today Dashboard</h1>
        <p className="mt-2 text-sm text-[#9b9484]">{getKaiaMessage(completedCount > 0 ? "streak" : "morning")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => void onCheckIn()}
            className="rounded-md border border-[#3a3628] bg-[#1a1812] px-3 py-2 text-sm hover:border-[#c9a84c]"
          >
            {state.values.checked_in === "1" ? "Checked in" : "Check in day"}
          </button>
          <span className="text-sm text-[#9b9484]">
            Blocks complete: {completedCount}/{schedule.length}
          </span>
          <span className="text-sm text-[#9b9484]">XP: {streak.totalXp}</span>
        </div>
      </section>

      <section className="space-y-2">
        {loading ? <p className="text-sm text-[#9b9484]">Loading schedule...</p> : null}
        {schedule.map((block, index) => {
          const key = `block_${index}_done`;
          const done = state.values[key] === "1";
          return (
            <button
              key={`${block.time}-${block.title}`}
              onClick={() => void onToggleBlock(index)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                done
                  ? "border-[#6ba368] bg-[#1f2a1f]"
                  : "border-[#3a3628] bg-[#23211a] hover:border-[#c9a84c]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-[#c9a84c]">{block.time}</p>
                  <p className="text-base font-medium">{block.title}</p>
                  <p className="text-sm text-[#9b9484]">{block.desc}</p>
                </div>
                <div className="text-right text-sm text-[#9b9484]">
                  <p>{block.dur}</p>
                  <p>{done ? "Done" : "Pending"}</p>
                </div>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}
