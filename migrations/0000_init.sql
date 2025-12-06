-- Better Auth core tables
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER DEFAULT 0,
  image TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  handle TEXT UNIQUE,
  headline TEXT,
  privacy_settings TEXT DEFAULT '{"show_phone":false,"show_address":false}',
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  role TEXT CHECK (role IN ('student','recent_graduate','junior_professional','mid_level_professional','senior_professional','freelancer'))
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at TEXT,
  refresh_token_expires_at TEXT,
  scope TEXT,
  id_token TEXT,
  password TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Application tables
CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_claim' CHECK (status IN ('pending_claim','processing','completed','failed','waiting_for_cache')),
  replicate_job_id TEXT,
  error_message TEXT,
  parsed_at TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  file_hash TEXT,
  parsed_content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_data (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE,
  resume_id TEXT REFERENCES resumes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  theme_id TEXT DEFAULT 'minimalist_editorial',
  last_published_at TEXT DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS handle_changes (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  old_handle TEXT,
  new_handle TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS upload_rate_limits (
  id TEXT PRIMARY KEY NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_handle ON user(handle);
CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);
CREATE INDEX IF NOT EXISTS idx_resumes_file_hash ON resumes(file_hash) WHERE status = 'completed' AND file_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_site_data_user_id ON site_data(user_id);
CREATE INDEX IF NOT EXISTS idx_handle_changes_user_id ON handle_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_rate_limits_lookup ON upload_rate_limits(ip_hash, created_at DESC);

-- Enable foreign keys
PRAGMA foreign_keys = ON;
