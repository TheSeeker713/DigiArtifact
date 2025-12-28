/**
 * Drizzle ORM Schema for DigiArtifact Workers Portal
 * Based on schema.sql - Cloudflare D1 (SQLite) compatible
 */

import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================
// 1. CORE SYSTEM (Users, Projects, Auth)
// ============================================

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: text('role', { enum: ['admin', 'worker'] }).default('worker').notNull(),
    active: integer('active', { mode: 'boolean' }).default(true).notNull(),
    googleId: text('google_id').unique(),
    googlePicture: text('google_picture'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
  })
);

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#cca43b').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const timeEntries = sqliteTable(
  'time_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
    clockIn: text('clock_in').notNull(),
    clockOut: text('clock_out'),
    breakMinutes: integer('break_minutes').default(0).notNull(),
    notes: text('notes'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    userClockInIdx: index('idx_time_entries_user').on(table.userId, table.clockIn),
  })
);

export const breaks = sqliteTable('breaks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timeEntryId: integer('time_entry_id')
    .notNull()
    .references(() => timeEntries.id, { onDelete: 'cascade' }),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  content: text('content'),
  richContent: text('rich_content'),
  source: text('source').notNull(),
  sourceId: text('source_id'),
  tags: text('tags'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================
// 2. GAMIFICATION ENGINE (XP, Streaks)
// ============================================

export const userGamification = sqliteTable(
  'user_gamification',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    totalXp: integer('total_xp').default(0).notNull(),
    level: integer('level').default(1).notNull(),
    currentStreak: integer('current_streak').default(0).notNull(),
    longestStreak: integer('longest_streak').default(0).notNull(),
    lastActivityDate: text('last_activity_date'),
    totalWorkMinutes: integer('total_work_minutes').default(0).notNull(),
    totalSessions: integer('total_sessions').default(0).notNull(),
    focusSessions: integer('focus_sessions').default(0).notNull(),
    achievements: text('achievements').default('[]').notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    streakIdx: index('idx_gamification_streak').on(table.currentStreak),
  })
);

export const xpTransactions = sqliteTable('xp_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  actionType: text('action_type').default('general').notNull(),
  blockId: integer('block_id'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================
// 3. SCHEDULER (Shifts, Blocks, Templates)
// ============================================

export const shifts = sqliteTable(
  'shifts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    shiftDate: text('shift_date').notNull(),
    plannedStartTime: text('planned_start_time').notNull(),
    plannedEndTime: text('planned_end_time').notNull(),
    actualStartTime: text('actual_start_time'),
    actualEndTime: text('actual_end_time'),
    status: text('status').default('scheduled').notNull(),
    xpEarned: integer('xp_earned').default(0).notNull(),
    notes: text('notes'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    userShiftDateUnique: unique('user_shift_date_unique').on(table.userId, table.shiftDate),
  })
);

export const scheduleBlocks = sqliteTable(
  'schedule_blocks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    shiftId: integer('shift_id')
      .notNull()
      .references(() => shifts.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    plannedStartTime: text('planned_start_time').notNull(),
    plannedEndTime: text('planned_end_time').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    blockType: text('block_type', { enum: ['WORK', 'BREAK', 'LUNCH', 'FLEX'] }).notNull(),
    orderIndex: integer('order_index').notNull(),
    status: text('status').default('pending').notNull(),
    projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
    activityLabel: text('activity_label'),
    notes: text('notes'),
    xpEarned: integer('xp_earned').default(0).notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    shiftIdx: index('idx_blocks_shift').on(table.shiftId),
  })
);

export const blockTemplates = sqliteTable('block_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  templateName: text('template_name').notNull(),
  description: text('description'),
  blocksJson: text('blocks_json').notNull(),
  totalWorkMinutes: integer('total_work_minutes').default(0).notNull(),
  totalBreakMinutes: integer('total_break_minutes').default(0).notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false).notNull(),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Type exports for use in routes
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type Break = typeof breaks.$inferSelect;
export type NewBreak = typeof breaks.$inferInsert;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;
export type UserGamification = typeof userGamification.$inferSelect;
export type NewUserGamification = typeof userGamification.$inferInsert;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type NewXpTransaction = typeof xpTransactions.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;
export type ScheduleBlock = typeof scheduleBlocks.$inferSelect;
export type NewScheduleBlock = typeof scheduleBlocks.$inferInsert;
export type BlockTemplate = typeof blockTemplates.$inferSelect;
export type NewBlockTemplate = typeof blockTemplates.$inferInsert;

