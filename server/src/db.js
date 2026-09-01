import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const requiredEnvironmentVariables = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER']
const missingVariables = requiredEnvironmentVariables.filter((name) => !process.env[name])

if (missingVariables.length > 0) {
  throw new Error(`Missing required database environment variables: ${missingVariables.join(', ')}`)
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error)
})

export async function getDatabaseTime() {
  const result = await pool.query('SELECT NOW() AS database_time')
  return result.rows[0].database_time
}

export default pool
