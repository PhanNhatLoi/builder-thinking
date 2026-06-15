import { endpoints } from './endpoints'
import { env } from '../config/env'
import { clearAuthCookies, setAuthCookies } from '../utils/authCookies'

function createApiUrl(path, query) {
  const baseUrl = env.apiBaseUrl.replace(/\/$/, '')
  const url = new URL(`${baseUrl}${path}`, window.location.origin)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })
  }

  return url
}

async function parseResponse(response) {
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = data?.message || data?.error || 'Request failed.'
    throw new Error(Array.isArray(message) ? message.join(', ') : message)
  }

  return data
}

async function refreshTokens() {
  const response = await fetch(createApiUrl(endpoints.auth.refreshToken), {
    credentials: 'include',
    method: 'POST',
  })

  const tokens = await parseResponse(response)
  if (tokens?.accessToken && tokens?.refreshToken) {
    setAuthCookies(tokens)
  }

  return tokens
}

function redirectToLogin() {
  clearAuthCookies()
  window.location.hash = 'login'
}

export async function apiFetch(path, options = {}) {
  const { query, retryOnUnauthorized = true, ...fetchOptions } = options
  const headers = new Headers(fetchOptions.headers)

  if (!headers.has('Content-Type') && fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(createApiUrl(path, query), {
    ...fetchOptions,
    credentials: 'include',
    headers,
  })

  if (response.status === 401 && retryOnUnauthorized) {
    try {
      await refreshTokens()
    } catch {
      redirectToLogin()
      return parseResponse(response)
    }

    const retryResponse = await fetch(createApiUrl(path, query), {
      ...fetchOptions,
      credentials: 'include',
      headers,
    })

    if (retryResponse.status === 401) {
      redirectToLogin()
    }

    return parseResponse(retryResponse)
  }

  return parseResponse(response)
}

export const axiosClient = {
  get: (path, options) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    apiFetch(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),
  postForm: (path, body, options) =>
    apiFetch(path, {
      ...options,
      method: 'POST',
      body,
    }),
  put: (path, body, options) =>
    apiFetch(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: (path, body, options) =>
    apiFetch(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: (path, options) => apiFetch(path, { ...options, method: 'DELETE' }),
}
