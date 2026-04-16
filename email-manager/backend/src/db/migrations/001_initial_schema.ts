import { Database } from 'better-sqlite3';

export function migrate001(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      email        TEXT NOT NULL UNIQUE,
      display_name TEXT,
      settings     TEXT,
      created_at   INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id                   TEXT PRIMARY KEY,
      user_id              TEXT NOT NULL REFERENCES users(id),
      display_name         TEXT,
      category             TEXT DEFAULT 'unknown' CHECK(category IN ('ceo_board','admin_ops','guest','supplier','staff','unknown')),
      is_vip               INTEGER DEFAULT 0,
      vip_rules            TEXT,
      response_sla_hours   INTEGER,
      notes                TEXT,
      created_at           INTEGER DEFAULT (unixepoch()),
      updated_at           INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS tone_profiles (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id            TEXT NOT NULL REFERENCES users(id),
      contact_email      TEXT NOT NULL,
      last_analyzed_at   INTEGER,
      sample_count       INTEGER DEFAULT 0,
      linguistic_profile TEXT NOT NULL DEFAULT '{}',
      raw_samples        TEXT DEFAULT '[]',
      created_at         INTEGER DEFAULT (unixepoch()),
      updated_at         INTEGER DEFAULT (unixepoch()),
      UNIQUE(user_id, contact_email)
    );

    CREATE TABLE IF NOT EXISTS email_cache (
      id                  TEXT PRIMARY KEY,
      user_id             TEXT NOT NULL REFERENCES users(id),
      internet_message_id TEXT,
      conversation_id     TEXT,
      from_email          TEXT,
      from_name           TEXT,
      to_emails           TEXT DEFAULT '[]',
      subject             TEXT,
      body_preview        TEXT,
      body_html           TEXT,
      body_text           TEXT,
      folder              TEXT DEFAULT 'inbox',
      is_read             INTEGER DEFAULT 0,
      has_attachments     INTEGER DEFAULT 0,
      received_at         INTEGER,
      sent_at             INTEGER,
      importance          TEXT DEFAULT 'normal',
      categories          TEXT DEFAULT '[]',
      ai_category         TEXT,
      ai_summary          TEXT,
      ai_sentiment        TEXT,
      ai_priority_score   INTEGER DEFAULT 0,
      action_items        TEXT DEFAULT '[]',
      has_meeting_request INTEGER DEFAULT 0,
      snoozed_until       INTEGER,
      synced_at           INTEGER DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_email_cache_user_folder
      ON email_cache(user_id, folder, received_at DESC);

    CREATE INDEX IF NOT EXISTS idx_email_cache_from
      ON email_cache(user_id, from_email);

    CREATE INDEX IF NOT EXISTS idx_email_cache_conversation
      ON email_cache(conversation_id);

    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL REFERENCES users(id),
      email_id    TEXT REFERENCES email_cache(id),
      description TEXT NOT NULL,
      due_date    INTEGER,
      is_done     INTEGER DEFAULT 0,
      priority    TEXT DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
      source      TEXT DEFAULT 'manual' CHECK(source IN ('ai_extracted','manual')),
      created_at  INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS follow_up_reminders (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      TEXT NOT NULL REFERENCES users(id),
      email_id     TEXT NOT NULL REFERENCES email_cache(id),
      remind_at    INTEGER NOT NULL,
      note         TEXT,
      is_triggered INTEGER DEFAULT 0,
      created_at   INTEGER DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_due
      ON follow_up_reminders(user_id, remind_at);

    CREATE TABLE IF NOT EXISTS templates (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          TEXT NOT NULL REFERENCES users(id),
      name             TEXT NOT NULL,
      category         TEXT,
      subject_template TEXT,
      body_template    TEXT NOT NULL,
      variables        TEXT DEFAULT '[]',
      usage_count      INTEGER DEFAULT 0,
      created_at       INTEGER DEFAULT (unixepoch()),
      updated_at       INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS response_time_log (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id                TEXT NOT NULL REFERENCES users(id),
      email_id               TEXT NOT NULL REFERENCES email_cache(id),
      contact_email          TEXT,
      category               TEXT,
      received_at            INTEGER,
      replied_at             INTEGER,
      response_time_minutes  INTEGER,
      within_sla             INTEGER
    );

    CREATE TABLE IF NOT EXISTS daily_briefings (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       TEXT NOT NULL REFERENCES users(id),
      briefing_date TEXT NOT NULL,
      content       TEXT NOT NULL,
      email_count   INTEGER DEFAULT 0,
      task_count    INTEGER DEFAULT 0,
      created_at    INTEGER DEFAULT (unixepoch()),
      UNIQUE(user_id, briefing_date)
    );

    CREATE TABLE IF NOT EXISTS review_response_scores (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL REFERENCES users(id),
      email_id    TEXT NOT NULL REFERENCES email_cache(id),
      draft_text  TEXT,
      score       INTEGER,
      score_notes TEXT,
      final_sent  INTEGER DEFAULT 0,
      created_at  INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     TEXT PRIMARY KEY,
      applied_at  INTEGER DEFAULT (unixepoch())
    );
  `);

  db.prepare(`INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)`).run('001');
}
