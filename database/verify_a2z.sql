-- Run after `npm run import:a2z` to verify the canonical dataset.

SELECT 'topics' AS entity, COUNT(*) AS actual, 18 AS expected FROM topics
UNION ALL
SELECT 'subtopics', COUNT(*), 62 FROM subtopics
UNION ALL
SELECT 'problems', COUNT(*), 474 FROM problems
UNION ALL
SELECT 'problem_progress', COUNT(*), 0 FROM problem_progress
UNION ALL
SELECT 'notes', COUNT(*), 0 FROM notes
UNION ALL
SELECT 'bookmarks', COUNT(*), 0 FROM bookmarks
ORDER BY entity;

SELECT difficulty, COUNT(*)
FROM problems
GROUP BY difficulty
ORDER BY difficulty;

SELECT t.order_number, t.name, COUNT(p.id) AS problem_count
FROM topics t
LEFT JOIN subtopics s ON s.topic_id = t.id
LEFT JOIN problems p ON p.subtopic_id = s.id
GROUP BY t.id, t.order_number, t.name
ORDER BY t.order_number;

SELECT COUNT(*) AS problems_with_no_subtopic
FROM problems p
LEFT JOIN subtopics s ON s.id = p.subtopic_id
WHERE s.id IS NULL;

SELECT COUNT(*) AS duplicate_source_problem_ids
FROM (
  SELECT source_problem_id
  FROM problems
  GROUP BY source_problem_id
  HAVING COUNT(*) > 1
) duplicates;
