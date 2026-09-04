import express from 'express'
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import pool, { getDatabaseTime } from './db.js'

const app = express()
const port = process.env.PORT || 3000
const allowedOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])
const validStatuses = new Set(['not_started', 'solved'])
const validDifficulties = new Set(['easy', 'medium', 'hard'])
const scrypt = promisify(scryptCallback)
const sessionCookieName = 'dsa_session'
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000

app.use((request, response, next) => {
  const origin = request.headers.origin

  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    response.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  if (request.method === 'OPTIONS') {
    response.sendStatus(204)
    return
  }

  next()
})

app.use(express.json())

const asyncHandler = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next)
}

function sendError(response, status, error, message) {
  response.status(status).json({ error, message })
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf('=')
    return index === -1 ? [part, ''] : [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))]
  }))
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

async function verifyPassword(password, storedHash) {
  const [salt, keyHex] = String(storedHash || '').split(':')
  if (!salt || !keyHex) return false
  const expected = Buffer.from(keyHex, 'hex')
  const actual = await scrypt(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function setSessionCookie(response, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader('Set-Cookie', `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${Math.floor(sessionDurationMs / 1000)}; SameSite=Lax${secure}`)
}

function clearSessionCookie(response) {
  response.setHeader('Set-Cookie', `${sessionCookieName}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`)
}

async function createSession(userId) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + sessionDurationMs)
  await pool.query('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP')
  await pool.query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [userId, hashSessionToken(token), expiresAt])
  return token
}

function publicUser(row) {
  return { id: Number(row.id), email: row.email, name: row.name, role: row.role, welcome_message: row.welcome_message || 'Welcome back', is_primary_admin: Boolean(row.is_primary_admin) }
}

const requireAuth = asyncHandler(async (request, response, next) => {
  const token = parseCookies(request.headers.cookie || '')[sessionCookieName]
  if (!token) return sendError(response, 401, 'unauthorized', 'Please log in to continue.')
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.role, u.active, u.welcome_message, u.is_primary_admin
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
    [hashSessionToken(token)],
  )
  if (!result.rowCount) {
    clearSessionCookie(response)
    return sendError(response, 401, 'unauthorized', 'Your session has expired. Please log in again.')
  }
  if (!result.rows[0].active) {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashSessionToken(token)])
    clearSessionCookie(response)
    return sendError(response, 403, 'account_disabled', 'Your account has been disabled. Please contact an administrator.')
  }
  request.user = publicUser(result.rows[0])
  next()
})

const requireAdmin = (request, response, next) => {
  if (request.user?.role !== 'admin') return sendError(response, 403, 'forbidden', 'Administrator access is required.')
  next()
}

function parsePositiveId(value) {
  if (!/^\d+$/.test(String(value))) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function getIdOrSendBadRequest(request, response) {
  const id = parsePositiveId(request.params.id)
  if (!id) {
    sendError(response, 400, 'invalid_input', 'Problem or topic ID must be a positive integer.')
    return null
  }
  return id
}

async function requireProblem(problemId, response) {
  const result = await pool.query('SELECT 1 FROM problems WHERE id = $1', [problemId])
  if (result.rowCount > 0) return true
  sendError(response, 404, 'not_found', 'Problem not found.')
  return false
}

function mapProblem(row) {
  return {
    id: Number(row.id),
    source_problem_id: row.source_problem_id,
    title: row.title,
    difficulty: row.difficulty,
    pattern: row.pattern,
    leetcode_url: row.leetcode_url,
    gfg_url: row.gfg_url,
    youtube_url: row.youtube_url,
    article_url: row.article_url,
    time_complexity: row.time_complexity,
    space_complexity: row.space_complexity,
    brute_force: row.brute_force,
    optimal_approach: row.optimal_approach,
    bookmarked: Boolean(row.bookmarked),
    revision: Boolean(row.revision),
    order_number: row.order_number === undefined || row.order_number === null ? undefined : Number(row.order_number),
    topic: { id: Number(row.topic_id), name: row.topic },
    subtopic: { id: Number(row.subtopic_id), name: row.subtopic },
    status: row.status,
    has_solution: Boolean(row.has_solution),
  }
}

const healthCheck = (_request, response) => {
  response.status(200).json({ status: 'ok', service: 'dsa-practice-tracker-api' })
}

app.get('/health', healthCheck)
app.get('/api/health', healthCheck)


app.post('/api/auth/register', asyncHandler(async (request, response) => {
  const name = typeof request.body?.name === 'string' ? request.body.name.trim() : ''
  const email = normalizeEmail(request.body?.email)
  const password = request.body?.password
  if (!name) return sendError(response, 400, 'invalid_input', 'Name is required.')
  if (!/^\S+@\S+\.\S+$/.test(email)) return sendError(response, 400, 'invalid_input', 'Please enter a valid email address.')
  if (typeof password !== 'string' || password.length < 8) return sendError(response, 400, 'invalid_input', 'Password must be at least 8 characters.')
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rowCount) return sendError(response, 409, 'email_exists', 'An account with this email already exists.')
  const passwordHash = await hashPassword(password)
  const result = await pool.query("INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'user') RETURNING id, email, name, role", [email, passwordHash, name])
  const token = await createSession(result.rows[0].id)
  setSessionCookie(response, token)
  response.status(201).json({ user: publicUser(result.rows[0]) })
}))

