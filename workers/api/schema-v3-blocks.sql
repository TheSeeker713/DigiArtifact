-- DigiArtifact Workers Portal Database Schema v3
-- Block-Based Scheduling System
-- Updated: December 2025

-- ============================================
-- BLOCK-BASED SCHEDULING TABLES
-- ============================================

-- Shifts: Parent container for a work day's blocks
CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  shift_date DATE NOT NULL,
  planned_start_time TEXT NOT NULL,                       -- ISO time: "08:00"
  planned_end_time TEXT NOT NULL,                         -- ISO time: "17:00"
  actual_start_time TEXT,
  actual_end_time TEXT,
  total_work_minutes INTEGER DEFAULT 0,
  total_break_minutes INTEGER DEFAULT 0,
  
  -- Status tracking
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',     -- Future shift
    'in_progress',   -- Currently working
    'completed',     -- All blocks done
    'partial',       -- Some blocks completed
    'missed'         -- Shift was not started
  )),
  
  -- Gamification
  xp_earned INTEGER DEFAULT 0,
  streak_day INTEGER DEFAULT 0,                           -- Which day of current streak
  completion_percentage INTEGER DEFAULT 0,
  
  -- Carry-over from previous incomplete day
  carried_minutes INTEGER DEFAULT 0,                      -- Minutes rolled over from yesterday
  carry_reason TEXT,                                      -- Why time was carried
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, shift_date)
);

-- Schedule Blocks: Individual work/break segments within a shift
CREATE TABLE IF NOT EXISTS schedule_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- Time management
  planned_start_time TEXT NOT NULL,                       -- ISO time: "08:00"
  planned_end_time TEXT NOT NULL,                         -- ISO time: "10:00"
  actual_start_time TEXT,
  actual_end_time TEXT,
  duration_minutes INTEGER NOT NULL,                      -- Planned duration
  actual_duration_minutes INTEGER DEFAULT 0,
  
  -- Block classification
  block_type TEXT NOT NULL CHECK (block_type IN ('WORK', 'BREAK', 'LUNCH', 'FLEX')),
  order_index INTEGER NOT NULL,                           -- Order within the shift (0, 1, 2...)
  
  -- Status tracking for gamification
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',       -- Not yet started
    'in_progress',   -- Currently in this block
    'completed',     -- Successfully finished
    'skipped',       -- User chose to skip
    'partial',       -- Started but not finished
    'extended'       -- Ran over planned time
  )),
  
  -- Focus/productivity tracking
  focus_score INTEGER DEFAULT 0,                          -- 0-100 based on completion
  interruption_count INTEGER DEFAULT 0,
  
  -- Project association (for WORK blocks)
  project_id INTEGER,
  project_name TEXT,
  
  -- Task/activity description
  activity_label TEXT,                                    -- "Deep Work", "Meetings", etc.
  notes TEXT,
  
  -- Rewards earned for this block
  xp_earned INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Block Rewards: Rewards/bonuses for completing blocks
CREATE TABLE IF NOT EXISTS block_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- Reward details
  reward_type TEXT NOT NULL CHECK (reward_type IN (
    'completion',    -- Finished the block
    'streak',        -- Part of a streak bonus
    'perfect_day',   -- All blocks completed
    'early_start',   -- Started block early
    'focus_bonus',   -- High focus score
    'milestone'      -- Reached a milestone
  )),
  
  xp_amount INTEGER NOT NULL,
  description TEXT,
  
  -- Milestone tracking
  milestone_name TEXT,                                    -- "Week Warrior", "Focus Master", etc.
  milestone_tier INTEGER,                                 -- Bronze=1, Silver=2, Gold=3
  
  claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (block_id) REFERENCES schedule_blocks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily Goals: Target hours and completion tracking
