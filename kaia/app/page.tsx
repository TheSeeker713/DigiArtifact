"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_LIST_ID, SECTION_ORDER } from "@/lib/checklist";

type ListSummary = {
  id: string;
  name: string;
  sortOrder: number;
  itemCount: number;
};

type TodoItem = {
  id: string;
  listId: string;
  section: string | null;
  label: string;
  sortOrder: number;
  isChecked: boolean;
  updatedAt: string;
  deletedAt: string | null;
};

type RoutineStep = {
  id: string;
  label: string;
  sortOrder: number;
  durationMinutes: number;
};

type Routine = {
  id: string;
  name: string;
  scheduleWindow: string;
  isActive: boolean;
  steps: RoutineStep[];
};

type GamificationState = {
  profileId: string;
  xp: number;
  level: number;
  momentum: number;
  streakDays: number;
  freezeTokens: number;
};

type TodayProgress = {
  totalItems: number;
  checkedItems: number;
  routinesStarted: number;
};

type PersonalizationData = {
  suggestion: string;
  topSection: string | null;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: {
      transcript: string;
    };
  }>;
};

export default function Home() {
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [activeListId, setActiveListId] = useState<string>("");
  const [items, setItems] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newItemLabel, setNewItemLabel] = useState("");
  const [editingItemId, setEditingItemId] = useState("");
  const [editingLabel, setEditingLabel] = useState("");
  const [newItemSection, setNewItemSection] = useState(SECTION_ORDER[0]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [todayProgress, setTodayProgress] = useState<TodayProgress | null>(null);
  const [personalization, setPersonalization] = useState<PersonalizationData | null>(null);
  const [coachPrompt, setCoachPrompt] = useState("");
  const [coachPhase, setCoachPhase] = useState("pre-task");
  const [coachMessage, setCoachMessage] = useState("");
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const collabCursorRef = useRef(0);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const [voiceError, setVoiceError] = useState("");
  const [voiceTarget, setVoiceTarget] = useState<string | null>(null);

  const supportsVoiceInput = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const globalWindow = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    return Boolean(globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition);
  }, []);

  const loadLists = useCallback(async () => {
    const response = await fetch("/api/lists", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load lists");
    }
    const data = (await response.json()) as { lists: ListSummary[] };
    const nextLists = data.lists ?? [];
    setLists(nextLists);
    if (!activeListId && nextLists.length > 0) {
      const defaultList = nextLists.find((list) => list.id === DEFAULT_LIST_ID);
      setActiveListId(defaultList?.id ?? nextLists[0].id);
    } else if (
      activeListId &&
      nextLists.length > 0 &&
      !nextLists.some((list) => list.id === activeListId)
    ) {
      setActiveListId(nextLists[0].id);
    }
  }, [activeListId]);

  const loadItems = useCallback(async (listId: string) => {
    if (!listId) {
      setItems([]);
      return;
    }
    const response = await fetch(`/api/lists/${listId}/items`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load items");
    }
    const data = (await response.json()) as { items: TodoItem[] };
    setItems(data.items ?? []);
  }, []);

  const loadRoutines = useCallback(async () => {
    const response = await fetch("/api/routines", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load routines");
    }
    const data = (await response.json()) as { routines: Routine[] };
    setRoutines(data.routines ?? []);
  }, []);

  const loadGamification = useCallback(async () => {
    const response = await fetch("/api/gamification", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load gamification");
    }
    const data = (await response.json()) as { state: GamificationState };
    setGamification(data.state ?? null);
  }, []);

  const loadTodayProgress = useCallback(async () => {
    const response = await fetch("/api/progress/today", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load progress");
    }
    const data = (await response.json()) as { today: TodayProgress };
    setTodayProgress(data.today ?? null);
  }, []);

  const loadPersonalization = useCallback(async () => {
    const response = await fetch("/api/personalization", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load personalization");
    }
    const data = (await response.json()) as PersonalizationData;
    setPersonalization(data);
  }, []);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      loadRoutines(),
      loadGamification(),
      loadTodayProgress(),
      loadPersonalization(),
    ]);
  }, [loadGamification, loadPersonalization, loadRoutines, loadTodayProgress]);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        await loadLists();
        await refreshDashboard();
      } catch (error) {
        console.error(error);
        setLoadError("Could not load your lists. Tap retry.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadInitial();
  }, [loadLists, refreshDashboard]);

  useEffect(() => {
    const refreshItems = async () => {
      if (!activeListId) {
        return;
      }
      try {
        await loadItems(activeListId);
      } catch (error) {
        console.error(error);
        setLoadError("Could not load list items.");
      }
    };
    void refreshItems();
  }, [activeListId, loadItems]);

  useEffect(() => {
    if (!activeListId) {
      setIsRealtimeConnected(false);
      collabCursorRef.current = 0;
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cancelled) {
        return;
      }
      try {
        const response = await fetch(
          `/api/collab/${activeListId}/events?since=${collabCursorRef.current}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error("Failed collab poll");
        }

        const data = (await response.json()) as {
          cursor: number;
          events: Array<{ id: number }>;
        };

        collabCursorRef.current = Number(data.cursor ?? collabCursorRef.current);
        if ((data.events ?? []).length > 0) {
          await Promise.all([
            loadItems(activeListId),
            loadLists(),
            loadGamification(),
            loadTodayProgress(),
          ]);
        }
        setIsRealtimeConnected(true);
      } catch (error) {
        console.error(error);
        setIsRealtimeConnected(false);
      } finally {
        if (!cancelled) {
          timer = setTimeout(() => {
            void poll();
          }, 1500);
        }
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [activeListId, loadGamification, loadItems, loadLists, loadTodayProgress]);

  useEffect(() => {
    if (!activeListId) {
      return;
    }
    const interval = setInterval(() => {
      void loadItems(activeListId);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeListId, loadItems]);

  useEffect(() => {
    return () => {
      speechRef.current?.stop();
      speechRef.current = null;
    };
  }, []);

  const counts = useMemo(() => {
    const total = items.length;
    const complete = items.filter((item) => item.isChecked).length;
    return { total, complete };
  }, [items]);

  const isDefaultChecklist = activeListId === DEFAULT_LIST_ID;

  const groupedItems = useMemo(() => {
    if (!isDefaultChecklist) {
      return [
        {
          section: "Tasks",
          items,
        },
      ];
    }

    const sectionMap = new Map<string, TodoItem[]>();
    for (const section of SECTION_ORDER) {
      sectionMap.set(section, []);
    }

    for (const item of items) {
      const section = item.section && item.section.length > 0 ? item.section : "General";
      if (!sectionMap.has(section)) {
        sectionMap.set(section, []);
      }
      sectionMap.get(section)?.push(item);
    }

    return Array.from(sectionMap.entries())
      .map(([section, sectionItems]) => ({ section, items: sectionItems }))
      .filter((group) => group.items.length > 0);
  }, [isDefaultChecklist, items]);

  const withSaving = async (id: string, fn: () => Promise<void>) => {
    setSaving((current) => ({ ...current, [id]: true }));
    try {
      await fn();
    } finally {
      setSaving((current) => ({ ...current, [id]: false }));
    }
  };

  const handleToggle = async (id: string, checked: boolean) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, isChecked: checked } : item))
    );
    setItemErrors((current) => ({ ...current, [id]: "" }));
    await withSaving(id, async () => {
      try {
        const response = await fetch(`/api/items/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isChecked: checked }),
        });
        if (!response.ok) {
          throw new Error("Save failed");
        }
        await loadGamification();
        await loadTodayProgress();
      } catch (error) {
        console.error(error);
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === id ? { ...item, isChecked: !checked } : item
          )
        );
        setItemErrors((current) => ({
          ...current,
          [id]: "Failed to save. Tap again.",
        }));
      }
    });
  };

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) {
      return;
    }
    setIsCreatingList(true);
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        throw new Error("Failed to create list");
      }
      const data = (await response.json()) as { list: ListSummary };
      setNewListName("");
      await loadLists();
      setActiveListId(data.list.id);
      await refreshDashboard();
    } catch (error) {
      console.error(error);
      setLoadError("Could not create list.");
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleRenameList = async () => {
    const activeList = lists.find((list) => list.id === activeListId);
    if (!activeList) {
      return;
    }
    const nextName = window.prompt("Rename list", activeList.name);
    if (!nextName || !nextName.trim()) {
      return;
    }
    try {
      const response = await fetch(`/api/lists/${activeListId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });
      if (!response.ok) {
        throw new Error("Failed to rename list");
      }
      await loadLists();
      await refreshDashboard();
    } catch (error) {
      console.error(error);
      setLoadError("Could not rename list.");
    }
  };

  const handleArchiveList = async () => {
    if (!activeListId || activeListId === DEFAULT_LIST_ID) {
      return;
    }
    if (!window.confirm("Archive this list? You can no longer edit it in this view.")) {
      return;
    }
    try {
      const response = await fetch(`/api/lists/${activeListId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      if (!response.ok) {
        throw new Error("Failed to archive list");
      }
      await loadLists();
      await refreshDashboard();
    } catch (error) {
      console.error(error);
      setLoadError("Could not archive list.");
    }
  };

  const handleAddItem = async () => {
    const label = newItemLabel.trim();
    if (!label || !activeListId) {
      return;
    }
    try {
      const response = await fetch(`/api/lists/${activeListId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          section: isDefaultChecklist ? newItemSection : null,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to add item");
      }
      setNewItemLabel("");
      if (isDefaultChecklist) {
        setNewItemSection(SECTION_ORDER[0]);
      }
      await loadItems(activeListId);
      await loadLists();
      await refreshDashboard();
    } catch (error) {
      console.error(error);
      setLoadError("Could not add item.");
    }
  };

  const startEditingItem = (item: TodoItem) => {
    setEditingItemId(item.id);
    setEditingLabel(item.label);
  };

  const saveEditedItem = async (id: string) => {
    const label = editingLabel.trim();
    if (!label) {
      return;
    }
    await withSaving(id, async () => {
      const response = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!response.ok) {
        setItemErrors((current) => ({ ...current, [id]: "Could not save item." }));
        return;
      }
      setEditingItemId("");
      setEditingLabel("");
      if (activeListId) {
        await loadItems(activeListId);
      }
    });
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm("Delete this item?")) {
      return;
    }
    await withSaving(id, async () => {
      const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setItemErrors((current) => ({ ...current, [id]: "Could not delete item." }));
        return;
      }
      if (activeListId) {
        await loadItems(activeListId);
      }
      await loadLists();
      await refreshDashboard();
    });
  };

  const startRoutine = async (routineId: string) => {
    try {
      const response = await fetch(`/api/routines/${routineId}/start`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to start routine");
      }
      await loadTodayProgress();
      await loadGamification();
    } catch (error) {
      console.error(error);
      setLoadError("Could not start routine.");
    }
  };

  const askKaia = async () => {
    const prompt = coachPrompt.trim();
    if (!prompt) {
      return;
    }
    setIsCoachLoading(true);
    try {
      const response = await fetch("/api/kaia/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, phase: coachPhase }),
      });
      if (!response.ok) {
        throw new Error("Failed to get KAIA message");
      }
      const data = (await response.json()) as {
        message: { response: string };
      };
      setCoachMessage(data.message.response);
    } catch (error) {
      console.error(error);
      setCoachMessage("KAIA is briefly unavailable. Try again in a moment.");
    } finally {
      setIsCoachLoading(false);
    }
  };

  const stopVoiceInput = () => {
    speechRef.current?.stop();
    speechRef.current = null;
    setVoiceTarget(null);
  };

  const startVoiceInput = (
    target: "new" | "edit",
    initialText: string,
    onTranscript: (value: string) => void
  ) => {
    if (!supportsVoiceInput) {
      setVoiceError("Voice input is not supported on this browser.");
      return;
    }

    if (speechRef.current) {
      speechRef.current.stop();
      speechRef.current = null;
    }

    const globalWindow = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const RecognitionCtor =
      globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setVoiceError("Voice input is unavailable.");
      return;
    }

    setVoiceError("");
    setVoiceTarget(target);
    const base = initialText.trim();
    const recognition = new RecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript ?? "";
      }
      const clean = transcript.trim();
      if (!clean) {
        return;
      }
      onTranscript(base ? `${base} ${clean}` : clean);
    };

    recognition.onerror = (event) => {
      setVoiceError(event.error ? `Voice error: ${event.error}` : "Voice input failed.");
      setVoiceTarget(null);
      speechRef.current = null;
    };

    recognition.onend = () => {
      setVoiceTarget((current) => (current === target ? null : current));
      speechRef.current = null;
    };

    speechRef.current = recognition;
    recognition.start();
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-neutral-50 px-4 py-5 text-neutral-900">
      <header className="mb-5 rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Kaia</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {isDefaultChecklist ? "Home Checklist" : "Todo Lists"}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {counts.complete}/{counts.total} completed
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {isRealtimeConnected ? "Live sync on" : "Reconnecting live sync..."}
        </p>
      </header>

      <section className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Level</p>
          <p className="mt-1 text-xl font-semibold">{gamification?.level ?? 1}</p>
          <p className="text-xs text-neutral-600">XP {gamification?.xp ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Momentum</p>
          <p className="mt-1 text-xl font-semibold">{gamification?.momentum ?? 0}</p>
          <p className="text-xs text-neutral-600">
            Routines today {todayProgress?.routinesStarted ?? 0}
          </p>
        </div>
      </section>
      {personalization?.suggestion ? (
        <section className="mb-4 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm">
          {personalization.suggestion}
        </section>
      ) : null}

      <section className="mb-4 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              onClick={() => setActiveListId(list.id)}
              className={`shrink-0 rounded-full px-3 py-2 text-sm ${
                activeListId === list.id
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-300 bg-white text-neutral-700"
              }`}
            >
              {list.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            placeholder="New list name"
            className="h-10 flex-1 rounded-lg border border-neutral-300 px-3 text-sm"
          />
          <button
            type="button"
            onClick={() => void handleCreateList()}
            disabled={isCreatingList}
            className="h-10 rounded-lg bg-neutral-900 px-3 text-sm text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void handleRenameList()}
            disabled={!activeListId}
            className="h-9 rounded-lg border border-neutral-300 px-3 text-xs disabled:opacity-50"
          >
            Rename List
          </button>
          <button
            type="button"
            onClick={() => void handleArchiveList()}
            disabled={!activeListId || activeListId === DEFAULT_LIST_ID}
            className="h-9 rounded-lg border border-rose-300 px-3 text-xs text-rose-700 disabled:opacity-50"
          >
            Archive List
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
          Loading lists...
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
          <section className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold">Routines</h2>
            <div className="space-y-2">
              {routines.length === 0 ? (
                <p className="text-sm text-neutral-500">No routines yet.</p>
              ) : (
                routines.map((routine) => (
                  <div
                    key={routine.id}
                    className="rounded-xl border border-neutral-200 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{routine.name}</p>
                        <p className="text-xs text-neutral-500">
                          {routine.scheduleWindow} · {routine.steps.length} steps
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void startRoutine(routine.id)}
                        className="h-8 rounded-md border border-neutral-300 px-2 text-xs"
                      >
                        Start now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold">KAIA Coach</h2>
            <div className="flex gap-2">
              <input
                value={coachPrompt}
                onChange={(event) => setCoachPrompt(event.target.value)}
                placeholder="What are you trying to do?"
                className="h-10 flex-1 rounded-lg border border-neutral-300 px-3 text-sm"
              />
              <select
                value={coachPhase}
                onChange={(event) => setCoachPhase(event.target.value)}
                className="h-10 rounded-lg border border-neutral-300 bg-white px-2 text-sm"
              >
                <option value="pre-task">Pre</option>
                <option value="during-task">During</option>
                <option value="post-task">Post</option>
              </select>
              <button
                type="button"
                onClick={() => void askKaia()}
                disabled={isCoachLoading}
                className="h-10 rounded-lg bg-neutral-900 px-3 text-sm text-white disabled:opacity-50"
              >
                Ask
              </button>
            </div>
            {coachMessage ? (
              <p className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
                {coachMessage}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex gap-2">
              <input
                value={newItemLabel}
                onChange={(event) => setNewItemLabel(event.target.value)}
                placeholder="Add item..."
                className="h-10 flex-1 rounded-lg border border-neutral-300 px-3 text-sm"
                disabled={!activeListId}
              />
              {supportsVoiceInput ? (
                <button
                  type="button"
                  onClick={() =>
                    voiceTarget === "new"
                      ? stopVoiceInput()
                      : startVoiceInput("new", newItemLabel, setNewItemLabel)
                  }
                  disabled={!activeListId}
                  className="h-10 rounded-lg border border-neutral-300 px-3 text-sm disabled:opacity-50"
                  aria-label="Voice to text for new item"
                >
                  {voiceTarget === "new" ? "Stop Mic" : "Mic"}
                </button>
              ) : null}
              {isDefaultChecklist ? (
                <select
                  value={newItemSection}
                  onChange={(event) => setNewItemSection(event.target.value)}
                  className="h-10 rounded-lg border border-neutral-300 bg-white px-2 text-sm"
                  disabled={!activeListId}
                >
                  {SECTION_ORDER.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              ) : null}
              <button
                type="button"
                onClick={() => void handleAddItem()}
                disabled={!activeListId}
                className="h-10 rounded-lg bg-neutral-900 px-3 text-sm text-white disabled:opacity-50"
              >
                Save
              </button>
            </div>

            <div className="space-y-3">
              {groupedItems.map((group) => (
                <section
                  key={group.section}
                  className="rounded-xl border border-neutral-200 bg-white p-2"
                >
                  <h2 className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">
                    {group.section}
                  </h2>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <div className="rounded-xl px-2 py-2 active:bg-neutral-100">
                          <div className="flex min-h-12 items-center gap-3">
                            <input
                              type="checkbox"
                              checked={item.isChecked}
                              onChange={(event) =>
                                void handleToggle(item.id, event.currentTarget.checked)
                              }
                              className="h-6 w-6 shrink-0 accent-neutral-900"
                              disabled={Boolean(saving[item.id])}
                            />

                            {editingItemId === item.id ? (
                              <div className="flex flex-1 items-center gap-2">
                                <input
                                  value={editingLabel}
                                  onChange={(event) => setEditingLabel(event.target.value)}
                                  className="h-9 flex-1 rounded-lg border border-neutral-300 px-2 text-sm"
                                />
                                {supportsVoiceInput ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      voiceTarget === "edit"
                                        ? stopVoiceInput()
                                        : startVoiceInput("edit", editingLabel, setEditingLabel)
                                    }
                                    className="h-9 rounded-md border border-neutral-300 px-2 text-xs"
                                    aria-label="Voice to text for editing item"
                                  >
                                    {voiceTarget === "edit" ? "Stop Mic" : "Mic"}
                                  </button>
                                ) : null}
                              </div>
                            ) : (
                              <span
                                className={`flex-1 text-[15px] leading-5 ${
                                  item.isChecked
                                    ? "text-neutral-400 line-through"
                                    : "text-neutral-900"
                                }`}
                              >
                                {item.label}
                              </span>
                            )}

                            {editingItemId === item.id ? (
                              <button
                                type="button"
                                onClick={() => void saveEditedItem(item.id)}
                                className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                              >
                                Done
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditingItem(item)}
                                className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                              >
                                Edit
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => void deleteItem(item.id)}
                              className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700"
                            >
                              Delete
                            </button>
                          </div>
                          {saving[item.id] ? (
                            <p className="px-1 text-xs text-neutral-500">Saving...</p>
                          ) : null}
                          {itemErrors[item.id] ? (
                            <p className="px-1 text-xs text-rose-600">{itemErrors[item.id]}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>
          {voiceError ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              {voiceError}
            </section>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
