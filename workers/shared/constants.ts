// ==========================================
// LEVELING SYSTEM
// ==========================================

export interface LevelDefinition {
  level: number;
  xp: number;
  title: string;
  color: string;
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, xp: 0, title: 'Apprentice', color: '#a0a0a0' },
  { level: 2, xp: 100, title: 'Worker', color: '#4ade80' },
  { level: 3, xp: 300, title: 'Craftsman', color: '#22c55e' },
  { level: 4, xp: 600, title: 'Journeyman', color: '#3b82f6' },
  { level: 5, xp: 1000, title: 'Artisan', color: '#6366f1' },
  { level: 6, xp: 1500, title: 'Expert', color: '#8b5cf6' },
  { level: 7, xp: 2500, title: 'Master', color: '#a855f7' },
  { level: 8, xp: 4000, title: 'Grandmaster', color: '#cca43b' },
  { level: 9, xp: 6000, title: 'Legend', color: '#f59e0b' },
  { level: 10, xp: 10000, title: 'Mythic', color: '#ef4444' },
];

// Derived array for simple backend math (e.g., [0, 100, 300...])
export const LEVEL_THRESHOLDS = LEVEL_DEFINITIONS.map(l => l.xp);

// ==========================================
// XP REWARDS
// ==========================================

export const XP_CONFIG = {
  clockIn: 10,
  clockOut: 20,
  hourWorked: 50,
  streakDay: 25,
  streak3Days: 100,
  streak7Days: 250,
  streak30Days: 1000,
  focusSessionComplete: 30,
  taskComplete: 15,
  noteCreated: 5,
  earlyArrival: 50,
  fullWeek: 500,
};
