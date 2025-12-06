/**
 * Schedule blocks routes
 */
import { Env, User, jsonResponse } from '../utils';

export async function handleGetBlocks(
  url: URL,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  const blocks = await env.DB.prepare(`
    SELECT sb.*, s.start_time as shift_start, s.end_time as shift_end
    FROM schedule_blocks sb
    LEFT JOIN shifts s ON sb.shift_id = s.id
    WHERE sb.user_id = ? AND date(sb.start_time) = ?
    ORDER BY sb.order_index ASC
  `).bind(user.id, date).all();

  return jsonResponse({ 
    blocks: blocks.results,
    date,
  }, 200, origin);
}

export async function handleSaveBlocks(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
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
  `).bind(user.id, date).first<{ id: number }>();

  if (!shift) {
    const firstBlock = blocks[0];
    const lastBlock = blocks[blocks.length - 1];
    
    shift = await env.DB.prepare(`
      INSERT INTO shifts (user_id, start_time, end_time, status)
      VALUES (?, ?, ?, 'draft')
      RETURNING id
    `).bind(user.id, firstBlock.start_time, lastBlock.end_time).first<{ id: number }>();
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
      user.id,
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

export async function handleUpdateBlock(
  blockId: string,
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
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
    user.id
  ).first();

  if (!result) {
    return jsonResponse({ error: 'Block not found' }, 404, origin);
  }

  return jsonResponse({ block: result }, 200, origin);
}

export async function handleGetIncompleteBlocks(
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
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
  `).bind(user.id, yesterdayStr).all();

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

export async function handleCarryover(
  request: Request,
  env: Env,
  user: User,
  origin: string
): Promise<Response> {
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
  `).bind(user.id).run();

  return jsonResponse({
    success: true,
    blocks_carried: block_ids.length,
    carry_to_date,
  }, 200, origin);
}
