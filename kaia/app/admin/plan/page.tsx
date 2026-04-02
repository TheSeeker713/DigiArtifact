"use client";

import { useEffect, useState } from "react";
import { usePlan } from "@/lib/admin/usePlan";
import { useSync } from "@/lib/admin/useSync";

export default function AdminPlanPage() {
  const { plan, loading, update, refresh } = usePlan();
  const [saving, setSaving] = useState(false);

  useSync({
    onPlanChange: refresh,
  });

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#3a3628] bg-[#23211a] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c9a84c]">Weekly Planning</p>
        <h1 className="mt-1 text-2xl font-semibold">Top 3 + Brain Dump</h1>
        {loading ? <p className="mt-2 text-sm text-[#9b9484]">Loading plan...</p> : null}
      </section>

      <section className="space-y-3 rounded-xl border border-[#3a3628] bg-[#23211a] p-4">
        <EditableField
          label="Top Priority #1"
          value={plan.top_1}
          onSave={async (value) => {
            setSaving(true);
            await update({ top_1: value });
            setSaving(false);
          }}
        />
        <EditableField
          label="Top Priority #2"
          value={plan.top_2}
          onSave={async (value) => {
            setSaving(true);
            await update({ top_2: value });
            setSaving(false);
          }}
        />
        <EditableField
          label="Top Priority #3"
          value={plan.top_3}
          onSave={async (value) => {
            setSaving(true);
            await update({ top_3: value });
            setSaving(false);
          }}
        />

        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-[#9b9484]">Week notes / brain dump</p>
          <textarea
            value={plan.notes}
            onChange={(e) => void update({ notes: e.target.value })}
            rows={10}
            className="w-full rounded-md border border-[#3a3628] bg-[#1a1812] px-3 py-2 text-sm outline-none focus:border-[#c9a84c]"
          />
        </div>

        <p className="text-xs text-[#9b9484]">{saving ? "Saving..." : "All changes sync across both admin users."}</p>
      </section>
    </div>
  );
}

function EditableField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-[#9b9484]">{label}</p>
      <div className="flex gap-2">
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className="flex-1 rounded-md border border-[#3a3628] bg-[#1a1812] px-3 py-2 text-sm outline-none focus:border-[#c9a84c]"
        />
        <button
          onClick={() => void onSave(local)}
          className="rounded-md border border-[#3a3628] px-3 py-2 text-sm text-[#c9a84c] hover:border-[#c9a84c]"
        >
          Save
        </button>
      </div>
    </div>
  );
}
