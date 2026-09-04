import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { scrypt, randomBytes } from 'node:crypto'
import pool from '../src/db.js'

const rl = readline.createInterface({ input, output })
const emailArg = process.argv[2]
const nameArg = process.argv[3]

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex')
    scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(`${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

try {
  const email = (emailArg || await rl.question('Admin email: ')).trim().toLowerCase()
  const name = (nameArg || await rl.question('Admin name: ')).trim()
  const password = await rl.question('Admin password (minimum 8 characters): ', { hideEchoBack: true })
  const confirm = await rl.question('Confirm password: ', { hideEchoBack: true })
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Please enter a valid email address.')
  if (password.length < 8) throw new Error('Password must be at least 8 characters.')
  if (password !== confirm) throw new Error('Passwords do not match.')
  const passwordHash = await hashPassword(password)
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, role = 'admin'
     RETURNING id, email, name, role`,
    [email, passwordHash, name],
  )
  console.log(`Admin ready: ${result.rows[0].email} (${result.rows[0].role})`)
} catch (error) {
  console.error(`Unable to create admin: ${error.message}`)
  process.exitCode = 1
} finally {
  rl.close()
  await pool.end()
}
