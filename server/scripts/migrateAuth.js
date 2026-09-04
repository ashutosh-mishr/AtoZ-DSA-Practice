import fs from 'node:fs/promises'
import pool from '../src/db.js'

try {
  const sql = await fs.readFile(new URL('../../database/migrate_auth.sql', import.meta.url), 'utf8')
  await pool.query(sql)
  console.log('Authentication migration complete.')
} catch (error) {
  console.error(`Authentication migration failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
