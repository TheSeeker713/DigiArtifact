export type AdminSessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  mustChangePassword: boolean;
};

export type DayType = "work" | "light" | "chore";

export type ScheduleBlock = {
  time: string;
  title: string;
  dur: string;
  desc: string;
  type: "together" | "work" | "break" | "exercise" | "off" | "selfcare" | "chore";
  tags?: string[];
  compact?: boolean;
};

export type DailyScheduleState = {
  date: string;
  values: Record<string, string>;
  updatedAt: Record<string, string>;
  updatedBy: Record<string, string | null>;
};

export type StreakState = {
  currentStreak: number;
  bestStreak: number;
  sprintDay: number;
  sprintStart: string | null;
  totalXp: number;
  history: string[];
  updatedBy?: string | null;
  updatedAt?: string;
};

export type ChoreItem = {
  id: string;
  day: "monday" | "thursday" | "friday";
  text: string;
  done: boolean;
  sortOrder: number;
  updatedBy?: string | null;
  updatedAt?: string;
};

export type WeeklyPlanState = {
  top_1: string;
  top_2: string;
  top_3: string;
  notes: string;
  week_of: string | null;
  updatedBy?: string | null;
  updatedAt?: string;
};

export type SyncTimestamps = {
  daily: string;
  streak: string;
  chores: string;
  plan: string;
};
