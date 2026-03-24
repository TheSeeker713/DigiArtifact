"use client";

import { useEffect, useMemo, useState } from "react";
import { ChecklistSection } from "@/lib/checklist";

type ApiResponse = {
  sections: ChecklistSection[];
};

type SavingMap = Record<string, boolean>;
type ErrorMap = Record<string, string>;

export default function Home() {
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState<SavingMap>({});
  const [itemErrors, setItemErrors] = useState<ErrorMap>({});

  useEffect(() => {
    const loadChecklist = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await fetch("/api/checklist", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load checklist.");
        }
        const data = (await response.json()) as ApiResponse;
        setSections(data.sections ?? []);
      } catch (error) {
        console.error(error);
        setLoadError("Could not load checklist. Tap retry.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadChecklist();
  }, []);

  const counts = useMemo(() => {
    const total = sections.reduce((sum, section) => sum + section.items.length, 0);
    const complete = sections.reduce(
      (sum, section) => sum + section.items.filter((item) => item.isChecked).length,
      0
    );
    return { total, complete };
  }, [sections]);

  const handleToggle = async (id: string, checked: boolean) => {
    setSections((currentSections) =>
      currentSections.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.id === id ? { ...item, isChecked: checked } : item
        ),
      }))
    );

    setSaving((current) => ({ ...current, [id]: true }));
    setItemErrors((current) => ({ ...current, [id]: "" }));

    try {
      const response = await fetch(`/api/checklist/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isChecked: checked }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }
    } catch (error) {
      console.error(error);
      setSections((currentSections) =>
        currentSections.map((section) => ({
          ...section,
          items: section.items.map((item) =>
            item.id === id ? { ...item, isChecked: !checked } : item
          ),
        }))
      );
      setItemErrors((current) => ({
        ...current,
        [id]: "Failed to save. Tap again.",
      }));
    } finally {
      setSaving((current) => ({ ...current, [id]: false }));
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-neutral-50 px-4 py-5 text-neutral-900">
      <header className="mb-5 rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Kaia</p>
        <h1 className="mt-1 text-2xl font-semibold">Home Checklist</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {counts.complete}/{counts.total} completed
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
          Loading checklist...
        </div>
      ) : null}

      {!isLoading && loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{loadError}</p>
          <button
            type="button"
            className="mt-3 h-10 rounded-lg border border-rose-300 px-3 text-sm font-medium"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !loadError ? (
        <div className="space-y-4 pb-6">
          {sections.map((section) => (
            <section
              key={section.section}
              className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm"
            >
              <h2 className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">
                {section.section}
              </h2>

              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <label className="flex min-h-12 items-center gap-3 rounded-xl px-2 py-2 active:bg-neutral-100">
                      <input
                        type="checkbox"
                        checked={item.isChecked}
                        onChange={(event) =>
                          void handleToggle(item.id, event.currentTarget.checked)
                        }
                        className="h-6 w-6 shrink-0 accent-neutral-900"
                        disabled={Boolean(saving[item.id])}
                      />
                      <span
                        className={`flex-1 text-[15px] leading-5 ${
                          item.isChecked ? "text-neutral-400 line-through" : "text-neutral-900"
                        }`}
                      >
                        {item.label}
                      </span>
                      {saving[item.id] ? (
                        <span className="text-xs text-neutral-500">Saving...</span>
                      ) : null}
                    </label>
                    {itemErrors[item.id] ? (
                      <p className="px-2 pb-1 text-xs text-rose-600">{itemErrors[item.id]}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </main>
  );
}
