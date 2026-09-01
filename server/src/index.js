import express from 'express'
import pool, { getDatabaseTime } from './db.js'

const app = express()
const port = process.env.PORT || 3000
const allowedOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])
const validStatuses = new Set(['not_started', 'solved', 'revision'])
const validDifficulties = new Set(['easy', 'medium', 'hard'])

app.use((request, response, next) => {
  const origin = request.headers.origin

  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
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
    title: row.title,
    difficulty: row.difficulty,
    leetcode_url: row.leetcode_url,
    topic: { id: Number(row.topic_id), name: row.topic },
    subtopic: { id: Number(row.subtopic_id), name: row.subtopic },
    status: row.status,
  }
}

const healthCheck = (_request, response) => {
  response.status(200).json({ status: 'ok', service: 'dsa-practice-tracker-api' })
}

app.get('/health', healthCheck)
app.get('/api/health', healthCheck)

app.get('/api/db/health', async (_request, response) => {
  try {
    const databaseTime = await getDatabaseTime()
    response.status(200).json({ status: 'ok', service: 'dsa-practice-tracker-api', database: 'connected', databaseTime })
  } catch (error) {
    console.error('Database health check failed:', error)
    response.status(503).json({ status: 'error', service: 'dsa-practice-tracker-api', database: 'unavailable' })
  }
})

app.get('/api/topics', asyncHandler(async (_request, response) => {
  const result = await pool.query('SELECT id, name, description, order_number FROM topics ORDER BY order_number')
  response.json(result.rows)
}))

app.get('/api/topics/:id', asyncHandler(async (request, response) => {
  const topicId = getIdOrSendBadRequest(request, response)
  if (!topicId) return
  const topicResult = await pool.query('SELECT id, name, description, order_number FROM topics WHERE id = $1', [topicId])
  if (topicResult.rowCount === 0) {
    sendError(response, 404, 'not_found', 'Topic not found.')
    return
  }
  const subtopicResult = await pool.query('SELECT id, name, order_number FROM subtopics WHERE topic_id = $1 ORDER BY order_number', [topicId])
  response.json({ ...topicResult.rows[0], subtopics: subtopicResult.rows })
}))

app.get('/api/problems', asyncHandler(async (request, response) => {
  const { topic_id: topicIdValue, subtopic_id: subtopicIdValue, difficulty, status } = request.query
  const conditions = []
  const values = []

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
    if (typeof status !== 'string' || !validStatuses.has(status)) return sendError(response, 400, 'invalid_input', 'status must be not_started, solved, or revision.')
    values.push(status)
    conditions.push(`COALESCE(pp.status, 'not_started') = $${values.length}`)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await pool.query(
    `SELECT p.id, p.title, p.difficulty, p.leetcode_url, t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic, COALESCE(pp.status, 'not_started') AS status
     FROM problems p JOIN subtopics s ON s.id = p.subtopic_id JOIN topics t ON t.id = s.topic_id
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id ${whereClause}
     ORDER BY t.order_number, s.order_number, p.order_number`,
    values,
  )
  response.json(result.rows.map(mapProblem))
}))

app.get('/api/problems/:id', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  const result = await pool.query(
    `SELECT p.id, p.title, p.difficulty, p.leetcode_url, t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic,
            COALESCE(pp.status, 'not_started') AS status, n.content AS note, (b.problem_id IS NOT NULL) AS bookmarked
     FROM problems p JOIN subtopics s ON s.id = p.subtopic_id JOIN topics t ON t.id = s.topic_id
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id LEFT JOIN notes n ON n.problem_id = p.id LEFT JOIN bookmarks b ON b.problem_id = p.id
     WHERE p.id = $1`,
    [problemId],
  )
  if (result.rowCount === 0) return sendError(response, 404, 'not_found', 'Problem not found.')
  const problem = mapProblem(result.rows[0])
  response.json({ ...problem, note: result.rows[0].note, bookmarked: result.rows[0].bookmarked })
}))

