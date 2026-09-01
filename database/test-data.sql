-- Temporary Step 3 validation data. This is not the application problem dataset.

BEGIN;

INSERT INTO topics (name, description, order_number)
VALUES ('Test Arrays', 'Temporary schema validation topic.', 1)
ON CONFLICT (name) DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_number)
SELECT id, 'Test Fundamentals', 1
FROM topics
WHERE name = 'Test Arrays'
ON CONFLICT (topic_id, name) DO NOTHING;

INSERT INTO problems (subtopic_id, title, difficulty, leetcode_url, order_number)
SELECT id, 'Test Two Sum', 'easy', 'https://leetcode.com/problems/two-sum/', 1
FROM subtopics
WHERE name = 'Test Fundamentals'
ON CONFLICT (leetcode_url) DO NOTHING;

INSERT INTO problems (subtopic_id, title, difficulty, leetcode_url, order_number)
SELECT id, 'Test Contains Duplicate', 'easy', 'https://leetcode.com/problems/contains-duplicate/', 2
FROM subtopics
WHERE name = 'Test Fundamentals'
ON CONFLICT (leetcode_url) DO NOTHING;

INSERT INTO problem_progress (problem_id, status)
SELECT id, CASE title WHEN 'Test Two Sum' THEN 'solved' ELSE 'revision' END
FROM problems
WHERE title IN ('Test Two Sum', 'Test Contains Duplicate')
ON CONFLICT (problem_id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO notes (problem_id, content)
SELECT id, 'Temporary note: use a hash map to track complements.'
FROM problems
WHERE title = 'Test Two Sum'
ON CONFLICT (problem_id) DO UPDATE SET content = EXCLUDED.content;

INSERT INTO bookmarks (problem_id)
SELECT id
FROM problems
WHERE title = 'Test Contains Duplicate'
ON CONFLICT (problem_id) DO NOTHING;

COMMIT;
