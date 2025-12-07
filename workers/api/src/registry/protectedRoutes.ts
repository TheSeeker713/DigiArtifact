/**
 * Protected routes registry (auth required)
 */

import { Env, ProtectedRouteContext } from '../types/env';
import { jsonResponse } from '../utils/responses';
import {
  handleClockStatus,
  handleClockIn,
  handleClockOut,
  handleBreakStart,
  handleBreakEnd,
} from '../routes/clock';
import { handleGetEntries, handleDeleteEntry, handleUpdateEntry } from '../routes/entries';
import { handleGetProjects, handleCreateProject, handleUpdateProject } from '../routes/projects';
import { handleWeeklyStats, handleMonthlyStats } from '../routes/stats';
import {
  handleGetGamification,
  handleAwardXP,
  handleUpdateStreak,
  handleUnlockAchievement,
} from '../routes/gamification';
import {
  handleGetBlocks,
  handleSaveBlocks,
  handleUpdateBlock,
  handleGetIncompleteBlocks,
  handleCarryover,
} from '../routes/schedule';
import {
  handleGetJournalEntries,
  handleCreateJournalEntry,
  handleUpdateJournalEntry,
  handleDeleteJournalEntry,
} from '../routes/journal';
import {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleResetUserPin,
  handleGetGlobalStats,
  handleGetUserStats,
  handleGetAllEntries,
  handleExportUserData,
  handleExportAllData,
  handlePurgeUserData,
  handlePurgeAllData,
} from '../routes/admin';
import { handleGetProfile, handleChangePin } from '../routes/user';

/**
 * Try to match and handle protected routes
 * Returns Response if matched, null otherwise
 */
