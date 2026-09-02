import express from 'express'
import pool, { getDatabaseTime } from './db.js'

const app = express()
const port = process.env.PORT || 3000
const allowedOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])
const validStatuses = new Set(['not_started', 'solved'])
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
            COALESCE(pp.status, 'not_started') AS status, COALESCE(pp.revision, FALSE) AS revision
     FROM problems p JOIN subtopics s ON s.id = p.subtopic_id JOIN topics t ON t.id = s.topic_id
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id
     LEFT JOIN bookmarks b ON b.problem_id = p.id ${whereClause}
     ORDER BY t.order_number, s.order_number, p.order_number`,
    values,
  )
  response.json(result.rows.map(mapProblem))
}))

app.get('/api/problems/:id/solution', asyncHandler(async (request, response) => {
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
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id
     LEFT JOIN bookmarks b ON b.problem_id = p.id
     LEFT JOIN problem_solutions ps ON ps.problem_id = p.id
     WHERE p.id = $1`,
    [problemId],
  )

  if (result.rowCount === 0) {
    sendError(response, 404, 'not_found', 'Problem not found.')
    return
  }

  const row = result.rows[0]
  const problem = mapProblem(row)
  const hasSolution = Boolean(row.solution_problem_statement || row.solution_examples || row.solution_brute_force || row.solution_better_approach || row.solution_optimal_approach || row.solution_code || row.solution_video_url)

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
      video_url: row.solution_video_url || null,
      source_repository: row.solution_source_repository || null,
      source_file: row.solution_source_file || null,
      mapping_confidence: row.solution_mapping_confidence === null || row.solution_mapping_confidence === undefined
        ? null
        : Number(row.solution_mapping_confidence),
    } : { available: false },
  })
}))

app.get('/api/problems/:id', asyncHandler(async (request, response) => {
  const problemId = getIdOrSendBadRequest(request, response)
  if (!problemId) return
  const result = await pool.query(
    `SELECT p.id, p.source_problem_id, p.title, p.difficulty, p.pattern, p.leetcode_url, p.gfg_url, p.youtube_url, p.article_url,
            p.time_complexity, p.space_complexity, p.brute_force, p.optimal_approach, p.order_number,
            (b.problem_id IS NOT NULL) AS bookmarked,
            t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic,
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
            COUNT(*) FILTER (WHERE COALESCE(pp.revision, FALSE)) AS revision,
            COUNT(*) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'not_started') AS not_started,
            COUNT(b.problem_id) AS bookmarks
     FROM problems p LEFT JOIN problem_progress pp ON pp.problem_id = p.id LEFT JOIN bookmarks b ON b.problem_id = p.id`,
  )
  const topicResult = await pool.query(
    `SELECT t.id, t.name, COUNT(p.id) AS total,
            COUNT(p.id) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'solved') AS solved,
            COUNT(p.id) FILTER (WHERE COALESCE(pp.revision, FALSE)) AS revision,
            COUNT(p.id) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'not_started') AS not_started
     FROM topics t LEFT JOIN subtopics s ON s.topic_id = t.id LEFT JOIN problems p ON p.subtopic_id = s.id
     LEFT JOIN problem_progress pp ON pp.problem_id = p.id
     GROUP BY t.id, t.name, t.order_number ORDER BY t.order_number`,
  )
  const difficultyResult = await pool.query(
    `SELECT LOWER(p.difficulty) AS difficulty, COUNT(*) AS total,
            COUNT(*) FILTER (WHERE COALESCE(pp.status, 'not_started') = 'solved') AS solved
     FROM problems p LEFT JOIN problem_progress pp ON pp.problem_id = p.id
     GROUP BY LOWER(p.difficulty)`,
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

app.patch('/api/problems/:id', asyncHandler(async (request, response) => {
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
    const previous = await client.query("SELECT status FROM problem_progress WHERE problem_id = $1", [problemId])
    const previousStatus = previous.rowCount ? previous.rows[0].status : 'not_started'
    const result = await client.query(
      `INSERT INTO problem_progress (problem_id, status) VALUES ($1, $2)
       ON CONFLICT (problem_id) DO UPDATE SET status = EXCLUDED.status
       RETURNING problem_id, status, revision, updated_at`,
      [problemId, status],
    )

    if (previousStatus !== 'solved' && status === 'solved') {
      const activityDate = requestedActivityDate || new Date().toISOString().slice(0, 10)
      await client.query(
        `INSERT INTO practice_activity (activity_date, problems_solved) VALUES ($1, 0)
         ON CONFLICT (activity_date) DO NOTHING`,
        [activityDate],
      )
      const activityProblem = await client.query(
        `INSERT INTO practice_activity_problems (activity_date, problem_id)
         VALUES ($1, $2) ON CONFLICT (activity_date, problem_id) DO NOTHING RETURNING problem_id`,
        [activityDate, problemId],
      )
      if (activityProblem.rowCount === 1) {
        await client.query(
          `UPDATE practice_activity SET problems_solved = problems_solved + 1, updated_at = CURRENT_TIMESTAMP WHERE activity_date = $1`,
          [activityDate],
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

app.get('/api/revision', asyncHandler(async (_request, response) => {
  const result = await pool.query(
    `SELECT p.id, p.source_problem_id, p.title, p.difficulty, p.pattern, p.leetcode_url, p.gfg_url, p.youtube_url, p.article_url,
            p.time_complexity, p.space_complexity, p.brute_force, p.optimal_approach, p.order_number,
            (b.problem_id IS NOT NULL) AS bookmarked,
            t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic,
            COALESCE(pp.status, 'not_started') AS status, COALESCE(pp.revision, FALSE) AS revision
     FROM problems p JOIN subtopics s ON s.id = p.subtopic_id JOIN topics t ON t.id = s.topic_id
     JOIN problem_progress pp ON pp.problem_id = p.id AND pp.revision = TRUE
     LEFT JOIN bookmarks b ON b.problem_id = p.id
     ORDER BY t.order_number, s.order_number, p.order_number`,
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
    `INSERT INTO problem_progress (problem_id, status, revision) VALUES ($1, 'not_started', $2)
     ON CONFLICT (problem_id) DO UPDATE SET revision = EXCLUDED.revision
     RETURNING problem_id, status, revision, updated_at`,
    [problemId, revision],
  )
  response.json(result.rows[0])
}))

app.get('/api/bookmarks', asyncHandler(async (_request, response) => {
  const result = await pool.query(
    `SELECT p.id, p.source_problem_id, p.title, p.difficulty, p.pattern, p.leetcode_url, p.gfg_url, p.youtube_url, p.article_url,
            p.time_complexity, p.space_complexity, p.brute_force, p.optimal_approach, p.order_number,
            (b.problem_id IS NOT NULL) AS bookmarked,
            t.id AS topic_id, t.name AS topic, s.id AS subtopic_id, s.name AS subtopic,
            COALESCE(pp.status, 'not_started') AS status, COALESCE(pp.revision, FALSE) AS revision, b.created_at AS bookmarked_at,
            TRUE AS bookmarked
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

app.get('/api/streaks', asyncHandler(async (request, response) => {
  const requestedDate = request.query.date
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (requestedDate !== undefined && (typeof requestedDate !== 'string' || !datePattern.test(requestedDate))) {
    return sendError(response, 400, 'invalid_input', 'date must use YYYY-MM-DD format.')
  }
  const today = requestedDate || new Date().toISOString().slice(0, 10)
  const result = await pool.query(`SELECT activity_date, problems_solved FROM practice_activity ORDER BY activity_date`)
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
