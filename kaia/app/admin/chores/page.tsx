"use client";

import { useState } from "react";
import { ChoreItem } from "@/lib/admin/types";
import { useChores } from "@/lib/admin/useChores";
import { useSync } from "@/lib/admin/useSync";

const DAY_OPTIONS: Array<{ id: ChoreItem["day"]; label: string }> = [
  { id: "monday", label: "Monday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
];

export default function AdminChoresPage() {
  const [day, setDay] = useState<ChoreItem["day"]>("thursday");
  const [newText, setNewText] = useState("");
  const { items, loading, add, patch, remove, clearDay, refresh } = useChores(day);

  useSync({
    onChoresChange: refresh,
  });

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#3a3628] bg-[#23211a] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c9a84c]">Chore Deck</p>
        <h1 className="mt-1 text-2xl font-semibold">Shared Checklist</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {DAY_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setDay(option.id)}
              className={`rounded-md border px-3 py-2 text-sm ${
                day === option.id
                  ? "border-[#c9a84c] bg-[#1a1812] text-[#e8e2d4]"
                  : "border-[#3a3628] text-[#9b9484] hover:text-[#e8e2d4]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#3a3628] bg-[#23211a] p-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newText.trim()) {
              return;
            }
            void add(newText).then(() => setNewText(""));
          }}
        >
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add chore..."
            className="flex-1 rounded-md border border-[#3a3628] bg-[#1a1812] px-3 py-2 outline-none focus:border-[#c9a84c]"
          />
          <button className="rounded-md bg-[#c9a84c] px-3 py-2 font-medium text-[#1a1812]">Add</button>
          <button
            type="button"
            onClick={() => void clearDay()}
            className="rounded-md border border-[#3a3628] px-3 py-2 text-sm text-[#9b9484] hover:text-[#e8e2d4]"
          >
            Clear Day
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {loading ? <p className="text-sm text-[#9b9484]">Loading chores...</p> : null}
          {items.length === 0 ? <p className="text-sm text-[#9b9484]">No chores yet for this day.</p> : null}
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-md border border-[#3a3628] bg-[#1a1812] px-3 py-2">
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => void patch(item.id, { done: e.target.checked })}
                className="h-4 w-4 accent-[#c9a84c]"
              />
              <span className={`flex-1 text-sm ${item.done ? "text-[#6ba368] line-through" : "text-[#e8e2d4]"}`}>
                {item.text}
              </span>
              <button
                onClick={() => void remove(item.id)}
                className="text-xs text-[#9b9484] hover:text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
