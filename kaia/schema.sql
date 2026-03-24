CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_checked INTEGER NOT NULL DEFAULT 0 CHECK (is_checked IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO checklist_items (id, section, label, sort_order)
VALUES
  ('bathroom_wall_paper', 'Bathroom', 'wall paper', 1),
  ('bathroom_shelf', 'Bathroom', 'shelf', 2),
  ('bathroom_bathtub', 'Bathroom', 'bathtub', 3),
  ('bathroom_shower_curtain', 'Bathroom', 'shower curtain', 4),
  ('bathroom_sweep_and_mop', 'Bathroom', 'sweep and mop', 5),
  ('bathroom_hang_picture', 'Bathroom', 'hang picture', 6),
  ('kitchen_clean_fan_thingy', 'Kitchen', 'clean fan thingy', 1),
  ('kitchen_water_removed_from_top_of_fridge', 'Kitchen', 'water removed from top of fridge', 2),
  ('kitchen_sweep_and_mop', 'Kitchen', 'sweep and mop', 3),
  ('kitchen_bake_a_cake', 'Kitchen', 'bake a cake', 4),
  ('living_room_charging_extension_cord', 'Living Room', 'charging extension cord', 1),
  ('living_room_desk_area_cleaned', 'Living Room', 'desk area cleaned', 2),
  ('living_room_weights_moved_to_desk_area', 'Living Room', 'weights moved to desk area', 3),
  ('living_room_dust', 'Living Room', 'dust', 4),
  ('living_room_put_away_jackets', 'Living Room', 'put away jackets', 5),
  ('living_room_fix_rack', 'Living Room', 'fix rack', 6),
  ('living_room_add_hat_pegs', 'Living Room', 'add hat pegs', 7),
  ('main_bedroom_move_things_to_bathroom', 'Main Bedroom', 'move things to bathroom', 1),
  ('main_bedroom_sweep', 'Main Bedroom', 'sweep', 2),
  ('main_bedroom_vacuum', 'Main Bedroom', 'vacuum', 3),
  ('main_bedroom_mop', 'Main Bedroom', 'mop', 4),
  ('main_bedroom_dust', 'Main Bedroom', 'dust', 5),
  ('main_bedroom_wash_bedding', 'Main Bedroom', 'wash bedding', 6);

-- Immutable backup archive of the original checklist source.
CREATE TABLE IF NOT EXISTS checklist_archive_sets (
  id TEXT PRIMARY KEY,
  source_version TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checklist_archive_items (
  archive_set_id TEXT NOT NULL,
  original_id TEXT NOT NULL,
  section TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_checked INTEGER NOT NULL CHECK (is_checked IN (0, 1)),
  updated_at TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (archive_set_id, original_id),
  FOREIGN KEY (archive_set_id) REFERENCES checklist_archive_sets(id)
);

INSERT OR IGNORE INTO checklist_archive_sets (id, source_version)
VALUES ('seed_v1', 'checklist_items_v1');

INSERT OR IGNORE INTO checklist_archive_items (
  archive_set_id,
  original_id,
  section,
  label,
  sort_order,
  is_checked,
  updated_at
)
SELECT
  'seed_v1',
  id,
  section,
  label,
  sort_order,
  is_checked,
  updated_at
FROM checklist_items;

-- Phase A: Live collaboration event stream (room-by-list over polling/SSE transport).
CREATE TABLE IF NOT EXISTS collab_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_collab_events_list_id_id
ON collab_events(list_id, id);

-- Phase B1: Routine engine primitives.
CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120),
  schedule_window TEXT NOT NULL DEFAULT 'anytime',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS routine_steps (
  id TEXT PRIMARY KEY,
  routine_id TEXT NOT NULL,
  label TEXT NOT NULL CHECK(length(trim(label)) BETWEEN 1 AND 200),
  sort_order INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (routine_id) REFERENCES routines(id)
);

CREATE TABLE IF NOT EXISTS routine_runs (
  id TEXT PRIMARY KEY,
  routine_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (routine_id) REFERENCES routines(id)
);

CREATE INDEX IF NOT EXISTS idx_routine_steps_routine
ON routine_steps(routine_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_routine_runs_routine
ON routine_runs(routine_id, started_at);

INSERT OR IGNORE INTO routines (id, name, schedule_window, is_active)
VALUES ('home_checklist_routine', 'Home Checklist Routine', 'anytime', 1);

INSERT OR IGNORE INTO routine_steps (id, routine_id, label, sort_order, duration_minutes)
VALUES
  ('home_step_1', 'home_checklist_routine', 'Pick one room card', 0, 3),
  ('home_step_2', 'home_checklist_routine', 'Complete one checklist item', 1, 5),
  ('home_step_3', 'home_checklist_routine', 'Mark it done and hydrate', 2, 2);

-- Phase B2: Gamification core state + event ledger.
CREATE TABLE IF NOT EXISTS gamification_state (
  profile_id TEXT PRIMARY KEY,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  momentum INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  freeze_tokens INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gamification_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  delta_xp INTEGER NOT NULL DEFAULT 0,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO gamification_state (
  profile_id, xp, level, momentum, streak_days, freeze_tokens
)
VALUES ('anonymous', 0, 1, 0, 0, 1);

CREATE INDEX IF NOT EXISTS idx_gamification_events_profile
ON gamification_events(profile_id, id);

-- Phase B3: KAIA coach messages.
CREATE TABLE IF NOT EXISTS kaia_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kaia_messages_profile
ON kaia_messages(profile_id, id);

-- Phase B4: Analytics and personalization event stream.
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_profile_time
ON analytics_events(profile_id, created_at);

CREATE TABLE IF NOT EXISTS todo_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS todo_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL,
  section TEXT,
  label TEXT NOT NULL CHECK(length(trim(label)) BETWEEN 1 AND 200),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_checked INTEGER NOT NULL DEFAULT 0 CHECK (is_checked IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (list_id) REFERENCES todo_lists(id)
);

CREATE INDEX IF NOT EXISTS idx_todo_lists_active
ON todo_lists(archived_at, sort_order);

CREATE INDEX IF NOT EXISTS idx_todo_items_list_active
ON todo_items(list_id, deleted_at, sort_order);

INSERT OR IGNORE INTO todo_lists (id, name, sort_order)
VALUES ('default_home_checklist', 'Home Checklist', 0);

-- Initial migration copy from legacy table into the new list/item model.
INSERT OR IGNORE INTO todo_items (
  id,
  list_id,
  section,
  label,
  sort_order,
  is_checked,
  created_at,
  updated_at
)
SELECT
  id,
  'default_home_checklist',
  section,
  label,
  sort_order,
  is_checked,
  datetime('now'),
  updated_at
FROM checklist_items;
