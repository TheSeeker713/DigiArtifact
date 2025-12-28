-- DigiArtifact Workers Portal - Complete Schema (v1.0)
-- Cloudflare D1 (SQLite) Compatible

-- ============================================
-- 1. CORE SYSTEM (Users, Projects, Auth)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  active BOOLEAN DEFAULT 1,
  google_id TEXT UNIQUE, -- Added from v4-oauth
  google_picture TEXT,   -- Added from v4-oauth
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#cca43b',
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  clock_in DATETIME NOT NULL,
  clock_out DATETIME,
  break_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS breaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time_entry_id INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (time_entry_id) REFERENCES time_entries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT,
  content TEXT,
  rich_content TEXT,
  source TEXT NOT NULL,
  source_id TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 2. GAMIFICATION ENGINE (XP, Streaks)
-- ============================================

CREATE TABLE IF NOT EXISTS user_gamification (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_work_minutes INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  focus_sessions INTEGER DEFAULT 0,
  achievements TEXT DEFAULT '[]', -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS xp_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  action_type TEXT DEFAULT 'general',
  block_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 3. SCHEDULER (Shifts, Blocks, Templates)
-- ============================================

CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  shift_date DATE NOT NULL,
  planned_start_time TEXT NOT NULL,
  planned_end_time TEXT NOT NULL,
  actual_start_time TEXT,
  actual_end_time TEXT,
  status TEXT DEFAULT 'scheduled',
  xp_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, shift_date)
);

CREATE TABLE IF NOT EXISTS schedule_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  planned_start_time TEXT NOT NULL,
  planned_end_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('WORK', 'BREAK', 'LUNCH', 'FLEX')),
  order_index INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  project_id INTEGER,
  activity_label TEXT,
  notes TEXT,
  xp_earned INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS block_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, -- NULL = System Template
  template_name TEXT NOT NULL,
  description TEXT,
  blocks_json TEXT NOT NULL,
  total_work_minutes INTEGER DEFAULT 0,
  total_break_minutes INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT 0,
  is_public BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 4. INDEXES & SEED DATA
-- ============================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id, clock_in);
CREATE INDEX IF NOT EXISTS idx_gamification_streak ON user_gamification(current_streak);
CREATE INDEX IF NOT EXISTS idx_blocks_shift ON schedule_blocks(shift_id);

-- Default Admin
INSERT OR IGNORE INTO users (email, name, role, active) 
VALUES ('admin@digiartifact.com', 'Admin', 'admin', 1);

-- Default Projects
INSERT OR IGNORE INTO projects (name, description, color) VALUES
('DigiArtifact Hub', 'Main company website', '#cca43b'),
('Client Work', 'External client projects', '#046c4e'),
('Deep Work', 'Focused research and development', '#00f0ff');

-- Default Schedule Template (Standard 8hr)
INSERT OR IGNORE INTO block_templates (template_name, description, blocks_json, total_work_minutes, total_break_minutes, is_default, is_public)
VALUES (
  'Standard Workday',
  '4 focus blocks with breaks - classic 8-hour structure',
  '[{"type":"WORK","duration":120,"label":"Morning Focus"},{"type":"BREAK","duration":15,"label":"Break"},{"type":"WORK","duration":120,"label":"Morning Focus 2"},{"type":"LUNCH","duration":30,"label":"Lunch"},{"type":"WORK","duration":120,"label":"Afternoon Focus"},{"type":"BREAK","duration":15,"label":"Break"},{"type":"WORK","duration":120,"label":"Afternoon Focus 2"}]',
  480, 60, 1, 1
);