app.post('/api/auth/login', asyncHandler(async (request, response) => {
  const email = normalizeEmail(request.body?.email)
  const password = request.body?.password
  if (!/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string') return sendError(response, 400, 'invalid_input', 'Email and password are required.')
  const result = await pool.query('SELECT id, email, name, role, password_hash, active FROM users WHERE email = $1', [email])
  if (!result.rowCount || !(await verifyPassword(password, result.rows[0].password_hash))) return sendError(response, 401, 'invalid_credentials', 'Invalid email or password.')
  if (!result.rows[0].active) return sendError(response, 403, 'account_disabled', 'Your account has been disabled. Please contact an administrator.')
  const token = await createSession(result.rows[0].id)
  setSessionCookie(response, token)
  response.json({ user: publicUser(result.rows[0]) })
}))

app.get('/api/auth/me', asyncHandler(async (request, response) => {
  const token = parseCookies(request.headers.cookie || '')[sessionCookieName]
  if (!token) return response.json({ user: null })
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.role, u.active, u.welcome_message, u.is_primary_admin FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
    [hashSessionToken(token)],
  )
  if (!result.rowCount) { clearSessionCookie(response); return response.json({ user: null }) }
  if (!result.rows[0].active) { await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashSessionToken(token)]); clearSessionCookie(response); return response.json({ user: null }) }
  response.json({ user: publicUser(result.rows[0]) })
}))

app.post('/api/auth/logout', asyncHandler(async (request, response) => {
  const token = parseCookies(request.headers.cookie || '')[sessionCookieName]
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashSessionToken(token)])
  clearSessionCookie(response)
  response.status(204).end()
}))

app.get('/api/db/health', async (_request, response) => {
  try {
    const databaseTime = await getDatabaseTime()
    response.status(200).json({ status: 'ok', service: 'dsa-practice-tracker-api', database: 'connected', databaseTime })
  } catch (error) {
    console.error('Database health check failed:', error)
    response.status(503).json({ status: 'error', service: 'dsa-practice-tracker-api', database: 'unavailable' })
  }
})

app.use('/api', requireAuth)

app.get('/api/profile', asyncHandler(async (request, response) => {
  const result = await pool.query('SELECT id, email, name, role, welcome_message, is_primary_admin FROM users WHERE id = $1', [request.user.id])
  if (!result.rowCount) return sendError(response, 404, 'not_found', 'User profile not found.')
  response.json(publicUser(result.rows[0]))
}))

app.patch('/api/profile', asyncHandler(async (request, response) => {
  const name = typeof request.body?.name === 'string' ? request.body.name.trim() : null
  const welcomeMessage = typeof request.body?.welcome_message === 'string' ? request.body.welcome_message.trim() : null
  if (name === null && welcomeMessage === null) return sendError(response, 400, 'invalid_input', 'Provide a name or welcome_message to update.')
  if (name !== null && !name) return sendError(response, 400, 'invalid_input', 'Name is required.')
  if (name !== null && name.length > 100) return sendError(response, 400, 'invalid_input', 'Name must be 100 characters or fewer.')
  if (welcomeMessage !== null && welcomeMessage.length > 255) return sendError(response, 400, 'invalid_input', 'Welcome message must be 255 characters or fewer.')
  const result = await pool.query(
    `UPDATE users SET name = COALESCE($1, name), welcome_message = COALESCE($2, welcome_message), updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING id, email, name, role, welcome_message, is_primary_admin`,
    [name, welcomeMessage === null ? null : (welcomeMessage || 'Welcome back'), request.user.id],
  )
  response.json(publicUser(result.rows[0]))
}))

app.patch('/api/profile/password', asyncHandler(async (request, response) => {
  const currentPassword = request.body?.current_password
  const newPassword = request.body?.new_password
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') return sendError(response, 400, 'invalid_input', 'Current and new passwords are required.')
  if (newPassword.length < 8) return sendError(response, 400, 'invalid_input', 'New password must be at least 8 characters.')
  if (currentPassword === newPassword) return sendError(response, 400, 'invalid_input', 'New password must be different from the current password.')
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [request.user.id])
  if (!result.rowCount || !(await verifyPassword(currentPassword, result.rows[0].password_hash))) return sendError(response, 401, 'invalid_credentials', 'Current password is incorrect.')
  const passwordHash = await hashPassword(newPassword)
  const token = parseCookies(request.headers.cookie || '')[sessionCookieName]
  await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, request.user.id])
  if (token) await pool.query('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2', [request.user.id, hashSessionToken(token)])
  response.json({ success: true })
}))

