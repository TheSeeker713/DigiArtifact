/**
 * Hono Router for DigiArtifact Workers API
 * Replaces manual if/else routing with Hono framework
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, User } from './types/env';
import { getUser } from './utils';
import { jsonResponse } from './utils/responses';

// Import route handlers
import {
  handleOAuthStart,
  handleOAuthCallback,
  handleVerifyGoogleToken,
} from './routes/oauth';
import {
  handleClockStatus,
  handleClockIn,
  handleClockOut,
  handleBreakStart,
  handleBreakEnd,
} from './routes/clock';
import { handleGetEntries, handleDeleteEntry, handleUpdateEntry } from './routes/entries';
import { handleGetConfig } from './routes/config';
import { handleGetGamification, handleAwardXP, handleUpdateStreak, handleUnlockAchievement } from './routes/gamification';
import { handleGetProjects, handleCreateProject, handleUpdateProject, handleDeleteProject } from './routes/projects';
import { handleWeeklyStats, handleMonthlyStats } from './routes/stats';
import {
  handleGetBlocks,
  handleSaveBlocks,
  handleUpdateBlock,
  handleGetIncompleteBlocks,
  handleCarryover,
} from './routes/schedule';
import {
  handleGetJournalEntries,
  handleCreateJournalEntry,
  handleUpdateJournalEntry,
  handleDeleteJournalEntry,
} from './routes/journal';
import {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleGetGlobalStats,
  handleGetUserStats,
  handleGetAllEntries,
  handleExportUserData,
  handleExportAllData,
  handlePurgeUserData,
  handlePurgeAllData,
} from './routes/admin';
import { handleGetProfile } from './routes/user';

// Create Hono app with typed context
type HonoContext = {
  Bindings: Env;
  Variables: {
    user: User;
  };
};

const app = new Hono<HonoContext>();

// ========================================
// CORS Middleware
// ========================================
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const env = c.env;
      return env.CORS_ORIGIN;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// ========================================
// Error Handler Middleware
// ========================================
app.onError((err, c) => {
  console.error('API Error:', err);
  if (err.stack) {
    console.error(err.stack);
  }

  return jsonResponse(
    {
      error: 'Internal server error',
    },
    500,
    c.env.CORS_ORIGIN
  );
});

// ========================================
// PUBLIC ROUTES (no authentication)
// ========================================

// Config route (public - no auth required)
app.get('/api/config', async (c) => {
  return handleGetConfig(c.env, c.env.CORS_ORIGIN);
});

// Google OAuth routes
app.get('/api/auth/google/start', async (c) => {
  return handleOAuthStart(c.req.raw, c.env, c.env.CORS_ORIGIN);
});

app.get('/api/auth/google/callback', async (c) => {
  return handleOAuthCallback(c.req.raw, c.env, c.env.CORS_ORIGIN);
});

app.post('/api/auth/google/verify', async (c) => {
  return handleVerifyGoogleToken(c.req.raw, c.env, c.env.CORS_ORIGIN);
});

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================
// Apply auth to all /api routes except public auth routes
app.use('/api/*', async (c, next) => {
  const path = c.req.path;
  // Skip auth for public OAuth routes
  if (path.startsWith('/api/auth/google/')) {
    return next();
  }

  const user = await getUser(c.req.raw, c.env);
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401, c.env.CORS_ORIGIN);
  }
  c.set('user', user);
  return next();
});

// ========================================
// PROTECTED ROUTES (authentication required)
// ========================================

// Clock routes
app.get('/api/clock/status', async (c) => {
  const user = c.get('user');
  return handleClockStatus(c.env, user, c.env.CORS_ORIGIN);
});

app.post('/api/clock/in', async (c) => {
  const user = c.get('user');
  return handleClockIn(c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});

app.post('/api/clock/out', async (c) => {
  const user = c.get('user');
  return handleClockOut(c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});

app.post('/api/break/start', async (c) => {
  const user = c.get('user');
  return handleBreakStart(c.env, user, c.env.CORS_ORIGIN);
});

app.post('/api/break/end', async (c) => {
  const user = c.get('user');
  return handleBreakEnd(c.env, user, c.env.CORS_ORIGIN);
});

// Entries routes
app.get('/api/entries', async (c) => {
  const user = c.get('user');
  return handleGetEntries(new URL(c.req.url), c.env, user, c.env.CORS_ORIGIN);
});

app.delete('/api/entries/:id', async (c) => {
  const user = c.get('user');
  const entryId = c.req.param('id');
  return handleDeleteEntry(entryId, c.env, user, c.env.CORS_ORIGIN);
});

app.put('/api/entries/:id', async (c) => {
  const user = c.get('user');
  const entryId = c.req.param('id');
  return handleUpdateEntry(entryId, c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});

// Gamification routes
app.get('/api/gamification', async (c) => {
  const user = c.get('user');
  return handleGetGamification(c.env, user, c.env.CORS_ORIGIN);
});

app.post('/api/gamification/xp', async (c) => {
  const user = c.get('user');
  return handleAwardXP(c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});

app.post('/api/gamification/streak', async (c) => {
  const user = c.get('user');
  return handleUpdateStreak(c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});

app.post('/api/gamification/achievement/unlock', async (c) => {
  const user = c.get('user');
  return handleUnlockAchievement(c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});

// Projects routes
app.get('/api/projects', async (c) => {
  const url = new URL(c.req.url);
  const user = c.get('user');
  return handleGetProjects(url, c.env, c.env.CORS_ORIGIN, user);
});

app.post('/api/projects', async (c) => {
  const user = c.get('user');
  return handleCreateProject(c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});

app.put('/api/projects/:id', async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('id');
  return handleUpdateProject(projectId, c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});

app.delete('/api/projects/:id', async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('id');
  return handleDeleteProject(projectId, c.env, user, c.env.CORS_ORIGIN);
});

// Profile route
app.get('/api/user/profile', async (c) => {
  const user = c.get('user');
  return handleGetProfile(user, c.env.CORS_ORIGIN);
});

// Stats routes
app.get('/api/stats/weekly', async (c) => {
  const user = c.get('user');
  return handleWeeklyStats(c.env, user, c.env.CORS_ORIGIN);
});
app.get('/api/stats/monthly', async (c) => {
  const user = c.get('user');
  const url = new URL(c.req.url);
  return handleMonthlyStats(url, c.env, user, c.env.CORS_ORIGIN);
});

// Schedule routes
app.get('/api/schedule/blocks', async (c) => {
  const user = c.get('user');
  const url = new URL(c.req.url);
  return handleGetBlocks(url, c.env, user, c.env.CORS_ORIGIN);
});
app.post('/api/schedule/blocks', async (c) => {
  const user = c.get('user');
  return handleSaveBlocks(c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});
app.put('/api/schedule/blocks/:id', async (c) => {
  const user = c.get('user');
  const blockId = c.req.param('id');
  return handleUpdateBlock(blockId, c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});
app.get('/api/schedule/incomplete', async (c) => {
  const user = c.get('user');
  return handleGetIncompleteBlocks(c.env, user, c.env.CORS_ORIGIN);
});
app.post('/api/schedule/carryover', async (c) => {
  const user = c.get('user');
  return handleCarryover(c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});

// Journal routes
app.get('/api/journal', async (c) => {
  const user = c.get('user');
  const url = new URL(c.req.url);
  return handleGetJournalEntries(url, c.env, user, c.env.CORS_ORIGIN);
});
app.post('/api/journal', async (c) => {
  const user = c.get('user');
  return handleCreateJournalEntry(c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});
app.put('/api/journal/:id', async (c) => {
  const user = c.get('user');
  const entryId = c.req.param('id');
  return handleUpdateJournalEntry(entryId, c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});
app.delete('/api/journal/:id', async (c) => {
  const user = c.get('user');
  const entryId = c.req.param('id');
  return handleDeleteJournalEntry(entryId, c.env, user, c.env.CORS_ORIGIN);
});

// Admin routes
app.get('/api/admin/users', async (c) => {
  const user = c.get('user');
  return handleGetUsers(c.env, user, c.env.CORS_ORIGIN);
});
app.post('/api/admin/users', async (c) => {
  const user = c.get('user');
  return handleCreateUser(c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});
app.put('/api/admin/users/:id', async (c) => {
  const user = c.get('user');
  const userId = c.req.param('id');
  return handleUpdateUser(userId, c.req.raw, c.env, user, c.env.CORS_ORIGIN);
});
app.get('/api/admin/stats/global', async (c) => {
  const user = c.get('user');
  return handleGetGlobalStats(c.env, user, c.env.CORS_ORIGIN);
});
app.get('/api/admin/stats/user/:id', async (c) => {
  const user = c.get('user');
  const userId = c.req.param('id');
  return handleGetUserStats(userId, c.env, user, c.env.CORS_ORIGIN);
});
app.get('/api/admin/entries', async (c) => {
  const user = c.get('user');
  return handleGetAllEntries(c.env, user, c.env.CORS_ORIGIN);
});
app.get('/api/admin/export/user/:id', async (c) => {
  const user = c.get('user');
  const userId = c.req.param('id');
  return handleExportUserData(userId, c.env, user, c.env.CORS_ORIGIN);
});
app.get('/api/admin/export/all', async (c) => {
  const user = c.get('user');
  return handleExportAllData(c.env, user, c.env.CORS_ORIGIN);
});
app.delete('/api/admin/purge/user/:id', async (c) => {
  const user = c.get('user');
  const userId = c.req.param('id');
  return handlePurgeUserData(userId, c.env, user, c.env.CORS_ORIGIN);
});
app.delete('/api/admin/purge/all', async (c) => {
  const user = c.get('user');
  return handlePurgeAllData(c.env, user, c.env.CORS_ORIGIN);
});

// ========================================
// 404 Handler
// ========================================
app.notFound((c) => {
  return jsonResponse({ error: 'Not found' }, 404, c.env.CORS_ORIGIN);
});

export default app;

