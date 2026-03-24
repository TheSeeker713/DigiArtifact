export type ChecklistItem = {
  id: string;
  section: string;
  label: string;
  sortOrder: number;
  isChecked: boolean;
  updatedAt: string;
};

export type ChecklistSection = {
  section: string;
  items: ChecklistItem[];
};

export type TodoList = {
  id: string;
  name: string;
  sortOrder: number;
  itemCount: number;
};

export type TodoItem = {
  id: string;
  listId: string;
  section: string | null;
  label: string;
  sortOrder: number;
  isChecked: boolean;
  updatedAt: string;
  deletedAt: string | null;
};

export const SECTION_ORDER: string[] = [
  "Bathroom",
  "Kitchen",
  "Living Room",
  "Main Bedroom",
];

export const DEFAULT_LIST_ID = "default_home_checklist";
export const DEFAULT_LIST_NAME = "Home Checklist";

export function normalizeSortOrder(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

export function sanitizeLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidEntityId(value: string) {
  return /^[a-zA-Z0-9_-]{1,100}$/.test(value);
}
