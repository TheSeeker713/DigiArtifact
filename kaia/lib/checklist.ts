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

export const SECTION_ORDER = [
  "Bathroom",
  "Kitchen",
  "Living Room",
  "Main Bedroom",
];
