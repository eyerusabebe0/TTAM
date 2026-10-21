const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const text = await response.text()
  let result
  try {
    result = text ? JSON.parse(text) : null
  } catch {
    throw new Error('The server returned an invalid response.')
  }
  if (!response.ok) {
    const message = Array.isArray(result?.message) ? result.message.join(' ') : result?.message
    throw new ApiError(message || `Request failed (${response.status}).`, response.status)
  }
  return result
}
