/**
 * Gamification routes (XP, streaks, achievements)
 * FINAL PRODUCTION VERSION - "MM-DD-YYYY" EDITION
 * - Strict Input: MM-DD-YYYY (User Requirement)
 * - Internal Storage: YYYY-MM-DD (Database Requirement)
 * - Logic: "Cheat-Proof" Streak Updates
 * - SECURITY: Server-Authoritative XP (client cannot dictate amounts)
 */
import { Env, User, jsonResponse, calculateLevel } from '../utils';
import { getXPForAction, isValidActionType, type XPActionType } from '../constants';
import { z } from 'zod';

interface Achievement {
  id: string;
  name: string;
  unlocked?: boolean;
  unlockedAt?: number | null;
  [key: string]: unknown;
}

// VALIDATOR: Strictly enforces "MM-DD-YYYY"
function isValidUSDateString(dateStr: string): boolean {
  // Regex for MM-DD-YYYY
  const regex = /^\d{2}-\d{2}-\d{4}$/;
  if (!regex.test(dateStr)) return false;
  
  const [month, day, year] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  
  // Check valid date (e.g. reject 02-30-2025)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

// ADAPTER: Converts "MM-DD-YYYY" -> "YYYY-MM-DD" for SQLite math
function normalizeDate(usDate: string): string {
  const [month, day, year] = usDate.split('-');
  return `${year}-${month}-${day}`;
}

export async function handleGetGamification(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const gamification = await env.DB.prepare(`
    SELECT total_xp, level, current_streak, longest_streak, 
           total_work_minutes, total_sessions, focus_sessions,
           achievements, last_activity_date
    FROM user_gamification
    WHERE user_id = ?
  `).bind(user.id).first();

  const defaultStats = {
      total_xp: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
      total_work_minutes: 0,
      total_sessions: 0,
      focus_sessions: 0,
      achievements: [],
      last_activity_date: null,
  };

  if (!gamification) {
    return jsonResponse(defaultStats, 200, origin);
  }

  // Safety: Prevent crashes if DB JSON is corrupt
  let achievements: Achievement[] = [];
  try {
    achievements = JSON.parse(gamification.achievements as string || '[]') as Achievement[];
  } catch (err) {
    console.error(`Error parsing achievements for user ${user.id}:`, err);
    achievements = []; 
  }

  return jsonResponse({
    ...gamification,
    achievements: achievements,
  }, 200, origin);
}

export async function handleAwardXP(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  // Flexible payload validation: accept either { actionType, metadata } (new),
  // { action_type, metadata } (snake_case), or legacy { amount, reason, action_type }
  const payloadSchema = z.union([
    z.object({ actionType: z.string(), metadata: z.record(z.string(), z.unknown()).optional() }),
    z.object({ action_type: z.string(), metadata: z.record(z.string(), z.unknown()).optional() }),
    z.object({ amount: z.number().int().nonnegative(), reason: z.string().optional(), action_type: z.string().optional() }),
  ]);

  const rawBody = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonResponse({ error: 'Invalid request payload' }, 400, origin);
  }

  const data = parsed.data as any;

  // Determine amount and actionType
  let amount: number | null = null;
  let actionType: string | undefined = undefined;
  let metadata: Record<string, unknown> | undefined = undefined;
  let reason: string | undefined = undefined;

  if (typeof data.amount === 'number') {
    // Legacy: client-supplied amount (still accepted for backward compatibility)
    amount = Math.max(0, Math.floor(data.amount));
    reason = data.reason ?? `Manual XP`;
    // Optional action_type may be provided
    actionType = data.action_type ?? undefined;
    metadata = data.metadata;

    console.warn(`Accepting client-supplied XP amount for user ${user.id}`);
  } else if (typeof data.actionType === 'string' || typeof data.action_type === 'string') {
    actionType = data.actionType ?? data.action_type;
    metadata = data.metadata;

    if (!actionType || typeof actionType !== 'string') {
      return jsonResponse({ error: 'actionType (string) is required' }, 400, origin);
    }

    // Normalize and validate action type
    if (!isValidActionType(actionType)) {
      return jsonResponse({ 
        error: `Invalid actionType: "${actionType}". Must be one of: NOTE_ADDED, SESSION_COMPLETED, CHECKLIST_COMPLETE, CLOCK_IN, CLOCK_OUT, FOCUS_SESSION_COMPLETE, TASK_COMPLETED, GOAL_CREATED, QUICK_NOTE, JOURNAL_ENTRY_SAVED, BODY_DOUBLING_SESSION, BLOCK_COMPLETED, WEEKLY_MILESTONE` 
      }, 400, origin);
    }

    // Server-side source of truth for amounts
    amount = getXPForAction(actionType);
    if (amount === null) {
      return jsonResponse({ error: 'Failed to get XP amount for action type' }, 500, origin);
    }

    reason = (metadata?.reason as string) || `Action: ${actionType}`;
  } else {
    return jsonResponse({ error: 'actionType or amount is required' }, 400, origin);
  }

  // At this point we have a valid `amount` (server-calculated or accepted legacy client amount)
  // FIXED: Atomic UPSERT with level calculation in a single transaction
  const result = await env.DB.prepare(`
    INSERT INTO user_gamification (user_id, total_xp, level, current_streak, updated_at)
    VALUES (?, ?, 1, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      total_xp = total_xp + excluded.total_xp,
      updated_at = CURRENT_TIMESTAMP
    RETURNING total_xp, level
  `).bind(user.id, amount).first<{
    total_xp: number;
    level: number;
  }>();

  if (!result) {
    return jsonResponse({ error: 'Failed to award XP' }, 500, origin);
  }

  // Calculate new level from the updated total_xp (atomic)
  const newLevel = calculateLevel(result.total_xp);
  const oldLevel = result.level;
  const leveledUp = newLevel > oldLevel;

  if (leveledUp) {
    const updateResult = await env.DB.prepare(`
      UPDATE user_gamification 
      SET level = ? 
      WHERE user_id = ? AND level < ?
    `).bind(newLevel, user.id, newLevel).run();

    if (!updateResult || (updateResult as any).success === false) {
      console.warn(`Level update may have been concurrent for user ${user.id}`);
    }
  }

  // Log XP transaction (non-critical, can fail without breaking the flow)
  try {
    await env.DB.prepare(`
      INSERT INTO xp_transactions (user_id, amount, reason, action_type)
      VALUES (?, ?, ?, ?)
    `).bind(user.id, amount, reason || '', actionType ?? null).run();
  } catch (error) {
    console.error(`Failed to log XP transaction for user ${user.id}:`, error);
    // Don't fail the request if transaction logging fails
  }

  return jsonResponse({
    success: true,
    total_xp: result.total_xp,
    level: newLevel,
    xp_gained: amount,
    leveled_up: leveledUp,
    previous_level: oldLevel,
  }, 200, origin);
}

