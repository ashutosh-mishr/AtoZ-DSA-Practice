-- Temporary schema validation data. Do not run this after importing the canonical A2Z dataset.
-- Use the A2Z importer for real application data.

BEGIN;

INSERT INTO topics (source_topic_id, name, description, order_number)
VALUES ('TEST-T01', 'Test Arrays', 'Temporary schema validation topic.', 999)
ON CONFLICT (source_topic_id) DO NOTHING;

INSERT INTO subtopics (topic_id, source_subtopic_id, name, order_number)
SELECT id, 'TEST-T01-S01', 'Test Fundamentals', 999
FROM topics
WHERE source_topic_id = 'TEST-T01'
ON CONFLICT (source_subtopic_id) DO NOTHING;

INSERT INTO problems (subtopic_id, source_problem_id, title, difficulty, leetcode_url, order_number)
SELECT id, 'TEST-P001', 'Test Two Sum', 'easy', 'https://leetcode.com/problems/two-sum/', 999
FROM subtopics
WHERE source_subtopic_id = 'TEST-T01-S01'
ON CONFLICT (source_problem_id) DO NOTHING;

INSERT INTO problems (subtopic_id, source_problem_id, title, difficulty, leetcode_url, order_number)
SELECT id, 'TEST-P002', 'Test Contains Duplicate', 'easy', 'https://leetcode.com/problems/contains-duplicate/', 1000
FROM subtopics
WHERE source_subtopic_id = 'TEST-T01-S01'
ON CONFLICT (source_problem_id) DO NOTHING;

INSERT INTO problem_progress (problem_id, status)
SELECT id, CASE title WHEN 'Test Two Sum' THEN 'solved' ELSE 'revision' END
FROM problems
WHERE source_problem_id IN ('TEST-P001', 'TEST-P002')
ON CONFLICT (problem_id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO notes (problem_id, content)
SELECT id, 'Temporary note: use a hash map to track complements.'
FROM problems
WHERE source_problem_id = 'TEST-P001'
ON CONFLICT (problem_id) DO UPDATE SET content = EXCLUDED.content;

INSERT INTO bookmarks (problem_id)
SELECT id
FROM problems
WHERE source_problem_id = 'TEST-P002'
ON CONFLICT (problem_id) DO NOTHING;

COMMIT;
