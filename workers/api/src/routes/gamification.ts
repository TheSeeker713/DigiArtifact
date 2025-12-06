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
    // Create default gamification record
    await env.DB.prepare(`
      INSERT INTO user_gamification (user_id, total_xp, level, current_streak, achievements)
      VALUES (?, 0, 1, 0, '[]')
    `).bind(user.id).run();
    
    return jsonResponse({
      total_xp: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
      total_work_minutes: 0,
      total_sessions: 0,
      focus_sessions: 0,
      achievements: [],
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

  // Get current gamification data
  let gamification = await env.DB.prepare(`
    SELECT id, total_xp, level, current_streak, longest_streak,
           total_work_minutes, total_sessions, focus_sessions
    FROM user_gamification
    WHERE user_id = ?
  `).bind(user.id).first<{
    id: number;
    total_xp: number;
    level: number;
    current_streak: number;
    longest_streak: number;
    total_work_minutes: number;
    total_sessions: number;
    focus_sessions: number;
  }>();

  if (!gamification) {
    // Create initial record
    const result = await env.DB.prepare(`
      INSERT INTO user_gamification (user_id, total_xp, level, current_streak, achievements, last_activity_date)
      VALUES (?, ?, 1, 1, '[]', date('now'))
      RETURNING *
    `).bind(user.id, amount).first();
    
    // Log the XP transaction
    await env.DB.prepare(`
      INSERT INTO xp_transactions (user_id, amount, reason, action_type)
      VALUES (?, ?, ?, ?)
    `).bind(user.id, amount, reason, action_type || 'general').run();

    return jsonResponse({ 
      success: true, 
      total_xp: amount, 
      level: 1,
      xp_gained: amount,
    }, 200, origin);
  }

  // Calculate new level based on XP
  const newTotalXP = gamification.total_xp + amount;
  const newLevel = calculateLevel(newTotalXP);
  const leveledUp = newLevel > gamification.level;

  // Update gamification data
  await env.DB.prepare(`
    UPDATE user_gamification
    SET total_xp = ?,
        level = ?,
        last_activity_date = date('now'),
        updated_at = datetime('now')
    WHERE user_id = ?
  `).bind(newTotalXP, newLevel, user.id).run();

  // Log the XP transaction
  await env.DB.prepare(`
    INSERT INTO xp_transactions (user_id, amount, reason, action_type)
    VALUES (?, ?, ?, ?)
  `).bind(user.id, amount, reason, action_type || 'general').run();

  return jsonResponse({
    success: true,
    total_xp: newTotalXP,
    level: newLevel,
    xp_gained: amount,
    leveled_up: leveledUp,
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
