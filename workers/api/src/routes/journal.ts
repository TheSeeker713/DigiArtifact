/**
 * Journal entries routes
 */
import { Env, User, jsonResponse, getStorageLimit } from '../utils';
import { XP_REWARDS } from '../constants';

export async function handleGetJournalEntries(
  url: URL,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const source = url.searchParams.get('source');
  const query = url.searchParams.get('query');
  
  let sql = `SELECT * FROM journal_entries WHERE user_id = ?`;
  const params: any[] = [user.id];

  if (source) {
    sql += ` AND source = ?`;
    params.push(source);
  }

  if (query) {
    sql += ` AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)`;
    const q = `%${query}%`;
    params.push(q, q, q);
  }

  sql += ` ORDER BY created_at DESC LIMIT 100`;

  const result = await env.DB.prepare(sql).bind(...params).all();
  
  // Parse tags
  const entries = result.results.map((e: any) => ({
    ...e,
    tags: JSON.parse(e.tags || '[]'),
    createdAt: new Date(e.created_at).getTime(),
    updatedAt: new Date(e.updated_at).getTime(),
    richContent: e.rich_content
  }));

  return jsonResponse({ entries }, 200, origin);
}

export async function handleCreateJournalEntry(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const { title, content, richContent, source, sourceId, tags } = await request.json() as any;

  // Storage Limit Check
  const limit = getStorageLimit(user.role);

  const usageResult = await env.DB.prepare(`
    SELECT SUM(LENGTH(content) + LENGTH(COALESCE(rich_content, ''))) as usage 
    FROM journal_entries WHERE user_id = ?
  `).bind(user.id).first<{ usage: number }>();
  
  const currentUsage = usageResult?.usage || 0;
  const newSize = (content?.length || 0) + (richContent?.length || 0);

  if (currentUsage + newSize > limit) {
    return jsonResponse({ error: 'Storage limit exceeded' }, 403, origin);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO journal_entries (id, user_id, title, content, rich_content, source, source_id, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, 
    user.id, 
    title || null, 
    content || '', 
    richContent || null, 
    source || 'journal_editor', 
    sourceId || null, 
    JSON.stringify(tags || []),
    now,
    now
  ).run();

  // Award XP for creating journal entry
  const xpAmount = XP_REWARDS.JOURNAL_ENTRY_SAVED;
  try {
    await env.DB.prepare(`
      INSERT INTO user_gamification (user_id, total_xp, level, current_streak, updated_at)
      VALUES (?, ?, 1, 0, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        total_xp = total_xp + excluded.total_xp,
        updated_at = CURRENT_TIMESTAMP
    `).bind(user.id, xpAmount).run();

    // Log XP transaction
    await env.DB.prepare(`
      INSERT INTO xp_transactions (user_id, amount, reason, action_type)
      VALUES (?, ?, ?, ?)
    `).bind(user.id, xpAmount, `Journal entry saved (${source || 'journal_editor'})`, 'JOURNAL_ENTRY_SAVED').run();
  } catch (error) {
    console.error(`Failed to award XP for journal entry for user ${user.id}:`, error);
    // Don't fail the request if XP award fails
  }

  return jsonResponse({ 
    entry: { 
      id, title, content, richContent, source, sourceId, tags: tags || [], 
      createdAt: new Date(now).getTime(), updatedAt: new Date(now).getTime() 
    } 
  }, 201, origin);
}

export async function handleUpdateJournalEntry(
  entryId: string,
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const { title, content, richContent, tags } = await request.json() as any;

  // Storage Limit Check
  const limit = getStorageLimit(user.role);

  const usageResult = await env.DB.prepare(`
    SELECT SUM(LENGTH(content) + LENGTH(COALESCE(rich_content, ''))) as usage 
    FROM journal_entries WHERE user_id = ? AND id != ?
  `).bind(user.id, entryId).first<{ usage: number }>();
  
  const currentUsage = usageResult?.usage || 0;
  const newSize = (content?.length || 0) + (richContent?.length || 0);

  if (currentUsage + newSize > limit) {
    return jsonResponse({ error: 'Storage limit exceeded' }, 403, origin);
  }

  const now = new Date().toISOString();

  const result = await env.DB.prepare(`
    UPDATE journal_entries 
    SET title = COALESCE(?, title),
        content = COALESCE(?, content),
        rich_content = COALESCE(?, rich_content),
        tags = COALESCE(?, tags),
        updated_at = ?
    WHERE id = ? AND user_id = ?
    RETURNING *
  `).bind(
    title || null, 
    content || null, 
    richContent || null, 
    tags ? JSON.stringify(tags) : null, 
    now,
    entryId, 
    user.id
  ).first();

  if (!result) {
    return jsonResponse({ error: 'Entry not found' }, 404, origin);
  }

  return jsonResponse({ 
    entry: {
      ...result,
      tags: JSON.parse((result as any).tags || '[]'),
      createdAt: new Date((result as any).created_at).getTime(),
      updatedAt: new Date((result as any).updated_at).getTime(),
      richContent: (result as any).rich_content
    }
  }, 200, origin);
}

export async function handleDeleteJournalEntry(
  entryId: string,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  await env.DB.prepare('DELETE FROM journal_entries WHERE id = ? AND user_id = ?')
    .bind(entryId, user.id).run();
  return jsonResponse({ success: true }, 200, origin);
}