app.get('/api/admin/users', requireAdmin, asyncHandler(async (_request, response) => {
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.role, u.active, u.is_primary_admin, u.created_at,
            COUNT(DISTINCT pp.problem_id) FILTER (WHERE pp.status = 'solved')::INTEGER AS solved_count,
            COUNT(DISTINCT pp.problem_id) FILTER (WHERE pp.revision = TRUE)::INTEGER AS revision_count,
            COUNT(DISTINCT b.problem_id)::INTEGER AS bookmark_count,
            COUNT(DISTINCT n.problem_id)::INTEGER AS note_count,
            COUNT(DISTINCT pa.activity_date)::INTEGER AS active_days,
            MAX(pa.activity_date) AS last_active_date
     FROM users u
     LEFT JOIN problem_progress pp ON pp.user_id = u.id
     LEFT JOIN bookmarks b ON b.user_id = u.id
     LEFT JOIN notes n ON n.user_id = u.id
     LEFT JOIN practice_activity pa ON pa.user_id = u.id
     GROUP BY u.id
     ORDER BY CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END, u.created_at ASC`,
  )
  response.json(result.rows.map((row) => ({
    id: Number(row.id),
    email: row.email,
    name: row.name,
    role: row.role,
    active: Boolean(row.active),
    is_primary_admin: Boolean(row.is_primary_admin),
    created_at: row.created_at,
    solved_count: Number(row.solved_count),
    revision_count: Number(row.revision_count),
    bookmark_count: Number(row.bookmark_count),
    note_count: Number(row.note_count),
    active_days: Number(row.active_days),
    last_active_date: row.last_active_date,
  })))
}))

app.patch('/api/admin/users/:id/role', requireAdmin, asyncHandler(async (request, response) => {
  const userId = parsePositiveId(request.params.id)
  if (!userId) return sendError(response, 400, 'invalid_input', 'User ID must be a positive integer.')
  const { role } = request.body || {}
  if (!['user', 'admin'].includes(role)) return sendError(response, 400, 'invalid_input', 'role must be user or admin.')
  const target = await pool.query('SELECT id, email, name, role, active, is_primary_admin FROM users WHERE id = $1', [userId])
  if (!target.rowCount) return sendError(response, 404, 'not_found', 'User not found.')
  if (target.rows[0].is_primary_admin && role !== 'admin') return sendError(response, 400, 'protected_admin', 'The primary administrator cannot be demoted.')
  if (userId === request.user.id && role !== 'admin') return sendError(response, 400, 'invalid_input', 'You cannot demote your own account.')
  if (target.rows[0].role === role) return response.json({ id: userId, email: target.rows[0].email, name: target.rows[0].name, role, active: Boolean(target.rows[0].active), is_primary_admin: Boolean(target.rows[0].is_primary_admin) })
  if (target.rows[0].role === 'admin' && role === 'user') {
    const adminCount = await pool.query("SELECT COUNT(*)::INTEGER AS count FROM users WHERE role = 'admin' AND active = TRUE AND id <> $1", [userId])
    if (Number(adminCount.rows[0].count) < 1) return sendError(response, 400, 'last_admin', 'At least one active administrator must remain.')
  }
  const result = await pool.query('UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, role, active, is_primary_admin', [role, userId])
  response.json({ id: Number(result.rows[0].id), email: result.rows[0].email, name: result.rows[0].name, role: result.rows[0].role, active: Boolean(result.rows[0].active), is_primary_admin: Boolean(result.rows[0].is_primary_admin) })
}))

app.patch('/api/admin/users/:id/status', requireAdmin, asyncHandler(async (request, response) => {
  const userId = parsePositiveId(request.params.id)
  if (!userId) return sendError(response, 400, 'invalid_input', 'User ID must be a positive integer.')
  if (userId === request.user.id) return sendError(response, 400, 'invalid_input', 'You cannot disable your own account.')
  const { active } = request.body || {}
  if (typeof active !== 'boolean') return sendError(response, 400, 'invalid_input', 'active must be a boolean.')
  const target = await pool.query('SELECT id, email, name, role, active, is_primary_admin FROM users WHERE id = $1', [userId])
  if (!target.rowCount) return sendError(response, 404, 'not_found', 'User not found.')
  if (!active && target.rows[0].is_primary_admin) return sendError(response, 400, 'protected_admin', 'The primary administrator cannot be disabled.')
  if (!active && target.rows[0].role === 'admin') {
    const adminCount = await pool.query('SELECT COUNT(*)::INTEGER AS count FROM users WHERE role = \'admin\' AND active = TRUE AND id <> $1', [userId])
    if (Number(adminCount.rows[0].count) < 1) return sendError(response, 400, 'last_admin', 'At least one active administrator must remain.')
  }
  const result = await pool.query('UPDATE users SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, role, active', [active, userId])
  if (!active) await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId])
  response.json({ id: Number(result.rows[0].id), email: result.rows[0].email, name: result.rows[0].name, role: result.rows[0].role, active: Boolean(result.rows[0].active) })
}))

app.delete('/api/admin/users/:id', requireAdmin, asyncHandler(async (request, response) => {
  const userId = parsePositiveId(request.params.id)
  if (!userId) return sendError(response, 400, 'invalid_input', 'User ID must be a positive integer.')
  if (userId === request.user.id) return sendError(response, 400, 'invalid_input', 'You cannot delete your own account.')
  const target = await pool.query('SELECT id, role FROM users WHERE id = $1', [userId])
  if (!target.rowCount) return sendError(response, 404, 'not_found', 'User not found.')
  if (target.rows[0].is_primary_admin) return sendError(response, 400, 'protected_admin', 'The primary administrator cannot be deleted.')
  if (target.rows[0].role === 'admin') {
    const adminCount = await pool.query('SELECT COUNT(*)::INTEGER AS count FROM users WHERE role = \'admin\' AND id <> $1', [userId])
    if (Number(adminCount.rows[0].count) < 1) return sendError(response, 400, 'last_admin', 'You cannot delete the only administrator.')
  }
  await pool.query('DELETE FROM users WHERE id = $1', [userId])
  response.status(204).end()
}))

app.get('/api/topics', asyncHandler(async (_request, response) => {
  const result = await pool.query('SELECT id, source_topic_id, name, description, order_number FROM topics ORDER BY order_number')
  response.json(result.rows)
}))

app.get('/api/topics/:id', asyncHandler(async (request, response) => {
  const topicId = getIdOrSendBadRequest(request, response)
  if (!topicId) return
  const topicResult = await pool.query('SELECT id, source_topic_id, name, description, order_number FROM topics WHERE id = $1', [topicId])
  if (topicResult.rowCount === 0) {
    sendError(response, 404, 'not_found', 'Topic not found.')
    return
  }
  const subtopicResult = await pool.query('SELECT id, source_subtopic_id, name, order_number FROM subtopics WHERE topic_id = $1 ORDER BY order_number', [topicId])
  response.json({ ...topicResult.rows[0], subtopics: subtopicResult.rows })
}))

app.get('/api/problems', asyncHandler(async (request, response) => {
  const { topic_id: topicIdValue, subtopic_id: subtopicIdValue, difficulty, status } = request.query
  const conditions = []
  const values = [request.user.id]

  if (topicIdValue !== undefined) {
    const topicId = parsePositiveId(topicIdValue)
    if (!topicId) return sendError(response, 400, 'invalid_input', 'topic_id must be a positive integer.')
    values.push(topicId)
    conditions.push(`t.id = $${values.length}`)
  }
  if (subtopicIdValue !== undefined) {
    const subtopicId = parsePositiveId(subtopicIdValue)
    if (!subtopicId) return sendError(response, 400, 'invalid_input', 'subtopic_id must be a positive integer.')
    values.push(subtopicId)
    conditions.push(`s.id = $${values.length}`)
  }
  if (difficulty !== undefined) {
    if (typeof difficulty !== 'string' || !validDifficulties.has(difficulty)) return sendError(response, 400, 'invalid_input', 'difficulty must be easy, medium, or hard.')
    values.push(difficulty)
    conditions.push(`p.difficulty = $${values.length}`)
  }
  if (status !== undefined) {
    if (typeof status !== 'string' || !validStatuses.has(status)) return sendError(response, 400, 'invalid_input', 'status must be not_started or solved.')
    values.push(status)
    conditions.push(`COALESCE(pp.status, 'not_started') = $${values.length}`)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await pool.query(
    `SELECT p.id, p.source_problem_id, p.title, p.difficulty, p.pattern, p.leetcode_url, p.gfg_url, p.youtube_url, p.article_url,
            p.time_complexity, p.space_complexity, p.brute_force, p.optimal_approach, p.order_number,
            (b.problem_id IS NOT NULL) AS bookmarked,
            t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic,
            COALESCE(pp.status, 'not_started') AS status, COALESCE(pp.revision, FALSE) AS revision,
            EXISTS (SELECT 1 FROM problem_solutions ps WHERE ps.problem_id = p.id
                    AND (NULLIF(BTRIM(ps.problem_statement), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.examples), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.brute_force), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.better_approach), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.optimal_approach), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.code), '') IS NOT NULL)) AS has_solution
     FROM problems p JOIN subtopics s ON s.id = p.subtopic_id JOIN topics t ON t.id = s.topic_id
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = $1
     LEFT JOIN bookmarks b ON b.problem_id = p.id AND b.user_id = $1 ${whereClause}
     ORDER BY t.order_number, s.order_number, p.order_number`,
    values,
  )
  response.json(result.rows.map(mapProblem))
}))

app.get('/api/problems/:id/solution', asyncHandler(async (request, response) => {
  const userId = request.user.id
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return

  const result = await pool.query(
    `SELECT p.id, p.source_problem_id, p.title, p.difficulty, p.pattern, p.leetcode_url, p.gfg_url, p.youtube_url, p.article_url,
            p.time_complexity, p.space_complexity, p.brute_force, p.optimal_approach, p.order_number,
            (b.problem_id IS NOT NULL) AS bookmarked,
            t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic,
            COALESCE(pp.status, 'not_started') AS status, COALESCE(pp.revision, FALSE) AS revision,
            ps.problem_statement AS solution_problem_statement,
            ps.examples AS solution_examples,
            ps.brute_force AS solution_brute_force,
            ps.better_approach AS solution_better_approach,
            ps.optimal_approach AS solution_optimal_approach,
            ps.code AS solution_code,
            ps.code_language AS solution_code_language,
            ps.video_url AS solution_video_url,
            ps.source_repository AS solution_source_repository,
            ps.source_file AS solution_source_file,
            ps.mapping_confidence AS solution_mapping_confidence
     FROM problems p
     JOIN subtopics s ON s.id = p.subtopic_id
     JOIN topics t ON t.id = s.topic_id
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = $1
     LEFT JOIN bookmarks b ON b.problem_id = p.id AND b.user_id = $1
     LEFT JOIN problem_solutions ps ON ps.problem_id = p.id
     WHERE p.id = $2`,
    [userId, problemId],
  )

  if (result.rowCount === 0) {
    sendError(response, 404, 'not_found', 'Problem not found.')
    return
  }

  const row = result.rows[0]
  const problem = mapProblem(row)
  const hasSolution = Boolean(row.solution_problem_statement || row.solution_examples || row.solution_brute_force || row.solution_better_approach || row.solution_optimal_approach || row.solution_code)

  response.json({
    problem,
    solution: hasSolution ? {
      available: true,
      problem_statement: row.solution_problem_statement || '',
      examples: row.solution_examples || '',
      brute_force: row.solution_brute_force || '',
      better_approach: row.solution_better_approach || '',
      optimal_approach: row.solution_optimal_approach || '',
      code: row.solution_code || '',
      code_language: row.solution_code_language || 'C++',
      source_repository: row.solution_source_repository || null,
      source_file: row.solution_source_file || null,
      mapping_confidence: row.solution_mapping_confidence === null || row.solution_mapping_confidence === undefined
        ? null
        : Number(row.solution_mapping_confidence),
    } : { available: false },
  })
}))

app.get('/api/problems/:id', asyncHandler(async (request, response) => {
  const userId = request.user.id
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  const result = await pool.query(
    `SELECT p.id, p.source_problem_id, p.title, p.difficulty, p.pattern, p.leetcode_url, p.gfg_url, p.youtube_url, p.article_url,
            p.time_complexity, p.space_complexity, p.brute_force, p.optimal_approach, p.order_number,
            (b.problem_id IS NOT NULL) AS bookmarked,
            t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic,
            COALESCE(pp.status, 'not_started') AS status, n.content AS note, (b.problem_id IS NOT NULL) AS bookmarked,
            EXISTS (SELECT 1 FROM problem_solutions ps WHERE ps.problem_id = p.id
                    AND (NULLIF(BTRIM(ps.problem_statement), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.examples), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.brute_force), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.better_approach), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.optimal_approach), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.code), '') IS NOT NULL)) AS has_solution
     FROM problems p JOIN subtopics s ON s.id = p.subtopic_id JOIN topics t ON t.id = s.topic_id
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = $1
     LEFT JOIN notes n ON n.problem_id = p.id AND n.user_id = $1
     LEFT JOIN bookmarks b ON b.problem_id = p.id AND b.user_id = $1
     WHERE p.id = $2`,
    [userId, problemId],
  )
  if (result.rowCount === 0) return sendError(response, 404, 'not_found', 'Problem not found.')
  const problem = mapProblem(result.rows[0])
  response.json({ ...problem, note: result.rows[0].note, bookmarked: result.rows[0].bookmarked })
}))

app.get('/api/progress', asyncHandler(async (request, response) => {
  const userId = request.user.id
  const totalsResult = await pool.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'solved') AS solved,
            COUNT(*) FILTER (WHERE COALESCE(pp.revision, FALSE)) AS revision,
            COUNT(*) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'not_started') AS not_started,
            COUNT(b.problem_id) AS bookmarks
     FROM problems p LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = $1
     LEFT JOIN bookmarks b ON b.problem_id = p.id AND b.user_id = $1`,
    [userId],
  )
  const topicResult = await pool.query(
    `SELECT t.id, t.name, COUNT(p.id) AS total,
            COUNT(p.id) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'solved') AS solved,
            COUNT(p.id) FILTER (WHERE COALESCE(pp.revision, FALSE)) AS revision,
            COUNT(p.id) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'not_started') AS not_started
     FROM topics t LEFT JOIN subtopics s ON s.topic_id = t.id LEFT JOIN problems p ON p.subtopic_id = s.id
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = $1
     GROUP BY t.id, t.name, t.order_number ORDER BY t.order_number`,
    [userId],
  )
  const difficultyResult = await pool.query(
    `SELECT LOWER(p.difficulty) AS difficulty, COUNT(*) AS total,
            COUNT(*) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'solved') AS solved
     FROM problems p LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = $1
     GROUP BY LOWER(p.difficulty)`,
    [userId],
  )
  const totals = totalsResult.rows[0]
  const total = Number(totals.total)
  const solved = Number(totals.solved)
  const difficulty = { easy: { total: 0, solved: 0 }, medium: { total: 0, solved: 0 }, hard: { total: 0, solved: 0 } }
  difficultyResult.rows.forEach((row) => { if (difficulty[row.difficulty]) { difficulty[row.difficulty] = { total: Number(row.total), solved: Number(row.solved) } } })
  response.json({
    total, solved, revision: Number(totals.revision), not_started: Number(totals.not_started), bookmarks: Number(totals.bookmarks),
    completion_percentage: total === 0 ? 0 : Number(((solved / total) * 100).toFixed(2)),
    difficulty,
    topics: topicResult.rows.map((topic) => {
      const topicTotal = Number(topic.total)
      const topicSolved = Number(topic.solved)
      return { id: Number(topic.id), name: topic.name, total: topicTotal, solved: topicSolved, revision: Number(topic.revision), not_started: Number(topic.not_started), completion_percentage: topicTotal === 0 ? 0 : Number(((topicSolved / topicTotal) * 100).toFixed(2)) }
    }),
  })
}))

