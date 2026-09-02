-- Migration from the original Step 3/4 schema to the canonical A2Z schema.
-- Run once against an existing development database before importing the 474 dataset.


CREATE TABLE IF NOT EXISTS dataset_metadata (
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

ALTER TABLE topics ADD COLUMN IF NOT EXISTS source_topic_id VARCHAR(50);
ALTER TABLE topics ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS source_subtopic_id VARCHAR(50);
ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS source_problem_id VARCHAR(50);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS pattern TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS gfg_url TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS article_url TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS time_complexity VARCHAR(255);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS space_complexity VARCHAR(255);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS brute_force TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS optimal_approach TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE problem_progress ADD COLUMN IF NOT EXISTS revision BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE problem_progress DROP CONSTRAINT IF EXISTS problem_progress_status_check;
ALTER TABLE problem_progress ADD CONSTRAINT problem_progress_status_check CHECK (status IN ('not_started', 'solved'));
UPDATE problem_progress SET revision = TRUE, status = 'not_started' WHERE status = 'revision';

ALTER TABLE topics ALTER COLUMN name TYPE VARCHAR(255);
ALTER TABLE subtopics ALTER COLUMN name TYPE VARCHAR(255);
ALTER TABLE problems ALTER COLUMN title TYPE VARCHAR(500);
ALTER TABLE problems ALTER COLUMN leetcode_url DROP NOT NULL;

ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_name_key;
ALTER TABLE problems DROP CONSTRAINT IF EXISTS problems_leetcode_url_key;

CREATE UNIQUE INDEX IF NOT EXISTS topics_source_topic_id_key ON topics (source_topic_id);
CREATE UNIQUE INDEX IF NOT EXISTS subtopics_source_subtopic_id_key ON subtopics (source_subtopic_id);
CREATE UNIQUE INDEX IF NOT EXISTS problems_source_problem_id_key ON problems (source_problem_id);

CREATE TABLE IF NOT EXISTS topic_prerequisites (
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  prerequisite_topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, prerequisite_topic_id),
  CONSTRAINT topic_prerequisites_no_self_reference CHECK (topic_id <> prerequisite_topic_id)
);

CREATE TABLE IF NOT EXISTS problem_prerequisites (
  problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  prerequisite_problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, prerequisite_problem_id),
  CONSTRAINT problem_prerequisites_no_self_reference CHECK (problem_id <> prerequisite_problem_id)
);

CREATE INDEX IF NOT EXISTS idx_subtopics_topic_id ON subtopics (topic_id);
CREATE INDEX IF NOT EXISTS idx_problems_subtopic_id ON problems (subtopic_id);
CREATE INDEX IF NOT EXISTS idx_topic_prerequisites_prerequisite ON topic_prerequisites (prerequisite_topic_id);
CREATE INDEX IF NOT EXISTS idx_problem_prerequisites_prerequisite ON problem_prerequisites (prerequisite_problem_id);

DROP TRIGGER IF EXISTS topics_set_updated_at ON topics;
CREATE TRIGGER topics_set_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS subtopics_set_updated_at ON subtopics;
CREATE TRIGGER subtopics_set_updated_at BEFORE UPDATE ON subtopics FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS problems_set_updated_at ON problems;
CREATE TRIGGER problems_set_updated_at BEFORE UPDATE ON problems FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS dataset_metadata_set_updated_at ON dataset_metadata;
CREATE TRIGGER dataset_metadata_set_updated_at BEFORE UPDATE ON dataset_metadata FOR EACH ROW EXECUTE FUNCTION set_updated_at();