export async function handleProtectedRoutes(
  request: Request,
  env: Env,
  context: ProtectedRouteContext
): Promise<Response | null> {
  const { url, method, origin, user } = context;
  const path = url.pathname;

  // --- CLOCK ROUTES ---
  if (path === '/api/clock/status' && method === 'GET') {
    return handleClockStatus(env, user, origin);
  }
  if (path === '/api/clock/in' && method === 'POST') {
    return handleClockIn(request, env, user, origin);
  }
  if (path === '/api/clock/out' && method === 'POST') {
    return handleClockOut(request, env, user, origin);
  }
  if (path === '/api/break/start' && method === 'POST') {
    return handleBreakStart(env, user, origin);
  }
  if (path === '/api/break/end' && method === 'POST') {
    return handleBreakEnd(env, user, origin);
  }

  // --- ENTRIES ROUTES ---
  if (path === '/api/entries' && method === 'GET') {
    return handleGetEntries(url, env, user, origin);
  }
  if (path.match(/^\/api\/entries\/\d+$/) && method === 'DELETE') {
    return handleDeleteEntry(path.split('/').pop()!, env, user, origin);
  }
  if (path.match(/^\/api\/entries\/\d+$/) && method === 'PUT') {
    return handleUpdateEntry(path.split('/').pop()!, request, env, user, origin);
  }

  // --- PROJECT ROUTES ---
  if (path === '/api/projects' && method === 'GET') {
    return handleGetProjects(env, origin);
  }
  if (path === '/api/projects' && method === 'POST') {
    return handleCreateProject(request, env, user, origin);
  }
  if (path.match(/^\/api\/projects\/\d+$/) && method === 'PUT') {
    return handleUpdateProject(path.split('/').pop()!, request, env, user, origin);
  }

  // --- STATS ROUTES ---
  if (path === '/api/stats/weekly' && method === 'GET') {
    return handleWeeklyStats(env, user, origin);
  }
  if (path === '/api/stats/monthly' && method === 'GET') {
    return handleMonthlyStats(url, env, user, origin);
  }

  // --- GAMIFICATION ROUTES ---
  if (path === '/api/gamification' && method === 'GET') {
    return handleGetGamification(env, user, origin);
  }
  if (path === '/api/gamification/xp' && method === 'POST') {
    return handleAwardXP(request, env, user, origin);
  }
  if (path === '/api/gamification/streak' && method === 'POST') {
    return handleUpdateStreak(request, env, user, origin);
  }
  if (path === '/api/gamification/achievement' && method === 'POST') {
    return handleUnlockAchievement(request, env, user, origin);
  }
  if (path === '/api/gamification/achievement/unlock' && method === 'POST') {
    return handleUnlockAchievement(request, env, user, origin);
  }

  // --- SCHEDULE ROUTES ---
  if (path === '/api/schedule/blocks' && method === 'GET') {
    return handleGetBlocks(url, env, user, origin);
  }
  if (path === '/api/schedule/blocks' && method === 'POST') {
    return handleSaveBlocks(request, env, user, origin);
  }
  if (path.match(/^\/api\/schedule\/blocks\/\d+$/) && method === 'PUT') {
    return handleUpdateBlock(path.split('/').pop()!, request, env, user, origin);
  }
  if (path === '/api/schedule/incomplete' && method === 'GET') {
    return handleGetIncompleteBlocks(env, user, origin);
  }
  if (path === '/api/schedule/carryover' && method === 'POST') {
    return handleCarryover(request, env, user, origin);
  }

  // --- JOURNAL ROUTES ---
  if (path === '/api/journal' && method === 'GET') {
    return handleGetJournalEntries(url, env, user, origin);
  }
  if (path === '/api/journal' && method === 'POST') {
    return handleCreateJournalEntry(request, env, user, origin);
  }
  if (path.match(/^\/api\/journal\/[\w-]+$/) && method === 'PUT') {
    return handleUpdateJournalEntry(path.split('/').pop()!, request, env, user, origin);
  }
  if (path.match(/^\/api\/journal\/[\w-]+$/) && method === 'DELETE') {
    return handleDeleteJournalEntry(path.split('/').pop()!, env, user, origin);
  }

  // --- USER ROUTES ---
  if (path === '/api/user/profile' && method === 'GET') {
    return handleGetProfile(user, origin);
  }
  if (path === '/api/user/change-pin' && method === 'POST') {
    return handleChangePin(request, env, user, origin);
  }

  // --- ADMIN ROUTES ---
  if (path === '/api/admin/users' && method === 'GET') {
    return handleGetUsers(env, user, origin);
  }
  if (path === '/api/admin/users' && method === 'POST') {
    return handleCreateUser(request, env, user, origin);
  }
  if (path.match(/^\/api\/admin\/users\/\d+$/) && method === 'PUT') {
    return handleUpdateUser(path.split('/').pop()!, request, env, user, origin);
  }
  if (path.match(/^\/api\/admin\/users\/\d+\/reset-pin$/) && method === 'POST') {
    return handleResetUserPin(path.split('/')[4], request, env, user, origin);
  }
  if (path.match(/^\/api\/admin\/users\/\d+\/stats$/) && method === 'GET') {
    return handleGetUserStats(path.split('/')[4], env, user, origin);
  }
  if (path === '/api/admin/entries' && method === 'GET') {
    return handleGetAllEntries(env, user, origin);
  }
  if (path === '/api/admin/stats' && method === 'GET') {
    return handleGetGlobalStats(env, user, origin);
  }
  if (path.match(/^\/api\/admin\/export\/\d+$/) && method === 'GET') {
    return handleExportUserData(path.split('/').pop()!, env, user, origin);
  }
  if (path === '/api/admin/export/all' && method === 'GET') {
    return handleExportAllData(env, user, origin);
  }
  if (path.match(/^\/api\/admin\/users\/\d+\/purge$/) && method === 'DELETE') {
    return handlePurgeUserData(path.split('/')[4], env, user, origin);
  }
  if (path === '/api/admin/purge/all' && method === 'DELETE') {
    return handlePurgeAllData(env, user, origin);
  }

  return null; // No protected route matched
}
