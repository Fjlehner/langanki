-- LangAnki sync database (Cloudflare D1).
-- One row per learner. The code itself is never stored, only its SHA-256 hash.
CREATE TABLE IF NOT EXISTS profiles (
  code_hash  TEXT PRIMARY KEY,
  data       TEXT NOT NULL,            -- the learner's progress as JSON
  version    INTEGER NOT NULL DEFAULT 1, -- bumped on every save; used to merge two devices
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Counters for wrong-code guesses and new codes, per IP address and time window.
CREATE TABLE IF NOT EXISTS limits (
  key     TEXT PRIMARY KEY,  -- kind:ip:window
  n       INTEGER NOT NULL,
  expires INTEGER NOT NULL   -- unix ms
);