app.get('/api/progress', asyncHandler(async (_request, response) => {
  const totalsResult = await pool.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'solved') AS solved,
            COUNT(*) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'revision') AS revision,
            COUNT(*) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'not_started') AS not_started
     FROM problems p LEFT JOIN problem_progress pp ON pp.problem_id = p.id`,
  )
  const topicResult = await pool.query(
    `SELECT t.id, t.name, COUNT(p.id) AS total,
            COUNT(p.id) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'solved') AS solved,
            COUNT(p.id) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'revision') AS revision,
            COUNT(p.id) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'not_started') AS not_started
     FROM topics t LEFT JOIN subtopics s ON s.topic_id = t.id LEFT JOIN problems p ON p.subtopic_id = s.id
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id
     GROUP BY t.id, t.name, t.order_number ORDER BY t.order_number`,
  )
  const totals = totalsResult.rows[0]
  const total = Number(totals.total)
  const solved = Number(totals.solved)
  response.json({
    total, solved, revision: Number(totals.revision), not_started: Number(totals.not_started),
    completion_percentage: total === 0 ? 0 : Number(((solved / total) * 100).toFixed(2)),
    topics: topicResult.rows.map((topic) => {
      const topicTotal = Number(topic.total)
      const topicSolved = Number(topic.solved)
      return { id: Number(topic.id), name: topic.name, total: topicTotal, solved: topicSolved, revision: Number(topic.revision), not_started: Number(topic.not_started), completion_percentage: topicTotal === 0 ? 0 : Number(((topicSolved / topicTotal) * 100).toFixed(2)) }
    }),
  })
}))

app.patch('/api/problems/:id/status', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  const { status } = request.body
  if (typeof status !== 'string' || !validStatuses.has(status)) return sendError(response, 400, 'invalid_input', 'status must be not_started, solved, or revision.')
  if (!(await requireProblem(problemId, response))) return
  const result = await pool.query(
    `INSERT INTO problem_progress (problem_id, status) VALUES ($1, $2)
     ON CONFLICT (problem_id) DO UPDATE SET status = EXCLUDED.status
     RETURNING problem_id, status, updated_at`,
    [problemId, status],
  )
  response.json(result.rows[0])
}))

app.get('/api/revision', asyncHandler(async (_request, response) => {
  const result = await pool.query(
    `SELECT p.id, p.title, p.difficulty, p.leetcode_url, t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic, pp.status
     FROM problems p JOIN subtopics s ON s.id = p.subtopic_id JOIN topics t ON t.id = s.topic_id
     JOIN problem_progress pp ON pp.problem_id = p.id AND pp.status = 'revision'
     ORDER BY t.order_number, s.order_number, p.order_number`,
  )
  response.json(result.rows.map(mapProblem))
}))

app.get('/api/bookmarks', asyncHandler(async (_request, response) => {
  const result = await pool.query(
    `SELECT p.id, p.title, p.difficulty, p.leetcode_url, t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic,
            COALESCE(pp.status, 'not_started') AS status, b.created_at AS bookmarked_at
     FROM bookmarks b JOIN problems p ON p.id = b.problem_id JOIN subtopics s ON s.id = p.subtopic_id JOIN topics t ON t.id = s.topic_id
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id ORDER BY b.created_at DESC`,
  )
  response.json(result.rows.map((row) => ({ ...mapProblem(row), bookmarked_at: row.bookmarked_at })))
}))

app.post('/api/problems/:id/bookmark', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  if (!(await requireProblem(problemId, response))) return
  const result = await pool.query('INSERT INTO bookmarks (problem_id) VALUES ($1) ON CONFLICT (problem_id) DO NOTHING RETURNING problem_id, created_at', [problemId])
  response.status(result.rowCount === 1 ? 201 : 200).json({ problem_id: problemId, bookmarked: true, created: result.rowCount === 1, created_at: result.rowCount === 1 ? result.rows[0].created_at : null })
}))

app.delete('/api/problems/:id/bookmark', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  if (!(await requireProblem(problemId, response))) return
  const result = await pool.query('DELETE FROM bookmarks WHERE problem_id = $1 RETURNING problem_id', [problemId])
  response.json({ problem_id: problemId, bookmarked: false, removed: result.rowCount === 1 })
}))

app.get('/api/problems/:id/note', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  if (!(await requireProblem(problemId, response))) return
  const result = await pool.query('SELECT problem_id, content, updated_at FROM notes WHERE problem_id = $1', [problemId])
  response.json(result.rowCount === 0 ? { problem_id: problemId, content: null, updated_at: null } : result.rows[0])
}))

app.put('/api/problems/:id/note', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  const { content } = request.body
  if (typeof content !== 'string') return sendError(response, 400, 'invalid_input', 'content must be a string.')
  if (!(await requireProblem(problemId, response))) return
  const result = await pool.query(
    `INSERT INTO notes (problem_id, content) VALUES ($1, $2)
     ON CONFLICT (problem_id) DO UPDATE SET content = EXCLUDED.content
     RETURNING problem_id, content, updated_at`,
    [problemId, content],
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
