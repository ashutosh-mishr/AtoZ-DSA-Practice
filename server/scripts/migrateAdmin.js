import pool from '../src/db.js'

try {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_active ON users(active)`)
  console.log('Admin account management migration complete.')
} catch (error) {
  console.error('Admin migration failed:', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