app.patch('/api/problems/:id', requireAdmin, asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  if (!(await requireProblem(problemId, response))) return

  const allowedFields = {
    title: 'title',
    difficulty: 'difficulty',
    pattern: 'pattern',
    leetcode_url: 'leetcode_url',
    gfg_url: 'gfg_url',
    youtube_url: 'youtube_url',
    article_url: 'article_url',
    time_complexity: 'time_complexity',
    space_complexity: 'space_complexity',
    brute_force: 'brute_force',
    optimal_approach: 'optimal_approach',
    order_number: 'order_number',
  }
  const provided = Object.keys(request.body || {}).filter((key) => Object.prototype.hasOwnProperty.call(allowedFields, key))
  if (provided.length === 0) return sendError(response, 400, 'invalid_input', 'Provide at least one editable problem field.')
  const unknown = Object.keys(request.body || {}).filter((key) => !Object.prototype.hasOwnProperty.call(allowedFields, key))
  if (unknown.length > 0) return sendError(response, 400, 'invalid_input', `Unknown or non-editable field: ${unknown[0]}.`)

  const values = []
  const assignments = []
  for (const field of provided) {
    let value = request.body[field]
    if (field === 'difficulty') {
      if (typeof value !== 'string' || !validDifficulties.has(value.toLowerCase())) return sendError(response, 400, 'invalid_input', 'difficulty must be easy, medium, or hard.')
      value = value.toLowerCase()
    } else if (field === 'order_number') {
      if (!Number.isInteger(value) || value < 0) return sendError(response, 400, 'invalid_input', 'order_number must be a non-negative integer.')
    } else if (value !== null && typeof value !== 'string') {
      return sendError(response, 400, 'invalid_input', `${field} must be a string or null.`)
    }
    values.push(value)
    assignments.push(`${allowedFields[field]} = $${values.length}`)
  }
  values.push(problemId)
  const result = await pool.query(
    `UPDATE problems SET ${assignments.join(', ')} WHERE id = $${values.length}
     RETURNING id, source_problem_id, title, difficulty, pattern, leetcode_url, gfg_url, youtube_url, article_url,
               time_complexity, space_complexity, brute_force, optimal_approach, order_number, updated_at`,
    values,
  )
  response.json({ ...result.rows[0], id: Number(result.rows[0].id), order_number: Number(result.rows[0].order_number) })
}))

