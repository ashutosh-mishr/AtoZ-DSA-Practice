-- Per-user ownership migration for tracker data.
-- Run once after migrate_auth.sql.
-- Existing tracker data is assigned to the existing admin account (the oldest admin).
-- This preserves the current single-user history while making future accounts isolated.

DO $$
DECLARE
  legacy_user_id BIGINT;
  has_tracker_data BOOLEAN;
BEGIN
  SELECT id INTO legacy_user_id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1;
  SELECT EXISTS (
    SELECT 1 FROM problem_progress
    UNION ALL SELECT 1 FROM notes
    UNION ALL SELECT 1 FROM bookmarks
    UNION ALL SELECT 1 FROM practice_activity
  ) INTO has_tracker_data;
  IF has_tracker_data AND legacy_user_id IS NULL THEN
    RAISE EXCEPTION 'Cannot migrate tracker data: no admin user exists. Create the admin account first.';
  END IF;
END $$;

ALTER TABLE problem_progress ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE practice_activity ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE practice_activity_problems ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;

DO $$
DECLARE legacy_user_id BIGINT;
BEGIN
  SELECT id INTO legacy_user_id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1;
  IF legacy_user_id IS NOT NULL THEN
    UPDATE problem_progress SET user_id = legacy_user_id WHERE user_id IS NULL;
    UPDATE notes SET user_id = legacy_user_id WHERE user_id IS NULL;
    UPDATE bookmarks SET user_id = legacy_user_id WHERE user_id IS NULL;
    UPDATE practice_activity SET user_id = legacy_user_id WHERE user_id IS NULL;
    UPDATE practice_activity_problems pap
    SET user_id = pa.user_id
    FROM practice_activity pa
    WHERE pap.activity_date = pa.activity_date AND pap.user_id IS NULL;
  END IF;
END $$;

ALTER TABLE problem_progress ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE notes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE bookmarks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE practice_activity ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE practice_activity_problems ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE problem_progress DROP CONSTRAINT IF EXISTS problem_progress_problem_id_key;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_problem_id_key;
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_problem_id_key;
ALTER TABLE practice_activity_problems DROP CONSTRAINT IF EXISTS practice_activity_problems_activity_date_fkey;
ALTER TABLE practice_activity DROP CONSTRAINT IF EXISTS practice_activity_pkey;
ALTER TABLE practice_activity_problems DROP CONSTRAINT IF EXISTS practice_activity_problems_pkey;

ALTER TABLE problem_progress ADD CONSTRAINT problem_progress_user_problem_key UNIQUE (user_id, problem_id);
ALTER TABLE notes ADD CONSTRAINT notes_user_problem_key UNIQUE (user_id, problem_id);
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_problem_key UNIQUE (user_id, problem_id);
ALTER TABLE practice_activity ADD CONSTRAINT practice_activity_user_date_key UNIQUE (user_id, activity_date);
ALTER TABLE practice_activity ADD CONSTRAINT practice_activity_pkey PRIMARY KEY (user_id, activity_date);
ALTER TABLE practice_activity_problems ADD CONSTRAINT practice_activity_problems_pkey PRIMARY KEY (user_id, activity_date, problem_id);
ALTER TABLE practice_activity_problems
  ADD CONSTRAINT practice_activity_problems_activity_fk
  FOREIGN KEY (user_id, activity_date) REFERENCES practice_activity(user_id, activity_date) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_problem_progress_user_id ON problem_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_activity_user_id ON practice_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_activity_problems_user_id ON practice_activity_problems(user_id);
