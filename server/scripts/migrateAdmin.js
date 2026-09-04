import pool from '../src/db.js'

try {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_active ON users(active)`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_message VARCHAR(255) NOT NULL DEFAULT 'Welcome back'`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_primary_admin BOOLEAN NOT NULL DEFAULT FALSE`)
  await pool.query(`UPDATE users SET is_primary_admin = FALSE`)
  await pool.query(`UPDATE users SET is_primary_admin = TRUE WHERE id = (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC, id ASC LIMIT 1)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_primary_admin ON users(is_primary_admin) WHERE is_primary_admin = TRUE`)
  console.log('Admin account management migration complete.')
} catch (error) {
  console.error('Admin migration failed:', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