CREATE TABLE IF NOT EXISTS daily_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  goal_date DATE NOT NULL,
  
  -- Target hours
  target_work_minutes INTEGER NOT NULL DEFAULT 480,       -- 8 hours default
  actual_work_minutes INTEGER DEFAULT 0,
  
  -- Block completion
  total_blocks INTEGER DEFAULT 4,
  completed_blocks INTEGER DEFAULT 0,
  
  -- Goal met?
  is_met BOOLEAN DEFAULT 0,
  is_exceeded BOOLEAN DEFAULT 0,
  
  -- Carry-over handling
  deficit_minutes INTEGER DEFAULT 0,                      -- How much was missed
  surplus_minutes INTEGER DEFAULT 0,                      -- How much extra was done
  carry_to_next_day BOOLEAN DEFAULT 0,                    -- Should deficit be added to tomorrow?
  
  -- Streak tracking
  streak_day INTEGER DEFAULT 0,
  streak_broken BOOLEAN DEFAULT 0,
  
  -- Rewards
  xp_earned INTEGER DEFAULT 0,
  bonuses_applied TEXT,                                   -- JSON array of bonus types
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, goal_date)
);

-- Weekly Milestones: Track weekly progress
CREATE TABLE IF NOT EXISTS weekly_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  week_start DATE NOT NULL,                               -- Monday of the week
  
  -- Weekly targets
  target_work_minutes INTEGER DEFAULT 2400,               -- 40 hours
  actual_work_minutes INTEGER DEFAULT 0,
  
  -- Daily completion tracking
  days_worked INTEGER DEFAULT 0,
  days_goal_met INTEGER DEFAULT 0,
  perfect_days INTEGER DEFAULT 0,                         -- All blocks completed
  
  -- Streak info
  current_streak INTEGER DEFAULT 0,
  longest_streak_this_week INTEGER DEFAULT 0,
  
  -- Milestone achievements
  milestone_unlocked BOOLEAN DEFAULT 0,
  milestone_name TEXT,
  milestone_tier INTEGER,
  
  -- Carry-over tracking
  total_deficit_minutes INTEGER DEFAULT 0,
  total_surplus_minutes INTEGER DEFAULT 0,
  net_balance_minutes INTEGER DEFAULT 0,                  -- Surplus - Deficit
  
  -- Rewards
  xp_earned INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, week_start)
);

-- Block Templates: Reusable block configurations
CREATE TABLE IF NOT EXISTS block_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,                                        -- NULL = system template
  template_name TEXT NOT NULL,
  description TEXT,
  
  -- Block configuration as JSON
  -- Format: [{ type: "WORK", duration: 120, label: "Deep Work" }, ...]
  blocks_json TEXT NOT NULL,
  
  -- Total durations
  total_work_minutes INTEGER DEFAULT 0,
  total_break_minutes INTEGER DEFAULT 0,
  
  is_default BOOLEAN DEFAULT 0,
  is_public BOOLEAN DEFAULT 0,                            -- Can other users use this?
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON shifts(user_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_shift ON schedule_blocks(shift_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_user ON schedule_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_status ON schedule_blocks(status);
CREATE INDEX IF NOT EXISTS idx_block_rewards_user ON block_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON daily_goals(user_id, goal_date);
CREATE INDEX IF NOT EXISTS idx_weekly_milestones_user ON weekly_milestones(user_id, week_start);

-- ============================================
-- DEFAULT BLOCK TEMPLATES
-- ============================================

-- Standard 8-hour workday template
INSERT OR IGNORE INTO block_templates (user_id, template_name, description, blocks_json, total_work_minutes, total_break_minutes, is_default, is_public)
VALUES (
  NULL,
  'Standard Workday',
  '4 focus blocks with breaks - classic 8-hour structure',
  '[
    {"type": "WORK", "duration": 120, "label": "Morning Focus Block 1"},
    {"type": "BREAK", "duration": 15, "label": "Short Break"},
    {"type": "WORK", "duration": 120, "label": "Morning Focus Block 2"},
    {"type": "LUNCH", "duration": 30, "label": "Lunch Break"},
    {"type": "WORK", "duration": 120, "label": "Afternoon Focus Block 1"},
    {"type": "BREAK", "duration": 15, "label": "Short Break"},
    {"type": "WORK", "duration": 120, "label": "Afternoon Focus Block 2"}
  ]',
  480,
  60,
  1,
  1
);

-- Pomodoro style template
INSERT OR IGNORE INTO block_templates (user_id, template_name, description, blocks_json, total_work_minutes, total_break_minutes, is_public)
VALUES (
  NULL,
  'Pomodoro Extended',
  '8 pomodoro sessions (25min work, 5min break)',
  '[
    {"type": "WORK", "duration": 25, "label": "Pomodoro 1"},
    {"type": "BREAK", "duration": 5, "label": "Short Break"},
    {"type": "WORK", "duration": 25, "label": "Pomodoro 2"},
    {"type": "BREAK", "duration": 5, "label": "Short Break"},
    {"type": "WORK", "duration": 25, "label": "Pomodoro 3"},
    {"type": "BREAK", "duration": 5, "label": "Short Break"},
    {"type": "WORK", "duration": 25, "label": "Pomodoro 4"},
    {"type": "BREAK", "duration": 30, "label": "Long Break"},
    {"type": "WORK", "duration": 25, "label": "Pomodoro 5"},
    {"type": "BREAK", "duration": 5, "label": "Short Break"},
    {"type": "WORK", "duration": 25, "label": "Pomodoro 6"},
    {"type": "BREAK", "duration": 5, "label": "Short Break"},
    {"type": "WORK", "duration": 25, "label": "Pomodoro 7"},
    {"type": "BREAK", "duration": 5, "label": "Short Break"},
    {"type": "WORK", "duration": 25, "label": "Pomodoro 8"}
  ]',
  200,
  65,
  1
);

