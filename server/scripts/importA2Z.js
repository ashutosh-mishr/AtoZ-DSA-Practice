import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pool from '../src/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')
const datasetPath = path.join(projectRoot, 'database', 'data', 'a2z_canonical_474.json')
const migrationPath = path.join(projectRoot, 'database', 'migrate_legacy.sql')

const EXPECTED_TOPICS = 18
const EXPECTED_SUBTOPICS = 62
const EXPECTED_PROBLEMS = 474

function normalizeDifficulty(value) {
  const difficulty = String(value || '').trim().toLowerCase()
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error(`Invalid difficulty: ${value}`)
  }
  return difficulty
}

function nullableText(value) {
  if (value === undefined || value === null || value === '') return null
  return String(value)
}

function assertDataset(dataset) {
  if (!dataset || !Array.isArray(dataset.topics) || !Array.isArray(dataset.problems)) {
    throw new Error('Dataset must contain topics[] and problems[]')
  }

  const topicCount = dataset.topics.length
  const subtopicCount = dataset.topics.reduce((sum, topic) => sum + topic.subtopics.length, 0)
  const problemCount = dataset.problems.length

  if (topicCount !== EXPECTED_TOPICS || subtopicCount !== EXPECTED_SUBTOPICS || problemCount !== EXPECTED_PROBLEMS) {
    throw new Error(`Unexpected dataset size: topics=${topicCount}, subtopics=${subtopicCount}, problems=${problemCount}`)
  }

  const topicIds = new Set()
  const subtopicIds = new Set()
  const problemIds = new Set()
  const problemIdsInHierarchy = new Set()

  for (const topic of dataset.topics) {
    if (topicIds.has(topic.topic_id)) throw new Error(`Duplicate topic_id: ${topic.topic_id}`)
    topicIds.add(topic.topic_id)
    for (const subtopic of topic.subtopics) {
      if (subtopicIds.has(subtopic.subtopic_id)) throw new Error(`Duplicate subtopic_id: ${subtopic.subtopic_id}`)
      subtopicIds.add(subtopic.subtopic_id)
      for (const problemId of subtopic.problem_ids) {
        if (problemIdsInHierarchy.has(problemId)) throw new Error(`Problem appears twice in hierarchy: ${problemId}`)
        problemIdsInHierarchy.add(problemId)
      }
    }
  }

  for (const problem of dataset.problems) {
    if (problemIds.has(problem.problem_id)) throw new Error(`Duplicate problem_id: ${problem.problem_id}`)
    problemIds.add(problem.problem_id)
    normalizeDifficulty(problem.difficulty)
    if (!problem.topic_id || !problem.subtopic_id) throw new Error(`Missing hierarchy for ${problem.problem_id}`)
  }

  if (problemIds.size !== problemIdsInHierarchy.size) {
    throw new Error(`Hierarchy problem count mismatch: hierarchy=${problemIdsInHierarchy.size}, flat=${problemIds.size}`)
  }

  for (const id of problemIds) {
    if (!problemIdsInHierarchy.has(id)) throw new Error(`Problem missing from hierarchy: ${id}`)
  }
}

async function runSqlFile(client, filePath) {
  const sql = await fs.readFile(filePath, 'utf8')
  await client.query(sql)
}

async function ensureSchema(client) {
  // The migration is safe to rerun and upgrades the original project schema.
  await runSqlFile(client, migrationPath)
}

