"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_LIST_ID } from "@/lib/checklist";

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
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        await loadLists();
      } catch (error) {
        console.error(error);
        setLoadError("Could not load your lists. Tap retry.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadInitial();
  }, [loadLists]);

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

  const counts = useMemo(() => {
    const total = items.length;
    const complete = items.filter((item) => item.isChecked).length;
    return { total, complete };
  }, [items]);

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
        body: JSON.stringify({ label }),
      });
      if (!response.ok) {
        throw new Error("Failed to add item");
      }
      setNewItemLabel("");
      await loadItems(activeListId);
      await loadLists();
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
    });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-neutral-50 px-4 py-5 text-neutral-900">
      <header className="mb-5 rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Kaia</p>
        <h1 className="mt-1 text-2xl font-semibold">Todo Lists</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {counts.complete}/{counts.total} completed
        </p>
      </header>

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
            <div className="mb-3 flex gap-2">
              <input
                value={newItemLabel}
                onChange={(event) => setNewItemLabel(event.target.value)}
                placeholder="Add item..."
                className="h-10 flex-1 rounded-lg border border-neutral-300 px-3 text-sm"
                disabled={!activeListId}
              />
              <button
                type="button"
                onClick={() => void handleAddItem()}
                disabled={!activeListId}
                className="h-10 rounded-lg bg-neutral-900 px-3 text-sm text-white disabled:opacity-50"
              >
                Save
              </button>
            </div>

            <ul className="space-y-1">
              {items.map((item) => (
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
                        <input
                          value={editingLabel}
                          onChange={(event) => setEditingLabel(event.target.value)}
                          className="h-9 flex-1 rounded-lg border border-neutral-300 px-2 text-sm"
                        />
                      ) : (
                        <span
                          className={`flex-1 text-[15px] leading-5 ${
                            item.isChecked ? "text-neutral-400 line-through" : "text-neutral-900"
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
        </div>
      ) : null}
    </main>
  );
}