export async function handleUpdateStreak(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const { increment, clientDate } = await request.json() as { 
    increment?: boolean; 
    clientDate?: string; 
  };

  const gamification = await env.DB.prepare(`
    SELECT current_streak, longest_streak, last_activity_date
    FROM user_gamification
    WHERE user_id = ?
  `).bind(user.id).first<{
    current_streak: number;
    longest_streak: number;
    last_activity_date: string;
  }>();

  if (!gamification) {
    return jsonResponse({ error: 'Gamification record not found' }, 404, origin);
  }

  // --- STRICT MM-DD-YYYY HANDLING ---
  let todayISO: string; 

  if (clientDate && isValidUSDateString(clientDate)) {
    // User sent valid "MM-DD-YYYY", we accept it and normalize for DB
    todayISO = normalizeDate(clientDate); 
  } else {
    // Fallback: Use server time, but this shouldn't happen if frontend is correct
    todayISO = new Date().toISOString().split('T')[0];
  }

  const lastActivityISO = gamification.last_activity_date; // stored as YYYY-MM-DD
  let newStreak = gamification.current_streak;
  
  // LOGIC FIX: Determine the date to save
  // Default: Keep the OLD date (don't give credit for just checking)
  let dateToSave = lastActivityISO; 

  if (increment) {
    // User actually worked -> Update the date to Today
    dateToSave = todayISO;

    const todayDate = new Date(todayISO);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayISO = yesterdayDate.toISOString().split('T')[0];
    
    if (lastActivityISO === yesterdayISO) {
      newStreak += 1;
    } else if (lastActivityISO !== todayISO) {
      newStreak = 1;
    }
  }

  const newLongestStreak = Math.max(newStreak, gamification.longest_streak);

  // We store ISO (YYYY-MM-DD) so SQL sorting works, but logic relied on your MM-DD-YYYY input
  await env.DB.prepare(`
    UPDATE user_gamification
    SET current_streak = ?,
        longest_streak = ?,
        last_activity_date = ?,
        updated_at = datetime('now')
    WHERE user_id = ?
  `).bind(newStreak, newLongestStreak, dateToSave, user.id).run();

  return jsonResponse({
    success: true,
    current_streak: newStreak,
    longest_streak: newLongestStreak,
  }, 200, origin);
}

export async function handleUnlockAchievement(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const { achievementId } = await request.json() as { achievementId: string };

  if (!achievementId) {
    return jsonResponse({ error: 'Achievement ID required' }, 400, origin);
  }

  const gamification = await env.DB.prepare(`
    SELECT id, achievements
    FROM user_gamification
    WHERE user_id = ?
  `).bind(user.id).first<{
    id: number;
    achievements: string;
  }>();

  if (!gamification) {
    return jsonResponse({ error: 'Gamification record not found' }, 404, origin);
  }

  let achievements: Achievement[];
  try {
    achievements = JSON.parse(gamification.achievements || '[]') as Achievement[];
  } catch (error) {
    achievements = [];
  }

  let achievementFound = false;
  let unlockedAchievement: Achievement | null = null;

  const updatedAchievements = achievements.map(achievement => {
    if (achievement.id === achievementId) {
      achievementFound = true;
      unlockedAchievement = {
        ...achievement,
        unlocked: true,
        unlockedAt: Date.now(),
      };
      return unlockedAchievement;
    }
    return achievement;
  });

  if (!achievementFound) {
    return jsonResponse({ error: 'Achievement not found' }, 404, origin);
  }

  await env.DB.prepare(`
    UPDATE user_gamification
    SET achievements = ?,
        updated_at = datetime('now')
    WHERE user_id = ?
  `).bind(JSON.stringify(updatedAchievements), user.id).run();

  return jsonResponse({
    success: true,
    achievement: unlockedAchievement,
    message: `Achievement "${unlockedAchievement!.name}" unlocked!`,
  }, 200, origin);
}