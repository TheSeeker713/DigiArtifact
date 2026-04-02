"use client";

import { DAY_LABELS, DAY_TYPES, getScheduleByDayType } from "@/lib/admin/constants";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminWeekPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#3a3628] bg-[#23211a] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c9a84c]">Week At A Glance</p>
        <h1 className="mt-1 text-2xl font-semibold">Schedule Blueprint</h1>
        <p className="mt-2 text-sm text-[#9b9484]">
          This view is the canonical rhythm. Team edits and checkoffs happen in Today and Chores.
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        {DAY_NAMES.map((name, index) => {
          const dayType = DAY_TYPES[index];
          const blocks = getScheduleByDayType(dayType);
          return (
            <article key={name} className="rounded-xl border border-[#3a3628] bg-[#23211a] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c9a84c]">{name}</p>
              <p className="mt-1 text-lg font-semibold">{DAY_LABELS[dayType]}</p>
              <p className="mt-2 text-sm text-[#9b9484]">{blocks.length} blocks</p>
              <ul className="mt-3 space-y-1 text-sm text-[#e8e2d4]">
                {blocks.slice(0, 4).map((block) => (
                  <li key={`${name}-${block.time}-${block.title}`}>
                    <span className="font-mono text-xs text-[#c9a84c]">{block.time}</span> {block.title}
                  </li>
                ))}
                {blocks.length > 4 ? <li className="text-[#9b9484]">...and {blocks.length - 4} more</li> : null}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