app.patch('/api/problems/:id/status', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  const { status, activity_date: requestedActivityDate } = request.body
  if (typeof status !== 'string' || !validStatuses.has(status)) return sendError(response, 400, 'invalid_input', 'status must be not_started or solved.')
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (requestedActivityDate !== undefined && (typeof requestedActivityDate !== 'string' || !datePattern.test(requestedActivityDate))) return sendError(response, 400, 'invalid_input', 'activity_date must use YYYY-MM-DD format.')
  if (!(await requireProblem(problemId, response))) return

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const previous = await client.query("SELECT status FROM problem_progress WHERE problem_id = $1 AND user_id = $2", [problemId, request.user.id])
    const previousStatus = previous.rowCount ? previous.rows[0].status : 'not_started'
    const result = await client.query(
      `INSERT INTO problem_progress (problem_id, user_id, status) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, problem_id) DO UPDATE SET status = EXCLUDED.status
       RETURNING problem_id, status, revision, updated_at`,
      [problemId, request.user.id, status],
    )

    if (previousStatus !== 'solved' && status === 'solved') {
      const activityDate = requestedActivityDate || new Date().toISOString().slice(0, 10)
      await client.query(
        `INSERT INTO practice_activity (user_id, activity_date, problems_solved) VALUES ($1, $2, 0)
         ON CONFLICT (user_id, activity_date) DO NOTHING`,
        [request.user.id, activityDate],
      )
      const activityProblem = await client.query(
        `INSERT INTO practice_activity_problems (user_id, activity_date, problem_id)
         VALUES ($1, $2, $3) ON CONFLICT (user_id, activity_date, problem_id) DO NOTHING RETURNING problem_id`,
        [request.user.id, activityDate, problemId],
      )
      if (activityProblem.rowCount === 1) {
        await client.query(
          `UPDATE practice_activity SET problems_solved = problems_solved + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND activity_date = $2`,
          [request.user.id, activityDate],
        )
      }
    }

    await client.query('COMMIT')
    response.json(result.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

app.get('/api/revision', asyncHandler(async (request, response) => {
  const userId = request.user.id
  const result = await pool.query(
    `SELECT p.id, p.source_problem_id, p.title, p.difficulty, p.pattern, p.leetcode_url, p.gfg_url, p.youtube_url, p.article_url,
            p.time_complexity, p.space_complexity, p.brute_force, p.optimal_approach, p.order_number,
            (b.problem_id IS NOT NULL) AS bookmarked,
            t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic,
            COALESCE(pp.status, 'not_started') AS status, COALESCE(pp.revision, FALSE) AS revision,
            EXISTS (SELECT 1 FROM problem_solutions ps WHERE ps.problem_id = p.id
                    AND (NULLIF(BTRIM(ps.problem_statement), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.examples), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.brute_force), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.better_approach), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.optimal_approach), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.code), '') IS NOT NULL)) AS has_solution
     FROM problems p JOIN subtopics s ON s.id = p.subtopic_id JOIN topics t ON t.id = s.topic_id
     JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = $1 AND pp.revision = TRUE
     LEFT JOIN bookmarks b ON b.problem_id = p.id AND b.user_id = $1
     ORDER BY t.order_number, s.order_number, p.order_number`,
    [userId],
  )
  response.json(result.rows.map(mapProblem))
}))

app.patch('/api/problems/:id/revision', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  if (!(await requireProblem(problemId, response))) return
  const { revision } = request.body
  if (typeof revision !== 'boolean') return sendError(response, 400, 'invalid_input', 'revision must be a boolean.')
  const result = await pool.query(
    `INSERT INTO problem_progress (problem_id, user_id, status, revision) VALUES ($1, $2, 'not_started', $3)
     ON CONFLICT (user_id, problem_id) DO UPDATE SET revision = EXCLUDED.revision
     RETURNING problem_id, status, revision, updated_at`,
    [problemId, request.user.id, revision],
  )
  response.json(result.rows[0])
}))

