const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function userMessageForStatus(status) {
  if (status === 400) return 'The request was not valid. Please try again.'
  if (status === 404) return 'The requested item is no longer available.'
  if (status >= 500) return 'The practice tracker API is unavailable. Please try again shortly.'
  return 'Unable to complete that request. Please try again.'
}

async function request(path, options = {}) {
  if (!apiBaseUrl) throw new ApiError(0, 'The API address is not configured.')

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
    if (!response.ok) {
      let message = userMessageForStatus(response.status)
      try {
        const payload = await response.json()
        if (payload?.message) message = payload.message
      } catch {}
      throw new ApiError(response.status, message)
    }
    return response.status === 204 ? null : response.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'Unable to reach the practice tracker API. Check that the server is running.')
  }
}

export const api = {
  getCurrentUser: () => request('/auth/me'),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getAdminUsers: () => request('/admin/users'),
  updateAdminUserStatus: (id, active) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  deleteAdminUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  updateAdminUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  getProfile: () => request('/profile'),
  updateProfile: (fields) => request('/profile', { method: 'PATCH', body: JSON.stringify(fields) }),
  getTopics: () => request('/topics'),
  getDatabaseHealth: () => request('/db/health'),
  getProgress: () => request('/progress'),
  getRevision: () => request('/revision'),
  getBookmarks: () => request('/bookmarks'),
  getStreaks: (date) => request(`/streaks?date=${encodeURIComponent(date)}`),
  getDailyQuote: (date) => request(`/daily-quote?date=${encodeURIComponent(date)}`),
  getSolution: (id) => request(`/problems/${id}/solution`),
  getNote: (id) => request(`/problems/${id}/note`),
  saveNote: (id, content) => request(`/problems/${id}/note`, { method: 'PUT', body: JSON.stringify({ content }) }),
  getProblems: (params = {}) => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') search.set(key, value)
    })
    return request(`/problems${search.toString() ? `?${search.toString()}` : ''}`)
  },
  updateStatus: (id, status, activityDate) => request(`/problems/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...(activityDate ? { activity_date: activityDate } : {}) }) }),
  updateProblem: (id, fields) => request(`/problems/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }),
  updateRevision: (id, revision) => request(`/problems/${id}/revision`, { method: 'PATCH', body: JSON.stringify({ revision }) }),
  createBookmark: (id) => request(`/problems/${id}/bookmark`, { method: 'POST' }),
  removeBookmark: (id) => request(`/problems/${id}/bookmark`, { method: 'DELETE' }),
}
