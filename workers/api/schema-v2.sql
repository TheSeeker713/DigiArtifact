-- DigiArtifact Workers Portal Database Schema v2
-- Cloudflare D1 (SQLite)
-- Updated: December 3, 2025

-- ============================================
-- EXISTING TABLES (from v1)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#cca43b',
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Time entries table
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

-- Break logs table
CREATE TABLE IF NOT EXISTS breaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time_entry_id INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (time_entry_id) REFERENCES time_entries(id) ON DELETE CASCADE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- NEW TABLES (v2) - Scheduling & Accessibility
-- ============================================

-- Employee settings with pay rates and accessibility preferences
CREATE TABLE IF NOT EXISTS employee_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  
  -- Pay settings (stored as integers for precision)
  hourly_rate_cents INTEGER NOT NULL DEFAULT 0,           -- $17.25 = 1725
  max_weekly_minutes INTEGER DEFAULT 2400,                -- 40 hours = 2400 min
  overtime_threshold_minutes INTEGER DEFAULT 2400,
  overtime_rate_percent INTEGER DEFAULT 150,              -- 150 = 1.5x
  
  -- Accessibility preferences
  arrival_buffer_minutes INTEGER DEFAULT 15,
  departure_buffer_minutes INTEGER DEFAULT 10,
  break_reminder_interval_minutes INTEGER DEFAULT 90,
  preferred_reminder_style TEXT DEFAULT 'clear',          -- gentle, clear, persistent
  show_time_remaining BOOLEAN DEFAULT 1,
  show_visual_progress BOOLEAN DEFAULT 1,
  reduce_animations BOOLEAN DEFAULT 0,
  high_contrast_mode BOOLEAN DEFAULT 0,
  
  -- Smart suggestions preferences
  smart_suggestions_enabled BOOLEAN DEFAULT 1,
  suggestion_idle_seconds INTEGER DEFAULT 15,
  
  -- Notification preferences
  notify_night_before BOOLEAN DEFAULT 1,
  notify_morning_of BOOLEAN DEFAULT 1,
  notify_before_shift_minutes INTEGER DEFAULT 30,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Scheduled shifts (minute precision)
CREATE TABLE IF NOT EXISTS scheduled_shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  shift_date DATE NOT NULL,
  start_time_minutes INTEGER NOT NULL,                    -- Minutes from midnight (9:00 AM = 540)
  end_time_minutes INTEGER NOT NULL,                      -- 5:00 PM = 1020
  break_minutes INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'draft',                            -- draft, published, acknowledged, completed
  
  -- Change tracking
  previous_start_time INTEGER,
  previous_end_time INTEGER,
  changed_at DATETIME,
  change_acknowledged BOOLEAN DEFAULT 0,
  
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Schedule templates for recurring schedules
CREATE TABLE IF NOT EXISTS schedule_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  day_of_week INTEGER,                                    -- 0=Monday, 6=Sunday
  start_time_minutes INTEGER,
  end_time_minutes INTEGER,
  break_minutes INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- NEW TABLES (v2) - Notes & Reports
-- ============================================

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  title TEXT,
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT 0,
  archived BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  report_type TEXT DEFAULT 'daily',                       -- daily, weekly, monthly, custom
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  report_date DATE,
  status TEXT DEFAULT 'draft',                            -- draft, submitted, reviewed
  submitted_at DATETIME,
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in ON time_entries(clock_in);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_breaks_time_entry_id ON breaks(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_scheduled_shifts_user_id ON scheduled_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_shifts_date ON scheduled_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Default admin user (PIN: 1234)
INSERT OR IGNORE INTO users (email, name, pin_hash, role) 
VALUES ('admin@digiartifact.com', 'Admin', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'admin');

-- Default projects (updated with new categories)
INSERT OR IGNORE INTO projects (name, description, color) VALUES
('DigiArtifact Hub', 'Main company website and hub development', '#cca43b'),
('Secret Vault', 'Members-only content platform', '#00f0ff'),
('Client Work', 'External client projects', '#046c4e'),
('Video Editing', 'Video production and post-processing', '#e53935'),
('AI Content Creation', 'AI-assisted content generation and curation', '#9c27b0'),
('Design Work', 'Graphics, UI/UX, and visual design projects', '#ff9800'),
('Prompt Engineering', 'AI prompt development and optimization', '#00bcd4');

-- Default employee settings for admin
INSERT OR IGNORE INTO employee_settings (user_id, hourly_rate_cents, max_weekly_minutes)
SELECT id, 0, 2400 FROM users WHERE email = 'admin@digiartifact.com';