async function importDataset() {
  const dataset = JSON.parse(await fs.readFile(datasetPath, 'utf8'))
  assertDataset(dataset)

  const client = await pool.connect()
  try {
    await ensureSchema(client)
    await client.query('BEGIN')

    // Remove only legacy rows created before source IDs existed. Canonical rows
    // and their practice state are preserved on subsequent imports.
    await client.query('DELETE FROM problems WHERE source_problem_id IS NULL')
    await client.query('DELETE FROM subtopics WHERE source_subtopic_id IS NULL')
    await client.query('DELETE FROM topics WHERE source_topic_id IS NULL')

    // Avoid transient unique-order conflicts when an existing canonical row moves.
    await client.query('UPDATE topics SET order_number = order_number + 1000000')
    await client.query('UPDATE subtopics SET order_number = order_number + 1000000')
    await client.query('UPDATE problems SET order_number = order_number + 1000000')

    await client.query('ALTER TABLE topics ALTER COLUMN source_topic_id SET NOT NULL')
    await client.query('ALTER TABLE subtopics ALTER COLUMN source_subtopic_id SET NOT NULL')
    await client.query('ALTER TABLE problems ALTER COLUMN source_problem_id SET NOT NULL')

    const topicDbIds = new Map()
    const subtopicDbIds = new Map()

    for (const topic of dataset.topics) {
      const result = await client.query(
        `INSERT INTO topics (source_topic_id, name, description, order_number)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (source_topic_id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           order_number = EXCLUDED.order_number
         RETURNING id`,
        [topic.topic_id, topic.topic_name, '', topic.order],
      )
      topicDbIds.set(topic.topic_id, result.rows[0].id)
    }

    for (const topic of dataset.topics) {
      const topicDbId = topicDbIds.get(topic.topic_id)
      for (const subtopic of topic.subtopics) {
        const result = await client.query(
          `INSERT INTO subtopics (topic_id, source_subtopic_id, name, order_number)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (source_subtopic_id) DO UPDATE SET
             topic_id = EXCLUDED.topic_id,
             name = EXCLUDED.name,
             order_number = EXCLUDED.order_number
           RETURNING id`,
          [topicDbId, subtopic.subtopic_id, subtopic.subtopic_name, subtopic.order],
        )
        subtopicDbIds.set(subtopic.subtopic_id, result.rows[0].id)
      }
    }

    for (const problem of dataset.problems) {
      const subtopicDbId = subtopicDbIds.get(problem.subtopic_id)
      if (!subtopicDbId) throw new Error(`Unknown subtopic ${problem.subtopic_id} for ${problem.problem_id}`)

      await client.query(
        `INSERT INTO problems (
           subtopic_id, source_problem_id, title, difficulty, pattern,
           leetcode_url, gfg_url, youtube_url, article_url,
           time_complexity, space_complexity, brute_force, optimal_approach,
           order_number
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (source_problem_id) DO UPDATE SET
           subtopic_id = EXCLUDED.subtopic_id,
           title = EXCLUDED.title,
           difficulty = EXCLUDED.difficulty,
           pattern = EXCLUDED.pattern,
           leetcode_url = EXCLUDED.leetcode_url,
           gfg_url = EXCLUDED.gfg_url,
           youtube_url = EXCLUDED.youtube_url,
           article_url = EXCLUDED.article_url,
           time_complexity = EXCLUDED.time_complexity,
           space_complexity = EXCLUDED.space_complexity,
           brute_force = EXCLUDED.brute_force,
           optimal_approach = EXCLUDED.optimal_approach,
           order_number = EXCLUDED.order_number`,
        [
          subtopicDbId,
          problem.source_problem_id,
          problem.problem_name,
          normalizeDifficulty(problem.difficulty),
          nullableText(problem.pattern),
          nullableText(problem.leetcode_link),
          nullableText(problem.gfg_link),
          nullableText(problem.youtube_link),
          nullableText(problem.article_link),
          nullableText(problem.time_complexity),
          nullableText(problem.space_complexity),
          nullableText(problem.brute_force),
          nullableText(problem.optimal_approach),
          problem.order_in_subtopic,
        ],
      )
    }

    // Canonical source is authoritative for the imported A2Z rows. Remove
    // obsolete canonical rows only when their source IDs are no longer present.
    await client.query(
      `DELETE FROM problems WHERE source_problem_id <> ALL($1::text[])`,
      [[...new Set(dataset.problems.map((p) => p.source_problem_id))]],
    )

    // Rebuild prerequisite relations from the canonical dataset. The current
    // 474 dataset has no reliable prerequisite mappings for all 474 rows, so
    // this remains empty unless the source provides them.
    await client.query('DELETE FROM problem_prerequisites')
    const problemDbIds = new Map()
    const problemRows = await client.query('SELECT id, source_problem_id FROM problems')
    for (const row of problemRows.rows) problemDbIds.set(row.source_problem_id, row.id)
    const canonicalProblemDbIds = new Map()
    for (const problem of dataset.problems) {
      const dbId = problemDbIds.get(problem.source_problem_id)
      if (!dbId) throw new Error(`Imported problem not found after upsert: ${problem.problem_id}`)
      canonicalProblemDbIds.set(problem.problem_id, dbId)
    }

    for (const problem of dataset.problems) {
      for (const prerequisite of problem.prerequisites || []) {
        const prerequisiteId = canonicalProblemDbIds.get(prerequisite)
        const problemId = canonicalProblemDbIds.get(problem.problem_id)
        if (!prerequisiteId || !problemId) throw new Error(`Unknown prerequisite for ${problem.problem_id}: ${prerequisite}`)
        await client.query(
          `INSERT INTO problem_prerequisites (problem_id, prerequisite_problem_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [problemId, prerequisiteId],
        )
      }
    }

    await client.query('DELETE FROM topic_prerequisites')

    await client.query(
      `INSERT INTO dataset_metadata
        (dataset_key, title, description, source, source_last_updated, total_topics, total_subtopics, total_problems, author)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (dataset_key) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         source = EXCLUDED.source,
         source_last_updated = EXCLUDED.source_last_updated,
         total_topics = EXCLUDED.total_topics,
         total_subtopics = EXCLUDED.total_subtopics,
         total_problems = EXCLUDED.total_problems,
         author = EXCLUDED.author`,
      [
        'striver-a2z-474',
        dataset.metadata.title,
        dataset.metadata.description,
        dataset.metadata.source,
        'Repository canonical dataset',
        dataset.metadata.total_topics,
        dataset.metadata.total_subtopics,
        dataset.metadata.total_problems,
        'Raj Vikramaditya (Striver)',
      ],
    )

    await client.query('COMMIT')

    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM topics) AS topics,
        (SELECT COUNT(*) FROM subtopics) AS subtopics,
        (SELECT COUNT(*) FROM problems) AS problems,
        (SELECT COUNT(*) FROM problem_progress) AS progress_rows,
        (SELECT COUNT(*) FROM notes) AS notes,
        (SELECT COUNT(*) FROM bookmarks) AS bookmarks
    `)
    console.log('A2Z import complete:', counts.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

importDataset()
  .catch((error) => {
    console.error('A2Z import failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
