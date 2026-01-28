/**
 * Project management routes
 */
import { Env, User, jsonResponse } from '../utils';

export async function handleGetProjects(
  url: URL,
  env: Env,
  origin: string
): Promise<Response> {
  const includeInactive = url.searchParams.get('includeInactive') === 'true';
  
  let query = 'SELECT * FROM projects';
  if (!includeInactive) {
    query += ' WHERE active = 1';
  }
  query += ' ORDER BY name';
  
  const result = await env.DB.prepare(query).all();

  return jsonResponse({ projects: result.results }, 200, origin);
}

export async function handleCreateProject(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
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

export async function handleUpdateProject(
  projectId: string,
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

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

export async function handleDeleteProject(
  projectId: string,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  if (user.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403, origin);
  }

  const result = await env.DB.prepare(
    'DELETE FROM projects WHERE id = ? RETURNING *'
  ).bind(projectId).first();

  if (!result) {
    return jsonResponse({ error: 'Project not found' }, 404, origin);
  }

  return jsonResponse({ project: result, message: 'Project deleted successfully' }, 200, origin);
}
