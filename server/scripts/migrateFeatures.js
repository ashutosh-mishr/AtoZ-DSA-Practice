import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pool from '../src/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const quotesPath = path.resolve(__dirname, '../../database/data/quotes.json')

const sql = `
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
`

const quotes = JSON.parse(await fs.readFile(quotesPath, 'utf8'))
const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query(sql)
  for (const quote of quotes) {
    await client.query(
      `INSERT INTO quotes (quote_text, author, category) VALUES ($1, $2, $3)
       ON CONFLICT (quote_text) DO UPDATE SET author = EXCLUDED.author, category = EXCLUDED.category, is_active = TRUE`,
      [quote.quote_text, quote.author || null, quote.category || 'original'],
    )
  }
  await client.query('COMMIT')
  const count = await pool.query('SELECT COUNT(*) AS count FROM quotes')
  console.log(`Feature migration complete: ${count.rows[0].count} quotes available.`)
} catch (error) {
  await client.query('ROLLBACK')
  console.error('Feature migration failed:', error)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
