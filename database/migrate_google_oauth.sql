ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique ON users (google_id) WHERE google_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS oauth_states (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  state_hash VARCHAR(64) NOT NULL UNIQUE,
  purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('login', 'link')),
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS oauth_states_expires_idx ON oauth_states (expires_at);