app.get('/api/bookmarks', asyncHandler(async (request, response) => {
  const userId = request.user.id
  const result = await pool.query(
    `SELECT p.id, p.source_problem_id, p.title, p.difficulty, p.pattern, p.leetcode_url, p.gfg_url, p.youtube_url, p.article_url,
            p.time_complexity, p.space_complexity, p.brute_force, p.optimal_approach, p.order_number,
            (b.problem_id IS NOT NULL) AS bookmarked,
            t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic,
            COALESCE(pp.status, 'not_started') AS status, COALESCE(pp.revision, FALSE) AS revision, b.created_at AS bookmarked_at,
            TRUE AS bookmarked,
            EXISTS (SELECT 1 FROM problem_solutions ps WHERE ps.problem_id = p.id
                    AND (NULLIF(BTRIM(ps.problem_statement), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.examples), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.brute_force), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.better_approach), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.optimal_approach), '') IS NOT NULL
                      OR NULLIF(BTRIM(ps.code), '') IS NOT NULL)) AS has_solution
     FROM bookmarks b JOIN problems p ON p.id = b.problem_id JOIN subtopics s ON s.id = p.subtopic_id JOIN topics t ON t.id = s.topic_id
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = $1
     WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
    [userId],
  )
  response.json(result.rows.map((row) => ({ ...mapProblem(row), bookmarked_at: row.bookmarked_at })))
}))

app.post('/api/problems/:id/bookmark', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  if (!(await requireProblem(problemId, response))) return
  const result = await pool.query('INSERT INTO bookmarks (user_id, problem_id) VALUES ($1, $2) ON CONFLICT (user_id, problem_id) DO NOTHING RETURNING problem_id, created_at', [request.user.id, problemId])
  response.status(result.rowCount === 1 ? 201 : 200).json({ problem_id: problemId, bookmarked: true, created: result.rowCount === 1, created_at: result.rowCount === 1 ? result.rows[0].created_at : null })
}))

app.delete('/api/problems/:id/bookmark', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  if (!(await requireProblem(problemId, response))) return
  const result = await pool.query('DELETE FROM bookmarks WHERE user_id = $1 AND problem_id = $2 RETURNING problem_id', [request.user.id, problemId])
  response.json({ problem_id: problemId, bookmarked: false, removed: result.rowCount === 1 })
}))

app.get('/api/streaks', asyncHandler(async (request, response) => {
  const requestedDate = request.query.date
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (requestedDate !== undefined && (typeof requestedDate !== 'string' || !datePattern.test(requestedDate))) {
    return sendError(response, 400, 'invalid_input', 'date must use YYYY-MM-DD format.')
  }
  const today = requestedDate || new Date().toISOString().slice(0, 10)
  const result = await pool.query(`SELECT activity_date, problems_solved FROM practice_activity WHERE user_id = $1 ORDER BY activity_date`, [request.user.id])
  const activity = result.rows.map((row) => ({ date: row.activity_date.toISOString().slice(0, 10), problems_solved: Number(row.problems_solved) }))
  const activeDates = new Set(activity.map((item) => item.date))
  const totalProblemsSolved = activity.reduce((sum, item) => sum + item.problems_solved, 0)
  const activeDays = activity.length
  const dateFromString = (value) => new Date(`${value}T00:00:00Z`)
  const previousDate = (value) => { const date = dateFromString(value); date.setUTCDate(date.getUTCDate() - 1); return date.toISOString().slice(0, 10) }
  let currentStreak = 0
  let cursor = activeDates.has(today) ? today : previousDate(today)
  while (activeDates.has(cursor)) { currentStreak += 1; cursor = previousDate(cursor) }
  let longestStreak = 0
  let running = 0
  let previous = null
  for (const item of activity) {
    if (previous) {
      const next = dateFromString(previous)
      next.setUTCDate(next.getUTCDate() + 1)
      running = next.toISOString().slice(0, 10) === item.date ? running + 1 : 1
    } else running = 1
    longestStreak = Math.max(longestStreak, running)
    previous = item.date
  }
  response.json({ current_streak: currentStreak, longest_streak: longestStreak, active_days: activeDays, problems_solved: totalProblemsSolved, today_active: activeDates.has(today), activity })
}))

app.get('/api/daily-quote', asyncHandler(async (request, response) => {
  const requestedDate = request.query.date
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (requestedDate !== undefined && (typeof requestedDate !== 'string' || !datePattern.test(requestedDate))) {
    return sendError(response, 400, 'invalid_input', 'date must use YYYY-MM-DD format.')
  }
  const quoteDate = requestedDate || new Date().toISOString().slice(0, 10)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const existing = await client.query(
      `SELECT q.id, q.quote_text, q.author, q.category
       FROM daily_quotes dq JOIN quotes q ON q.id = dq.quote_id
       WHERE dq.quote_date = $1`,
      [quoteDate],
    )
    if (existing.rowCount) {
      await client.query('COMMIT')
      return response.json({ ...existing.rows[0], date: quoteDate })
    }
    const previous = await client.query('SELECT quote_id FROM daily_quotes WHERE quote_date = ($1::date - INTERVAL \'1 day\')', [quoteDate])
    const params = previous.rowCount ? [previous.rows[0].quote_id] : []
    const randomQuote = await client.query(
      `SELECT id, quote_text, author, category FROM quotes
       WHERE is_active = TRUE ${params.length ? 'AND id <> $1' : ''}
       ORDER BY RANDOM() LIMIT 1`,
      params,
    )
    if (!randomQuote.rowCount) {
      await client.query('ROLLBACK')
      return sendError(response, 500, 'quote_unavailable', 'No quotes are available.')
    }
    await client.query(
      `INSERT INTO daily_quotes (quote_date, quote_id) VALUES ($1, $2)
       ON CONFLICT (quote_date) DO NOTHING`,
      [quoteDate, randomQuote.rows[0].id],
    )
    const assigned = await client.query(
      `SELECT q.id, q.quote_text, q.author, q.category
       FROM daily_quotes dq JOIN quotes q ON q.id = dq.quote_id WHERE dq.quote_date = $1`,
      [quoteDate],
    )
    await client.query('COMMIT')
    response.json({ ...assigned.rows[0], date: quoteDate })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

app.get('/api/problems/:id/note', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  if (!(await requireProblem(problemId, response))) return
  const result = await pool.query('SELECT problem_id, content, updated_at FROM notes WHERE user_id = $1 AND problem_id = $2', [request.user.id, problemId])
  response.json(result.rowCount === 0 ? { problem_id: problemId, content: null, updated_at: null } : result.rows[0])
}))

app.put('/api/problems/:id/note', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  const { content } = request.body
  if (typeof content !== 'string') return sendError(response, 400, 'invalid_input', 'content must be a string.')
  if (!(await requireProblem(problemId, response))) return
  const result = await pool.query(
    `INSERT INTO notes (user_id, problem_id, content) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, problem_id) DO UPDATE SET content = EXCLUDED.content
     RETURNING problem_id, content, updated_at`,
    [request.user.id, problemId, content],
  )
  response.json(result.rows[0])
}))

app.use((_request, response) => {
  sendError(response, 404, 'not_found', 'Route not found.')
})

app.use((error, _request, response, _next) => {
  if (error?.type === 'entity.parse.failed') {
    sendError(response, 400, 'invalid_input', 'Request body must be valid JSON.')
    return
  }
  console.error('Unexpected API error:', error)
  sendError(response, 500, 'internal_error', 'An unexpected error occurred.')
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
