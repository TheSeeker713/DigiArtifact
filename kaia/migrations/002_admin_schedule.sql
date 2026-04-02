-- Admin auth tables (isolated from public app auth).
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  must_change_password INTEGER NOT NULL DEFAULT 1 CHECK (must_change_password IN (0, 1)),
  password_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user
ON admin_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires
ON admin_sessions(expires_at);

-- Shared schedule interaction state.
CREATE TABLE IF NOT EXISTS schedule_daily (
  date TEXT NOT NULL,
  data_key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (date, data_key)
);

CREATE INDEX IF NOT EXISTS idx_schedule_daily_date
ON schedule_daily(date);

CREATE TABLE IF NOT EXISTS schedule_streak (
  id TEXT PRIMARY KEY DEFAULT 'shared',
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  sprint_day INTEGER NOT NULL DEFAULT 0,
  sprint_start TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  history TEXT NOT NULL DEFAULT '[]',
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schedule_streak (
  id,
  current_streak,
  best_streak,
  sprint_day,
  sprint_start,
  total_xp,
  history
)
VALUES ('shared', 0, 0, 0, NULL, 0, '[]');

CREATE TABLE IF NOT EXISTS schedule_chores (
  id TEXT PRIMARY KEY,
  day_slot TEXT NOT NULL,
  text TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_schedule_chores_day_sort
ON schedule_chores(day_slot, sort_order);

CREATE TABLE IF NOT EXISTS schedule_plan (
  id TEXT PRIMARY KEY DEFAULT 'shared',
  top_1 TEXT NOT NULL DEFAULT '',
  top_2 TEXT NOT NULL DEFAULT '',
  top_3 TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  week_of TEXT,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schedule_plan (
  id,
  top_1,
  top_2,
  top_3,
  notes,
  week_of
)
VALUES ('shared', '', '', '', '', NULL);

-- Login attempt tracking for rate limiting (5/min/IP).
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip_time
ON admin_login_attempts(ip_hash, attempted_at);
