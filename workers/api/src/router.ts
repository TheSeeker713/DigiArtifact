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
      message: err.message || 'An unexpected error occurred',
    },
    500,
    c.env.CORS_ORIGIN
  );
});

// ========================================
// PUBLIC ROUTES (no authentication)
// ========================================

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

// ========================================
// 404 Handler
// ========================================
app.notFound((c) => {
  return jsonResponse({ error: 'Not found' }, 404, c.env.CORS_ORIGIN);
});

export default app;

