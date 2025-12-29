/**
 * Server-Authoritative XP Action Constants
 * 
 * This is the SOURCE OF TRUTH for XP values.
 * The client CANNOT dictate XP amounts - only action types.
 * 
 * Security: All XP awards must go through the server using these predefined values.
 */

export type XPActionType =
  | 'NOTE_ADDED'
  | 'SESSION_COMPLETED'
  | 'CHECKLIST_COMPLETE'
  | 'CLOCK_IN'
  | 'CLOCK_OUT'
  | 'FOCUS_SESSION_COMPLETE'
  | 'TASK_COMPLETED'
  | 'GOAL_CREATED'
  | 'QUICK_NOTE'
  | 'JOURNAL_ENTRY_SAVED'
  | 'BODY_DOUBLING_SESSION'
  | 'BLOCK_COMPLETED'
  | 'WEEKLY_MILESTONE';

/**
 * XP Reward Table - Server Authoritative
 * 
 * These values are enforced by the server.
 * Clients can only request actions, not amounts.
 */
export const XP_REWARDS: Record<XPActionType, number> = {
  NOTE_ADDED: 5,
  SESSION_COMPLETED: 10, // Per 15-minute block or standard session
  CHECKLIST_COMPLETE: 20,
  CLOCK_IN: 10,
  CLOCK_OUT: 20,
  FOCUS_SESSION_COMPLETE: 30,
  TASK_COMPLETED: 15,
  GOAL_CREATED: 10,
  QUICK_NOTE: 5,
  JOURNAL_ENTRY_SAVED: 20,
  BODY_DOUBLING_SESSION: 30,
  BLOCK_COMPLETED: 10, // Base XP for completing a schedule block
  WEEKLY_MILESTONE: 1000, // Special milestone rewards
} as const;

/**
 * Get XP amount for an action type
 * Returns null if action type is invalid
 */
export function getXPForAction(actionType: string): number | null {
  if (actionType in XP_REWARDS) {
    return XP_REWARDS[actionType as XPActionType];
  }
  return null;
}

/**
 * Validate if an action type is valid
 */
export function isValidActionType(actionType: string): actionType is XPActionType {
  return actionType in XP_REWARDS;
}

