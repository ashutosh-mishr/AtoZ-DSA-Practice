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
    const response = await fetch(`${apiBaseUrl}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
    if (!response.ok) throw new ApiError(response.status, userMessageForStatus(response.status))
    return response.status === 204 ? null : response.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'Unable to reach the practice tracker API. Check that the server is running.')
  }
}

export const api = {
  getTopics: () => request('/topics'),
  getProgress: () => request('/progress'),
  getRevision: () => request('/revision'),
  getBookmarks: () => request('/bookmarks'),
  updateStatus: (id, status) => request(`/problems/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  createBookmark: (id) => request(`/problems/${id}/bookmark`, { method: 'POST' }),
  removeBookmark: (id) => request(`/problems/${id}/bookmark`, { method: 'DELETE' }),
}
