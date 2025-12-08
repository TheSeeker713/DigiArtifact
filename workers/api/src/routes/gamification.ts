/**
 * Gamification routes (XP, streaks, achievements)
 */
import { Env, User, jsonResponse, calculateLevel } from '../utils';

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

  if (!gamification) {
    // Return a sane default so the frontend can initialize without a persisted row
    return jsonResponse({
      total_xp: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
      total_work_minutes: 0,
      total_sessions: 0,
      focus_sessions: 0,
      achievements: [],
      last_activity_date: null,
    }, 200, origin);
  }

  return jsonResponse({
    ...gamification,
    achievements: JSON.parse(gamification.achievements as string || '[]'),
  }, 200, origin);
}

export async function handleAwardXP(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const { amount, reason, action_type } = await request.json() as {
    amount: number;
    reason: string;
    action_type?: string;
  };

  if (!amount || amount < 0) {
    return jsonResponse({ error: 'Valid XP amount required' }, 400, origin);
  }

  // Atomic UPSERT: Insert new row or add to existing XP total
  const result = await env.DB.prepare(`
    INSERT INTO user_gamification (user_id, total_xp, current_streak, updated_at)
    VALUES (?, ?, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      total_xp = total_xp + excluded.total_xp,
      updated_at = CURRENT_TIMESTAMP
    RETURNING total_xp, current_streak
  `).bind(user.id, amount).first<{
    total_xp: number;
    current_streak: number;
  }>();

  if (!result) {
    return jsonResponse({ error: 'Failed to award XP' }, 500, origin);
  }

  // Calculate level from returned total_xp (Level = floor(xp / 100) + 1)
  const newLevel = Math.floor(result.total_xp / 100) + 1;

  // Log the XP transaction
  await env.DB.prepare(`
    INSERT INTO xp_transactions (user_id, amount, reason, action_type)
    VALUES (?, ?, ?, ?)
  `).bind(user.id, amount, reason, action_type || 'general').run();

  return jsonResponse({
    success: true,
    total_xp: result.total_xp,
    level: newLevel,
    xp_gained: amount,
    leveled_up: false,
  }, 200, origin);
}

export async function handleUpdateStreak(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const { increment } = await request.json() as { increment?: boolean };

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

  const today = new Date().toISOString().split('T')[0];
  const lastActivity = gamification.last_activity_date;
  
  let newStreak = gamification.current_streak;
  
  if (increment) {
    // Check if last activity was yesterday (continue streak) or today (already counted)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastActivity === yesterdayStr) {
      newStreak += 1;
    } else if (lastActivity !== today) {
      // Streak broken, start fresh
      newStreak = 1;
    }
    // If last activity is today, don't change streak
  }

  const newLongestStreak = Math.max(newStreak, gamification.longest_streak);

  await env.DB.prepare(`
    UPDATE user_gamification
    SET current_streak = ?,
        longest_streak = ?,
        last_activity_date = ?,
        updated_at = datetime('now')
    WHERE user_id = ?
  `).bind(newStreak, newLongestStreak, today, user.id).run();

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

  // Fetch current user_gamification row
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

  // Parse achievements JSON column
  let achievements: any[];
  try {
    achievements = JSON.parse(gamification.achievements || '[]');
  } catch (error) {
    achievements = [];
  }

  // Find matching achievement and unlock it
  let achievementFound = false;
  let unlockedAchievement: any = null;

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

  // Save updated achievements array back to database
  await env.DB.prepare(`
    UPDATE user_gamification
    SET achievements = ?,
        updated_at = datetime('now')
    WHERE user_id = ?
  `).bind(JSON.stringify(updatedAchievements), user.id).run();

  return jsonResponse({
    success: true,
    achievement: unlockedAchievement,
    message: `Achievement "${unlockedAchievement.name}" unlocked!`,
  }, 200, origin);
}
