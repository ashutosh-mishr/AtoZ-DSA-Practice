-- DSA Practice Tracker PostgreSQL schema

CREATE TABLE topics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  order_number INTEGER NOT NULL CHECK (order_number >= 0),
  CONSTRAINT topics_order_number_key UNIQUE (order_number)
);

CREATE TABLE subtopics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  order_number INTEGER NOT NULL CHECK (order_number >= 0),
  CONSTRAINT subtopics_topic_name_key UNIQUE (topic_id, name),
  CONSTRAINT subtopics_topic_order_key UNIQUE (topic_id, order_number)
);

CREATE TABLE problems (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subtopic_id BIGINT NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  leetcode_url TEXT NOT NULL UNIQUE,
  order_number INTEGER NOT NULL CHECK (order_number >= 0),
  CONSTRAINT problems_subtopic_title_key UNIQUE (subtopic_id, title),
  CONSTRAINT problems_subtopic_order_key UNIQUE (subtopic_id, order_number)
);

CREATE TABLE problem_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  problem_id BIGINT NOT NULL UNIQUE REFERENCES problems(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'solved', 'revision')),
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

-- PostgreSQL does not update timestamp columns automatically; these triggers do.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER problem_progress_set_updated_at
BEFORE UPDATE ON problem_progress
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER notes_set_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_problems_difficulty ON problems (difficulty);
CREATE INDEX idx_problem_progress_status ON problem_progress (status);
