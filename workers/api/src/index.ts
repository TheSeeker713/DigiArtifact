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

      // 404 for unknown routes
      return jsonResponse({ error: 'Not found' }, 404, origin);

    } catch (error: any) {
      console.error('API Error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500, origin);
    }
  },
};
