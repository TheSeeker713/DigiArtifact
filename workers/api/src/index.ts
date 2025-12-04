/**
 * DigiArtifact Workers API
 * Cloudflare Worker for time tracking backend
 */

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'worker';
}

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

// Simple JWT implementation for Cloudflare Workers
async function createJWT(payload: Omit<JWTPayload, 'exp'>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, exp: now + 7 * 24 * 60 * 60 }; // 7 days

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '');
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureStr = atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/'));
    const signature = new Uint8Array([...signatureStr].map(c => c.charCodeAt(0)));
    
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(`${headerB64}.${payloadB64}`)
    );

    if (!valid) return null;

    const payload: JWTPayload = JSON.parse(atob(payloadB64));
    
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch {
    return null;
  }
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data: any, status = 200, origin: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

async function getUser(request: Request, env: Env): Promise<User | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return null;
  
  const result = await env.DB.prepare(
    'SELECT id, email, name, role FROM users WHERE id = ? AND active = 1'
  ).bind(payload.userId).first<User>();
  
  return result || null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = env.CORS_ORIGIN;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    try {
      // Auth routes
      if (path === '/api/auth/login' && method === 'POST') {
        const { email, pin } = await request.json() as { email: string; pin: string };
        
        if (!email || !pin) {
          return jsonResponse({ error: 'Email and PIN required' }, 400, origin);
        }

        const pinHash = await hashPin(pin);
        const user = await env.DB.prepare(
          'SELECT id, email, name, role FROM users WHERE email = ? AND pin_hash = ? AND active = 1'
        ).bind(email, pinHash).first<User>();

        if (!user) {
          return jsonResponse({ error: 'Invalid credentials' }, 401, origin);
        }

        const token = await createJWT({
          userId: user.id,
          email: user.email,
          role: user.role,
        }, env.JWT_SECRET);

        return jsonResponse({ token, user }, 200, origin);
      }

      // Protected routes - require authentication
      const user = await getUser(request, env);
      if (!user && !path.startsWith('/api/auth')) {
        return jsonResponse({ error: 'Unauthorized' }, 401, origin);
      }

      // Clock status
      if (path === '/api/clock/status' && method === 'GET') {
        const entry = await env.DB.prepare(`
          SELECT te.*, p.name as project_name, p.color as project_color
          FROM time_entries te
          LEFT JOIN projects p ON te.project_id = p.id
          WHERE te.user_id = ? AND te.clock_out IS NULL
          ORDER BY te.clock_in DESC
          LIMIT 1
        `).bind(user!.id).first();

        if (!entry) {
          return jsonResponse({ status: 'clocked-out', currentEntry: null }, 200, origin);
        }

        // Check if on break
        const activeBreak = await env.DB.prepare(`
          SELECT * FROM breaks WHERE time_entry_id = ? AND end_time IS NULL
        `).bind(entry.id).first();

        return jsonResponse({
          status: activeBreak ? 'on-break' : 'clocked-in',
          currentEntry: entry,
        }, 200, origin);
      }

      // Clock in
      if (path === '/api/clock/in' && method === 'POST') {
        const { project_id } = await request.json() as { project_id?: number };

        // Check if already clocked in
        const existing = await env.DB.prepare(
          'SELECT id FROM time_entries WHERE user_id = ? AND clock_out IS NULL'
        ).bind(user!.id).first();

        if (existing) {
          return jsonResponse({ error: 'Already clocked in' }, 400, origin);
        }

        const result = await env.DB.prepare(
          'INSERT INTO time_entries (user_id, project_id, clock_in) VALUES (?, ?, datetime("now")) RETURNING *'
        ).bind(user!.id, project_id || null).first();

        return jsonResponse({ entry: result }, 201, origin);
      }

      // Clock out
      if (path === '/api/clock/out' && method === 'POST') {
        const { notes } = await request.json() as { notes?: string };

        // End any active break first
        await env.DB.prepare(`
          UPDATE breaks SET end_time = datetime('now')
          WHERE time_entry_id IN (
            SELECT id FROM time_entries WHERE user_id = ? AND clock_out IS NULL
          ) AND end_time IS NULL
        `).bind(user!.id).run();

        // Calculate total break minutes
        const entry = await env.DB.prepare(
          'SELECT id FROM time_entries WHERE user_id = ? AND clock_out IS NULL'
        ).bind(user!.id).first<{ id: number }>();

        if (!entry) {
          return jsonResponse({ error: 'Not clocked in' }, 400, origin);
        }

        const breakTotal = await env.DB.prepare(`
          SELECT COALESCE(SUM(
            (julianday(COALESCE(end_time, datetime('now'))) - julianday(start_time)) * 24 * 60
          ), 0) as total
          FROM breaks WHERE time_entry_id = ?
        `).bind(entry.id).first<{ total: number }>();

        const result = await env.DB.prepare(`
          UPDATE time_entries 
          SET clock_out = datetime('now'), notes = ?, break_minutes = ?, updated_at = datetime('now')
          WHERE id = ?
          RETURNING *
        `).bind(notes || null, Math.round(breakTotal?.total || 0), entry.id).first();

        return jsonResponse({ entry: result }, 200, origin);
      }

      // Start break
      if (path === '/api/break/start' && method === 'POST') {
        const entry = await env.DB.prepare(
          'SELECT id FROM time_entries WHERE user_id = ? AND clock_out IS NULL'
        ).bind(user!.id).first<{ id: number }>();

        if (!entry) {
          return jsonResponse({ error: 'Not clocked in' }, 400, origin);
        }

        // Check if already on break
        const activeBreak = await env.DB.prepare(
          'SELECT id FROM breaks WHERE time_entry_id = ? AND end_time IS NULL'
        ).bind(entry.id).first();

        if (activeBreak) {
          return jsonResponse({ error: 'Already on break' }, 400, origin);
        }

        const result = await env.DB.prepare(
          'INSERT INTO breaks (time_entry_id, start_time) VALUES (?, datetime("now")) RETURNING *'
        ).bind(entry.id).first();

        return jsonResponse({ break: result }, 201, origin);
      }

      // End break
      if (path === '/api/break/end' && method === 'POST') {
        const entry = await env.DB.prepare(
          'SELECT id FROM time_entries WHERE user_id = ? AND clock_out IS NULL'
        ).bind(user!.id).first<{ id: number }>();

        if (!entry) {
          return jsonResponse({ error: 'Not clocked in' }, 400, origin);
        }

        const result = await env.DB.prepare(`
          UPDATE breaks SET end_time = datetime('now')
          WHERE time_entry_id = ? AND end_time IS NULL
          RETURNING *
        `).bind(entry.id).first();

        if (!result) {
          return jsonResponse({ error: 'Not on break' }, 400, origin);
        }

        return jsonResponse({ break: result }, 200, origin);
      }

      // Get entries
      if (path === '/api/entries' && method === 'GET') {
        const date = url.searchParams.get('date');
        const start = url.searchParams.get('start');
        const end = url.searchParams.get('end');

        let query = `
          SELECT te.*, p.name as project_name, p.color as project_color
          FROM time_entries te
          LEFT JOIN projects p ON te.project_id = p.id
          WHERE te.user_id = ?
        `;
        const params: any[] = [user!.id];

        if (date) {
          query += ` AND date(te.clock_in) = ?`;
          params.push(date);
        } else if (start && end) {
          query += ` AND date(te.clock_in) BETWEEN ? AND ?`;
          params.push(start, end);
        }

        query += ` ORDER BY te.clock_in DESC LIMIT 100`;

        const stmt = env.DB.prepare(query);
        const result = await stmt.bind(...params).all();

        return jsonResponse({ entries: result.results }, 200, origin);
      }

      // Get projects
      if (path === '/api/projects' && method === 'GET') {
        const result = await env.DB.prepare(
          'SELECT * FROM projects WHERE active = 1 ORDER BY name'
        ).all();

        return jsonResponse({ projects: result.results }, 200, origin);
      }

      // Create project (admin only)
      if (path === '/api/projects' && method === 'POST') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const { name, description, color } = await request.json() as {
          name: string;
          description?: string;
          color?: string;
        };

        if (!name) {
          return jsonResponse({ error: 'Project name required' }, 400, origin);
        }

        const result = await env.DB.prepare(
          'INSERT INTO projects (name, description, color) VALUES (?, ?, ?) RETURNING *'
        ).bind(name, description || null, color || '#cca43b').first();

        return jsonResponse({ project: result }, 201, origin);
      }

      // Update project (admin only)
      if (path.match(/^\/api\/projects\/\d+$/) && method === 'PUT') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const projectId = path.split('/').pop();
        const { name, description, color, active } = await request.json() as {
          name?: string;
          description?: string;
          color?: string;
          active?: boolean;
        };

        const result = await env.DB.prepare(`
          UPDATE projects 
          SET name = COALESCE(?, name),
              description = COALESCE(?, description),
              color = COALESCE(?, color),
              active = COALESCE(?, active),
              updated_at = datetime('now')
          WHERE id = ?
          RETURNING *
        `).bind(name || null, description || null, color || null, active !== undefined ? (active ? 1 : 0) : null, projectId).first();

        if (!result) {
          return jsonResponse({ error: 'Project not found' }, 404, origin);
        }

        return jsonResponse({ project: result }, 200, origin);
      }

      // Weekly stats
      if (path === '/api/stats/weekly' && method === 'GET') {
        const result = await env.DB.prepare(`
          WITH RECURSIVE dates(d, dow) AS (
            SELECT date('now', 'weekday 0', '-6 days'), 0
            UNION ALL
            SELECT date(d, '+1 day'), dow + 1 FROM dates WHERE dow < 6
          )
          SELECT 
            dates.dow,
            COALESCE(SUM(
              (julianday(COALESCE(te.clock_out, datetime('now'))) - julianday(te.clock_in)) * 24 - te.break_minutes / 60.0
            ), 0) as hours
          FROM dates
          LEFT JOIN time_entries te ON date(te.clock_in) = dates.d AND te.user_id = ?
          GROUP BY dates.dow
          ORDER BY dates.dow
        `).bind(user!.id).all();

        const hours = result.results.map((r: any) => Math.max(0, r.hours));

        return jsonResponse({ hours }, 200, origin);
      }

      // Monthly stats
      if (path === '/api/stats/monthly' && method === 'GET') {
        const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

        const entries = await env.DB.prepare(`
          SELECT 
            date(clock_in) as date,
            SUM((julianday(COALESCE(clock_out, datetime('now'))) - julianday(clock_in)) * 24 - break_minutes / 60.0) as hours
          FROM time_entries
          WHERE user_id = ? AND strftime('%Y-%m', clock_in) = ?
          GROUP BY date(clock_in)
        `).bind(user!.id, month).all();

        const projectBreakdown = await env.DB.prepare(`
          SELECT 
            COALESCE(p.name, 'No Project') as name,
            COALESCE(p.color, '#94a3b8') as color,
            SUM((julianday(COALESCE(te.clock_out, datetime('now'))) - julianday(te.clock_in)) * 24 - te.break_minutes / 60.0) as hours
          FROM time_entries te
          LEFT JOIN projects p ON te.project_id = p.id
          WHERE te.user_id = ? AND strftime('%Y-%m', te.clock_in) = ?
          GROUP BY te.project_id
        `).bind(user!.id, month).all();

        const totalHours = entries.results.reduce((sum: number, e: any) => sum + Math.max(0, e.hours), 0);
        const daysWorked = entries.results.filter((e: any) => e.hours > 0).length;

        return jsonResponse({
          totalHours,
          totalEntries: entries.results.length,
          averagePerDay: daysWorked > 0 ? totalHours / daysWorked : 0,
          projectBreakdown: projectBreakdown.results.map((p: any) => ({
            name: p.name,
            color: p.color,
            hours: Math.max(0, p.hours),
          })),
          dailyHours: entries.results.map((e: any) => ({
            date: e.date,
            hours: Math.max(0, e.hours),
          })),
        }, 200, origin);
      }

      // Admin: Get all users
      if (path === '/api/admin/users' && method === 'GET') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const result = await env.DB.prepare(
          'SELECT id, email, name, role, created_at FROM users WHERE active = 1 ORDER BY name'
        ).all();

        return jsonResponse({ users: result.results }, 200, origin);
      }

      // Admin: Create user
      if (path === '/api/admin/users' && method === 'POST') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const { name, email, pin, role } = await request.json() as {
          name: string;
          email: string;
          pin: string;
          role?: 'admin' | 'worker';
        };

        if (!name || !email || !pin) {
          return jsonResponse({ error: 'Name, email, and PIN required' }, 400, origin);
        }

        const pinHash = await hashPin(pin);

        try {
          const result = await env.DB.prepare(
            'INSERT INTO users (name, email, pin_hash, role) VALUES (?, ?, ?, ?) RETURNING id, email, name, role, created_at'
          ).bind(name, email, pinHash, role || 'worker').first();

          return jsonResponse({ user: result }, 201, origin);
        } catch (e: any) {
          if (e.message?.includes('UNIQUE constraint')) {
            return jsonResponse({ error: 'Email already exists' }, 400, origin);
          }
          throw e;
        }
      }

      // Admin: Update user
      if (path.match(/^\/api\/admin\/users\/\d+$/) && method === 'PUT') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const userId = path.split('/').pop();
        const { name, email, role } = await request.json() as {
          name?: string;
          email?: string;
          role?: 'admin' | 'worker';
        };

        const result = await env.DB.prepare(`
          UPDATE users 
          SET name = COALESCE(?, name),
              email = COALESCE(?, email),
              role = COALESCE(?, role),
              updated_at = datetime('now')
          WHERE id = ?
          RETURNING id, email, name, role, created_at
        `).bind(name || null, email || null, role || null, userId).first();

        if (!result) {
          return jsonResponse({ error: 'User not found' }, 404, origin);
        }

        return jsonResponse({ user: result }, 200, origin);
      }

      // Admin: Get all entries
      if (path === '/api/admin/entries' && method === 'GET') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const result = await env.DB.prepare(`
          SELECT te.*, 
            u.name as user_name, u.email as user_email,
            p.name as project_name, p.color as project_color
          FROM time_entries te
          JOIN users u ON te.user_id = u.id
          LEFT JOIN projects p ON te.project_id = p.id
          ORDER BY te.clock_in DESC
          LIMIT 200
        `).all();

        return jsonResponse({ entries: result.results }, 200, origin);
      }

      // Delete entry (admin only)
      if (path.match(/^\/api\/entries\/\d+$/) && method === 'DELETE') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const entryId = path.split('/').pop();
        await env.DB.prepare('DELETE FROM time_entries WHERE id = ?').bind(entryId).run();

        return jsonResponse({ success: true }, 200, origin);
      }

      // Update entry (admin only)
      if (path.match(/^\/api\/entries\/\d+$/) && method === 'PUT') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const entryId = path.split('/').pop();
        const { clock_in, clock_out, project_id, notes, break_minutes } = await request.json() as {
          clock_in?: string;
          clock_out?: string;
          project_id?: number | null;
          notes?: string;
          break_minutes?: number;
        };

        const result = await env.DB.prepare(`
          UPDATE time_entries 
          SET clock_in = COALESCE(?, clock_in),
              clock_out = COALESCE(?, clock_out),
              project_id = COALESCE(?, project_id),
              notes = COALESCE(?, notes),
              break_minutes = COALESCE(?, break_minutes),
              updated_at = datetime('now')
          WHERE id = ?
          RETURNING *
        `).bind(clock_in || null, clock_out || null, project_id, notes || null, break_minutes, entryId).first();

        if (!result) {
          return jsonResponse({ error: 'Entry not found' }, 404, origin);
        }

        return jsonResponse({ entry: result }, 200, origin);
      }

      // Change own PIN (any authenticated user)
      if (path === '/api/user/change-pin' && method === 'POST') {
        const { currentPin, newPin } = await request.json() as {
          currentPin: string;
          newPin: string;
        };

        if (!currentPin || !newPin) {
          return jsonResponse({ error: 'Current PIN and new PIN required' }, 400, origin);
        }

        if (newPin.length < 4 || newPin.length > 6) {
          return jsonResponse({ error: 'PIN must be 4-6 digits' }, 400, origin);
        }

        // Verify current PIN
        const currentPinHash = await hashPin(currentPin);
        const verified = await env.DB.prepare(
          'SELECT id FROM users WHERE id = ? AND pin_hash = ?'
        ).bind(user!.id, currentPinHash).first();

        if (!verified) {
          return jsonResponse({ error: 'Current PIN is incorrect' }, 401, origin);
        }

        // Update to new PIN
        const newPinHash = await hashPin(newPin);
        await env.DB.prepare(
          'UPDATE users SET pin_hash = ?, updated_at = datetime("now") WHERE id = ?'
        ).bind(newPinHash, user!.id).run();

        return jsonResponse({ success: true, message: 'PIN updated successfully' }, 200, origin);
      }

      // Admin: Reset user PIN
      if (path.match(/^\/api\/admin\/users\/\d+\/reset-pin$/) && method === 'POST') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const userId = path.split('/')[4];
        const { newPin } = await request.json() as { newPin: string };

        if (!newPin) {
          return jsonResponse({ error: 'New PIN required' }, 400, origin);
        }

        if (newPin.length < 4 || newPin.length > 6) {
          return jsonResponse({ error: 'PIN must be 4-6 digits' }, 400, origin);
        }

        const pinHash = await hashPin(newPin);
        const result = await env.DB.prepare(
          'UPDATE users SET pin_hash = ?, updated_at = datetime("now") WHERE id = ? RETURNING id, name, email'
        ).bind(pinHash, userId).first();

        if (!result) {
          return jsonResponse({ error: 'User not found' }, 404, origin);
        }

        return jsonResponse({ success: true, user: result }, 200, origin);
      }

      // Get current user profile
      if (path === '/api/user/profile' && method === 'GET') {
        return jsonResponse({ user }, 200, origin);
      }

      // ============================================
      // GAMIFICATION ENDPOINTS
      // ============================================

      // Get user gamification data
      if (path === '/api/gamification' && method === 'GET') {
        const gamification = await env.DB.prepare(`
          SELECT total_xp, level, current_streak, longest_streak, 
                 total_work_minutes, total_sessions, focus_sessions,
                 achievements, last_activity_date
          FROM user_gamification
          WHERE user_id = ?
        `).bind(user!.id).first();

        if (!gamification) {
          // Create default gamification record
          await env.DB.prepare(`
            INSERT INTO user_gamification (user_id, total_xp, level, current_streak, achievements)
            VALUES (?, 0, 1, 0, '[]')
          `).bind(user!.id).run();
          
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

      // Update XP (award XP for actions)
      if (path === '/api/gamification/xp' && method === 'POST') {
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
        `).bind(user!.id).first<{
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
          `).bind(user!.id, amount).first();
          
          // Log the XP transaction
          await env.DB.prepare(`
            INSERT INTO xp_transactions (user_id, amount, reason, action_type)
            VALUES (?, ?, ?, ?)
          `).bind(user!.id, amount, reason, action_type || 'general').run();

          return jsonResponse({ 
            success: true, 
            total_xp: amount, 
            level: 1,
            xp_gained: amount,
          }, 200, origin);
        }

        // Calculate new level based on XP
        const newTotalXP = gamification.total_xp + amount;
        const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
        let newLevel = 1;
        for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
          if (newTotalXP >= LEVEL_THRESHOLDS[i]) {
            newLevel = i + 1;
            break;
          }
        }

        const leveledUp = newLevel > gamification.level;

        // Update gamification data
        await env.DB.prepare(`
          UPDATE user_gamification
          SET total_xp = ?,
              level = ?,
              last_activity_date = date('now'),
              updated_at = datetime('now')
          WHERE user_id = ?
        `).bind(newTotalXP, newLevel, user!.id).run();

        // Log the XP transaction
        await env.DB.prepare(`
          INSERT INTO xp_transactions (user_id, amount, reason, action_type)
          VALUES (?, ?, ?, ?)
        `).bind(user!.id, amount, reason, action_type || 'general').run();

        return jsonResponse({
          success: true,
          total_xp: newTotalXP,
          level: newLevel,
          xp_gained: amount,
          leveled_up: leveledUp,
        }, 200, origin);
      }

      // Update streak
      if (path === '/api/gamification/streak' && method === 'POST') {
        const { increment } = await request.json() as { increment?: boolean };

        const gamification = await env.DB.prepare(`
          SELECT current_streak, longest_streak, last_activity_date
          FROM user_gamification
          WHERE user_id = ?
        `).bind(user!.id).first<{
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
        `).bind(newStreak, newLongestStreak, today, user!.id).run();

        return jsonResponse({
          success: true,
          current_streak: newStreak,
          longest_streak: newLongestStreak,
        }, 200, origin);
      }

      // ============================================
      // SCHEDULE BLOCKS ENDPOINTS
      // ============================================

      // Get schedule blocks for a date
      if (path === '/api/schedule/blocks' && method === 'GET') {
        const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

        const blocks = await env.DB.prepare(`
          SELECT sb.*, s.start_time as shift_start, s.end_time as shift_end
          FROM schedule_blocks sb
          LEFT JOIN shifts s ON sb.shift_id = s.id
          WHERE sb.user_id = ? AND date(sb.start_time) = ?
          ORDER BY sb.order_index ASC
        `).bind(user!.id, date).all();

        return jsonResponse({ 
          blocks: blocks.results,
          date,
        }, 200, origin);
      }

      // Save/Update schedule blocks (bulk upsert)
      if (path === '/api/schedule/blocks' && method === 'POST') {
        const { blocks, date } = await request.json() as {
          blocks: Array<{
            id?: string;
            type: string;
            order_index: number;
            start_time: string;
            end_time: string;
            duration_minutes: number;
            label: string;
            status: string;
            project_id?: number;
            notes?: string;
            xp_earned?: number;
          }>;
          date: string;
        };

        if (!blocks || !Array.isArray(blocks)) {
          return jsonResponse({ error: 'Blocks array required' }, 400, origin);
        }

        // Get or create shift for this date
        let shift = await env.DB.prepare(`
          SELECT id FROM shifts WHERE user_id = ? AND date(start_time) = ?
        `).bind(user!.id, date).first<{ id: number }>();

        if (!shift) {
          const firstBlock = blocks[0];
          const lastBlock = blocks[blocks.length - 1];
          
          shift = await env.DB.prepare(`
            INSERT INTO shifts (user_id, start_time, end_time, status)
            VALUES (?, ?, ?, 'draft')
            RETURNING id
          `).bind(user!.id, firstBlock.start_time, lastBlock.end_time).first<{ id: number }>();
        }

        // Delete existing blocks for this shift and reinsert
        await env.DB.prepare(`
          DELETE FROM schedule_blocks WHERE shift_id = ?
        `).bind(shift!.id).run();

        // Insert all blocks
        for (const block of blocks) {
          await env.DB.prepare(`
            INSERT INTO schedule_blocks 
            (shift_id, user_id, block_type, order_index, start_time, end_time, 
             duration_minutes, label, status, project_id, notes, xp_earned)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            shift!.id,
            user!.id,
            block.type,
            block.order_index,
            block.start_time,
            block.end_time,
            block.duration_minutes,
            block.label,
            block.status,
            block.project_id || null,
            block.notes || null,
            block.xp_earned || 0
          ).run();
        }

        return jsonResponse({ 
          success: true, 
          shift_id: shift!.id,
          blocks_saved: blocks.length,
        }, 200, origin);
      }

      // Update single block status
      if (path.match(/^\/api\/schedule\/blocks\/\d+$/) && method === 'PUT') {
        const blockId = path.split('/').pop();
        const updates = await request.json() as {
          status?: string;
          end_time?: string;
          xp_earned?: number;
          notes?: string;
        };

        const result = await env.DB.prepare(`
          UPDATE schedule_blocks
          SET status = COALESCE(?, status),
              end_time = COALESCE(?, end_time),
              xp_earned = COALESCE(?, xp_earned),
              notes = COALESCE(?, notes),
              updated_at = datetime('now')
          WHERE id = ? AND user_id = ?
          RETURNING *
        `).bind(
          updates.status || null,
          updates.end_time || null,
          updates.xp_earned,
          updates.notes || null,
          blockId,
          user!.id
        ).first();

        if (!result) {
          return jsonResponse({ error: 'Block not found' }, 404, origin);
        }

        return jsonResponse({ block: result }, 200, origin);
      }

      // Get incomplete blocks from previous day (for carry-over)
      if (path === '/api/schedule/incomplete' && method === 'GET') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const incompleteBlocks = await env.DB.prepare(`
          SELECT * FROM schedule_blocks
          WHERE user_id = ? 
            AND date(start_time) = ?
            AND block_type IN ('WORK', 'FLEX')
            AND status IN ('pending', 'skipped', 'partial')
          ORDER BY order_index ASC
        `).bind(user!.id, yesterdayStr).all();

        // Calculate total incomplete minutes
        const totalIncompleteMinutes = incompleteBlocks.results.reduce((sum: number, b: any) => {
          return sum + (b.duration_minutes || 0);
        }, 0);

        return jsonResponse({
          date: yesterdayStr,
          incomplete_blocks: incompleteBlocks.results,
          total_incomplete_minutes: totalIncompleteMinutes,
          has_incomplete: incompleteBlocks.results.length > 0,
        }, 200, origin);
      }

      // Mark incomplete blocks as carried over
      if (path === '/api/schedule/carryover' && method === 'POST') {
        const { block_ids, carry_to_date } = await request.json() as {
          block_ids: number[];
          carry_to_date: string;
        };

        if (!block_ids || !carry_to_date) {
          return jsonResponse({ error: 'block_ids and carry_to_date required' }, 400, origin);
        }

        // Update original blocks as carried_over
        await env.DB.prepare(`
          UPDATE schedule_blocks
          SET status = 'carried_over',
              notes = COALESCE(notes, '') || ' [Carried to ${carry_to_date}]',
              updated_at = datetime('now')
          WHERE id IN (${block_ids.join(',')}) AND user_id = ?
        `).bind(user!.id).run();

        return jsonResponse({
          success: true,
          blocks_carried: block_ids.length,
          carry_to_date,
        }, 200, origin);
      }

      // ===== ADMIN DATA MANAGEMENT ENDPOINTS =====

      // Get all users (admin only)
      if (path === '/api/admin/users' && method === 'GET') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const users = await env.DB.prepare(`
          SELECT id, email, name, role, created_at,
            (SELECT MAX(clock_in) FROM time_entries WHERE user_id = users.id) as last_activity
          FROM users
          ORDER BY name ASC
        `).all();

        return jsonResponse({ users: users.results }, 200, origin);
      }

      // Get global database stats (admin only)
      if (path === '/api/admin/stats' && method === 'GET') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const stats = await env.DB.batch([
          env.DB.prepare(`SELECT COUNT(*) as count FROM time_entries`),
          env.DB.prepare(`SELECT COUNT(*) as count FROM schedule_blocks`),
          env.DB.prepare(`SELECT COUNT(*) as count FROM xp_transactions`),
          env.DB.prepare(`SELECT COUNT(*) as count FROM projects`),
        ]);

        return jsonResponse({
          totalTimeEntries: (stats[0].results[0] as any)?.count || 0,
          totalBlocks: (stats[1].results[0] as any)?.count || 0,
          totalXpTransactions: (stats[2].results[0] as any)?.count || 0,
          totalNotes: (stats[3].results[0] as any)?.count || 0,
          storageUsed: 'N/A', // D1 doesn't expose storage stats easily
        }, 200, origin);
      }

      // Get user-specific stats (admin only)
      if (path.match(/^\/api\/admin\/users\/\d+\/stats$/) && method === 'GET') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const userId = path.split('/')[4];

        const stats = await env.DB.batch([
          env.DB.prepare(`SELECT COUNT(*) as count FROM time_entries WHERE user_id = ?`).bind(userId),
          env.DB.prepare(`SELECT COUNT(*) as count FROM schedule_blocks WHERE user_id = ?`).bind(userId),
          env.DB.prepare(`SELECT COUNT(*) as count FROM xp_transactions WHERE user_id = ?`).bind(userId),
        ]);

        return jsonResponse({
          totalTimeEntries: (stats[0].results[0] as any)?.count || 0,
          totalBlocks: (stats[1].results[0] as any)?.count || 0,
          totalXpTransactions: (stats[2].results[0] as any)?.count || 0,
          totalNotes: 0,
          storageUsed: 'N/A',
        }, 200, origin);
      }

      // Export user data (admin only)
      if (path.match(/^\/api\/admin\/export\/\d+$/) && method === 'GET') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const userId = path.split('/').pop();

        const [userInfo, timeEntries, blocks, xpTxs, gamification] = await Promise.all([
          env.DB.prepare(`SELECT id, email, name, role, created_at FROM users WHERE id = ?`).bind(userId).first(),
          env.DB.prepare(`SELECT * FROM time_entries WHERE user_id = ?`).bind(userId).all(),
          env.DB.prepare(`SELECT * FROM schedule_blocks WHERE user_id = ?`).bind(userId).all(),
          env.DB.prepare(`SELECT * FROM xp_transactions WHERE user_id = ?`).bind(userId).all(),
          env.DB.prepare(`SELECT * FROM user_gamification WHERE user_id = ?`).bind(userId).first(),
        ]);

        return jsonResponse({
          exportedAt: new Date().toISOString(),
          scope: `User: ${(userInfo as any)?.name || 'Unknown'}`,
          user: userInfo,
          timeEntries: timeEntries.results,
          blocks: blocks.results,
          xpTransactions: xpTxs.results,
          gamification: gamification,
        }, 200, origin);
      }

      // Export all data (admin only)
      if (path === '/api/admin/export/all' && method === 'GET') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const [users, timeEntries, blocks, xpTxs, gamification, projects] = await Promise.all([
          env.DB.prepare(`SELECT id, email, name, role, created_at FROM users`).all(),
          env.DB.prepare(`SELECT * FROM time_entries`).all(),
          env.DB.prepare(`SELECT * FROM schedule_blocks`).all(),
          env.DB.prepare(`SELECT * FROM xp_transactions`).all(),
          env.DB.prepare(`SELECT * FROM user_gamification`).all(),
          env.DB.prepare(`SELECT * FROM projects`).all(),
        ]);

        return jsonResponse({
          exportedAt: new Date().toISOString(),
          scope: 'Global',
          users: users.results,
          timeEntries: timeEntries.results,
          blocks: blocks.results,
          xpTransactions: xpTxs.results,
          gamification: gamification.results,
          projects: projects.results,
        }, 200, origin);
      }

      // Purge user data (admin only)
      if (path.match(/^\/api\/admin\/users\/\d+\/purge$/) && method === 'DELETE') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        const userId = path.split('/')[4];

        // Delete user data but preserve the user account
        await env.DB.batch([
          env.DB.prepare(`DELETE FROM time_entries WHERE user_id = ?`).bind(userId),
          env.DB.prepare(`DELETE FROM schedule_blocks WHERE user_id = ?`).bind(userId),
          env.DB.prepare(`DELETE FROM xp_transactions WHERE user_id = ?`).bind(userId),
          env.DB.prepare(`DELETE FROM user_gamification WHERE user_id = ?`).bind(userId),
        ]);

        return jsonResponse({
          success: true,
          message: `All data for user ${userId} has been purged`,
        }, 200, origin);
      }

      // Global purge (admin only) - DANGEROUS
      if (path === '/api/admin/purge/all' && method === 'DELETE') {
        if (user!.role !== 'admin') {
          return jsonResponse({ error: 'Admin access required' }, 403, origin);
        }

        // Delete all data but preserve user accounts
        await env.DB.batch([
          env.DB.prepare(`DELETE FROM time_entries`),
          env.DB.prepare(`DELETE FROM schedule_blocks`),
          env.DB.prepare(`DELETE FROM xp_transactions`),
          env.DB.prepare(`DELETE FROM user_gamification`),
          // Keep projects but clear assignments
          env.DB.prepare(`UPDATE projects SET description = NULL`),
        ]);

        return jsonResponse({
          success: true,
          message: 'All database data has been purged. User accounts preserved.',
        }, 200, origin);
      }

      // 404 for unknown routes
      return jsonResponse({ error: 'Not found' }, 404, origin);

    } catch (error: any) {
      console.error('API Error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500, origin);
    }
  },
};
