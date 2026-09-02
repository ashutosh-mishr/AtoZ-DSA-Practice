import fs from 'node:fs/promises'
import path from 'node:path'
import pool from '../src/db.js'

const dataPath = path.resolve(process.cwd(), '../database/data/solutions.json')
const migrationPath = path.resolve(process.cwd(), '../database/migrate_solutions.sql')
const data = JSON.parse(await fs.readFile(dataPath, 'utf8'))
const migration = await fs.readFile(migrationPath, 'utf8')

await pool.query(migration)
const client = await pool.connect()
try {
  await client.query('BEGIN')
  let imported = 0
  for (const solution of data.solutions) {
    const problem = await client.query('SELECT p.id FROM problems p JOIN subtopics s ON s.id = p.subtopic_id JOIN topics t ON t.id = s.topic_id WHERE p.title = $1 AND t.name = $2 AND s.name = $3 LIMIT 1', [solution.problem_title, solution.topic_name, solution.subtopic_name])
    const byInternal = await client.query('SELECT id FROM problems WHERE source_problem_id = $1 LIMIT 1', [solution.source_problem_id])
    const row = byInternal.rows[0] || problem.rows[0]
    if (!row) continue
    await client.query(`
      INSERT INTO problem_solutions (problem_id, problem_statement, examples, brute_force, better_approach, optimal_approach, code, code_language, video_url, source_repository, source_file, mapping_confidence)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (problem_id) DO UPDATE SET
        problem_statement = EXCLUDED.problem_statement, examples = EXCLUDED.examples, brute_force = EXCLUDED.brute_force,
        better_approach = EXCLUDED.better_approach, optimal_approach = EXCLUDED.optimal_approach, code = EXCLUDED.code,
        code_language = EXCLUDED.code_language, video_url = EXCLUDED.video_url, source_repository = EXCLUDED.source_repository,
        source_file = EXCLUDED.source_file, mapping_confidence = EXCLUDED.mapping_confidence, updated_at = CURRENT_TIMESTAMP`,
      [row.id, solution.problem_statement || '', solution.examples || '', '', '', solution.optimal_approach || '', solution.code || '', solution.code_language || 'C++', null, data.source_repository || null, solution.source_file || null, solution.mapping_confidence ?? null],
    )
    imported += 1
  }
  await client.query('COMMIT')
  console.log(`Solution import complete: ${imported} solutions`)
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
  await pool.end()
}
