-- Feature migration for streaks + daily quotes.
-- Run through: npm run migrate:features

CREATE TABLE IF NOT EXISTS practice_activity (
  activity_date DATE PRIMARY KEY,
  problems_solved INTEGER NOT NULL DEFAULT 0 CHECK (problems_solved >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practice_activity_problems (
  activity_date DATE NOT NULL REFERENCES practice_activity(activity_date) ON DELETE CASCADE,
  problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_date, problem_id)
);

CREATE TABLE IF NOT EXISTS quotes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quote_text TEXT NOT NULL UNIQUE,
  author VARCHAR(255),
  category VARCHAR(50) NOT NULL DEFAULT 'original',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_quotes (
  quote_date DATE PRIMARY KEY,
  quote_id BIGINT NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_practice_activity_problems_problem ON practice_activity_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_daily_quotes_quote_id ON daily_quotes(quote_id);