-- Deep Work template
INSERT OR IGNORE INTO block_templates (user_id, template_name, description, blocks_json, total_work_minutes, total_break_minutes, is_public)
VALUES (
  NULL,
  'Deep Work Day',
  '3 long focus sessions for complex work',
  '[
    {"type": "WORK", "duration": 180, "label": "Deep Work Session 1"},
    {"type": "BREAK", "duration": 30, "label": "Recovery Break"},
    {"type": "WORK", "duration": 180, "label": "Deep Work Session 2"},
    {"type": "LUNCH", "duration": 60, "label": "Extended Lunch"},
    {"type": "WORK", "duration": 120, "label": "Light Work/Admin"}
  ]',
  480,
  90,
  1
);

-- Flexible template
INSERT OR IGNORE INTO block_templates (user_id, template_name, description, blocks_json, total_work_minutes, total_break_minutes, is_public)
VALUES (
  NULL,
  'Flexible Half-Day',
  '4-hour flexible schedule',
  '[
    {"type": "WORK", "duration": 90, "label": "Focus Block"},
    {"type": "BREAK", "duration": 15, "label": "Short Break"},
    {"type": "WORK", "duration": 90, "label": "Focus Block"},
    {"type": "BREAK", "duration": 15, "label": "Short Break"},
    {"type": "FLEX", "duration": 60, "label": "Flex Time (Work or Admin)"}
  ]',
  240,
  30,
  1
);

-- ============================================
-- MILESTONE DEFINITIONS (as reference data)
-- ============================================

-- This would typically be in application code, but documenting here for reference:
-- 
-- DAILY MILESTONES:
-- - "First Block" (50 XP) - Complete your first block of the day
-- - "Half Day" (100 XP) - Complete 2 of 4 blocks
-- - "Almost There" (150 XP) - Complete 3 of 4 blocks
-- - "Perfect Day" (300 XP) - Complete all 4 blocks
-- - "Early Bird" (75 XP) - Start before scheduled time
-- - "Night Owl" (75 XP) - Work past 8 PM
--
-- STREAK MILESTONES:
-- - "Getting Started" (100 XP) - 3 consecutive days
-- - "Week Warrior" (250 XP) - 7 consecutive days
-- - "Fortnight Fighter" (500 XP) - 14 consecutive days
-- - "Monthly Master" (1000 XP) - 30 consecutive days
--
-- WEEKLY MILESTONES:
-- - "Full Week" (500 XP) - Work all 5 weekdays
-- - "Overtime Hero" (300 XP) - Exceed 40 hours
-- - "Perfect Week" (1000 XP) - All blocks completed for 5 days
-- - "6-Day Champion" (750 XP) - Full completion for 6 days
