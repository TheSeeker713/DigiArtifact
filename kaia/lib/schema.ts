import { getDb } from "@/lib/db";

const CORE_SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS checklist_archive_sets (
    id TEXT PRIMARY KEY,
    source_version TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS checklist_archive_items (
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
  )`,
  `CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS app_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON app_sessions(user_id)`,
  `CREATE TABLE IF NOT EXISTS todo_lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    archived_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS todo_items (
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
  )`,
  `CREATE TABLE IF NOT EXISTS todo_list_members (
    list_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (list_id, user_id),
    FOREIGN KEY (list_id) REFERENCES todo_lists(id),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_todo_lists_active ON todo_lists(archived_at, sort_order)`,
  `CREATE INDEX IF NOT EXISTS idx_todo_items_list_active ON todo_items(list_id, deleted_at, sort_order)`,
  `CREATE INDEX IF NOT EXISTS idx_todo_list_members_user ON todo_list_members(user_id)`,
  `CREATE TABLE IF NOT EXISTS routines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120),
    schedule_window TEXT NOT NULL DEFAULT 'anytime',
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS routine_steps (
    id TEXT PRIMARY KEY,
    routine_id TEXT NOT NULL,
    label TEXT NOT NULL CHECK(length(trim(label)) BETWEEN 1 AND 200),
    sort_order INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 5,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (routine_id) REFERENCES routines(id)
  )`,
  `CREATE TABLE IF NOT EXISTS routine_runs (
    id TEXT PRIMARY KEY,
    routine_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'started',
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (routine_id) REFERENCES routines(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_routine_steps_routine ON routine_steps(routine_id, sort_order)`,
  `CREATE INDEX IF NOT EXISTS idx_routine_runs_routine ON routine_runs(routine_id, started_at)`,
  `CREATE TABLE IF NOT EXISTS user_routines (
    routine_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (routine_id, user_id),
    FOREIGN KEY (routine_id) REFERENCES routines(id),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_routines_user ON user_routines(user_id)`,
  `CREATE TABLE IF NOT EXISTS user_routine_runs (
    run_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (run_id, user_id),
    FOREIGN KEY (run_id) REFERENCES routine_runs(id),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_routine_runs_user ON user_routine_runs(user_id)`,
  `CREATE TABLE IF NOT EXISTS collab_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_collab_events_list_id_id ON collab_events(list_id, id)`,
  `CREATE TABLE IF NOT EXISTS gamification_state (
    profile_id TEXT PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    momentum INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    freeze_tokens INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS gamification_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    delta_xp INTEGER NOT NULL DEFAULT 0,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_gamification_events_profile ON gamification_events(profile_id, id)`,
  `CREATE TABLE IF NOT EXISTS kaia_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_kaia_messages_profile ON kaia_messages(profile_id, id)`,
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_events_profile_time ON analytics_events(profile_id, created_at)`,
  `INSERT OR IGNORE INTO checklist_archive_sets (id, source_version)
   VALUES ('seed_v1', 'checklist_items_v1')`,
  `INSERT OR IGNORE INTO gamification_state (
     profile_id, xp, level, momentum, streak_days, freeze_tokens
   )
   VALUES ('anonymous', 0, 1, 0, 0, 1)`,
];

let ensureSchemaPromise: Promise<void> | null = null;

export async function ensureCoreSchema() {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      const db = getDb();
      for (const statement of CORE_SCHEMA_STATEMENTS) {
        await db.prepare(statement).run();
      }
    })().catch((error) => {
      ensureSchemaPromise = null;
      throw error;
    });
  }
  await ensureSchemaPromise;
}
