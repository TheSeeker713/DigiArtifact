/**
 * Configuration routes
 * Returns dynamic configuration like XP_CONFIG and default templates
 */
import { Env, jsonResponse } from '../utils/responses';
import { getDb } from '../db/client';
import { blockTemplates } from '../db/schema';
import { eq } from 'drizzle-orm';

// XP Configuration (matches frontend constants)
const XP_CONFIG = {
  clockIn: 10,
  clockOut: 20,
  hourWorked: 50,
  streakDay: 25,
  streak3Days: 100,
  streak7Days: 250,
  streak30Days: 1000,
  focusSessionComplete: 30,
  taskComplete: 15,
  noteCreated: 5,
  earlyArrival: 50,
  fullWeek: 500,
};

export async function handleGetConfig(
  env: Env,
  origin: string
): Promise<Response> {
  const db = getDb(env);

  // Fetch default template from database
  const defaultTemplateResult = await db
    .select()
    .from(blockTemplates)
    .where(eq(blockTemplates.isDefault, true))
    .limit(1);

  let defaultTemplate = null;
  if (defaultTemplateResult.length > 0) {
    const template = defaultTemplateResult[0];
    try {
      defaultTemplate = {
        name: template.templateName,
        description: template.description,
        blocks: JSON.parse(template.blocksJson),
        totalWorkMinutes: template.totalWorkMinutes,
        totalBreakMinutes: template.totalBreakMinutes,
      };
    } catch (error) {
      console.error('Failed to parse template JSON:', error);
    }
  }

  // Fallback to hardcoded template if database doesn't have one
  if (!defaultTemplate) {
    defaultTemplate = {
      name: 'Standard Workday',
      description: '4 focus blocks with breaks - classic 8-hour structure',
      blocks: [
        { type: 'WORK', duration: 120, label: 'Morning Focus' },
        { type: 'BREAK', duration: 15, label: 'Break' },
        { type: 'WORK', duration: 120, label: 'Morning Focus 2' },
        { type: 'LUNCH', duration: 30, label: 'Lunch' },
        { type: 'WORK', duration: 120, label: 'Afternoon Focus' },
        { type: 'BREAK', duration: 15, label: 'Break' },
        { type: 'WORK', duration: 120, label: 'Afternoon Focus 2' },
      ],
      totalWorkMinutes: 480,
      totalBreakMinutes: 60,
    };
  }

  return jsonResponse(
    {
      xpConfig: XP_CONFIG,
      defaultTemplate,
    },
    200,
    origin
  );
}

