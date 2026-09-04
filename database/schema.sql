-- A2Z DSA Practice Tracker PostgreSQL schema
-- Canonical dataset: 18 topics, 62 subtopics, 474 problems.

CREATE TABLE dataset_metadata (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dataset_key VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source TEXT,
  source_last_updated VARCHAR(100),
  total_topics INTEGER NOT NULL CHECK (total_topics >= 0),
  total_subtopics INTEGER NOT NULL CHECK (total_subtopics >= 0),
  total_problems INTEGER NOT NULL CHECK (total_problems >= 0),
  author VARCHAR(255),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE topics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_topic_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  order_number INTEGER NOT NULL CHECK (order_number >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT topics_order_number_key UNIQUE (order_number)
);

CREATE TABLE subtopics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  source_subtopic_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  order_number INTEGER NOT NULL CHECK (order_number >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subtopics_topic_name_key UNIQUE (topic_id, name),
  CONSTRAINT subtopics_topic_order_key UNIQUE (topic_id, order_number)
);

CREATE TABLE problems (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subtopic_id BIGINT NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
  source_problem_id VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  pattern TEXT,
  leetcode_url TEXT,
  gfg_url TEXT,
  youtube_url TEXT,
  article_url TEXT,
  time_complexity VARCHAR(255),
  space_complexity VARCHAR(255),
  brute_force TEXT,
  optimal_approach TEXT,
  order_number INTEGER NOT NULL CHECK (order_number >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT problems_subtopic_title_key UNIQUE (subtopic_id, title),
  CONSTRAINT problems_subtopic_order_key UNIQUE (subtopic_id, order_number)
);

CREATE TABLE topic_prerequisites (
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  prerequisite_topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, prerequisite_topic_id),
  CONSTRAINT topic_prerequisites_no_self_reference CHECK (topic_id <> prerequisite_topic_id)
);

CREATE TABLE problem_prerequisites (
  problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  prerequisite_problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, prerequisite_problem_id),
  CONSTRAINT problem_prerequisites_no_self_reference CHECK (problem_id <> prerequisite_problem_id)
);

CREATE TABLE problem_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  problem_id BIGINT NOT NULL UNIQUE REFERENCES problems(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'solved')),
  revision BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  problem_id BIGINT NOT NULL UNIQUE REFERENCES problems(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookmarks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  problem_id BIGINT NOT NULL UNIQUE REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dataset_metadata_set_updated_at
BEFORE UPDATE ON dataset_metadata
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER topics_set_updated_at
BEFORE UPDATE ON topics
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER subtopics_set_updated_at
BEFORE UPDATE ON subtopics
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER problems_set_updated_at
BEFORE UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER problem_progress_set_updated_at
BEFORE UPDATE ON problem_progress
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER notes_set_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_subtopics_topic_id ON subtopics (topic_id);
CREATE INDEX idx_problems_subtopic_id ON problems (subtopic_id);
CREATE INDEX idx_problems_difficulty ON problems (difficulty);
CREATE INDEX idx_problem_progress_status ON problem_progress (status);
CREATE INDEX idx_topic_prerequisites_prerequisite ON topic_prerequisites (prerequisite_topic_id);
CREATE INDEX idx_problem_prerequisites_prerequisite ON problem_prerequisites (prerequisite_problem_id);

CREATE TABLE practice_activity (
  activity_date DATE PRIMARY KEY,
  problems_solved INTEGER NOT NULL DEFAULT 0 CHECK (problems_solved >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE practice_activity_problems (
  activity_date DATE NOT NULL REFERENCES practice_activity(activity_date) ON DELETE CASCADE,
  problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_date, problem_id)
);

CREATE TABLE quotes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quote_text TEXT NOT NULL UNIQUE,
  author VARCHAR(255),
  category VARCHAR(50) NOT NULL DEFAULT 'original',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_quotes (
  quote_date DATE PRIMARY KEY,
  quote_id BIGINT NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_practice_activity_problems_problem ON practice_activity_problems(problem_id);
CREATE INDEX idx_daily_quotes_quote_id ON daily_quotes(quote_id);


CREATE TABLE problem_solutions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  problem_id BIGINT NOT NULL UNIQUE REFERENCES problems(id) ON DELETE CASCADE,
  problem_statement TEXT NOT NULL DEFAULT '',
  examples TEXT NOT NULL DEFAULT '',
  brute_force TEXT NOT NULL DEFAULT '',
  better_approach TEXT NOT NULL DEFAULT '',
  optimal_approach TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  code_language VARCHAR(50) NOT NULL DEFAULT 'C++',
  video_url TEXT,
  source_repository TEXT,
  source_file TEXT,
  mapping_confidence NUMERIC(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_problem_solutions_problem ON problem_solutions (problem_id);

-- Authentication tables and user ownership columns.
CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
