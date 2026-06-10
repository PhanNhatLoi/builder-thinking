import { endpoints } from './endpoints'
import { env } from '../config/env'
import { clearAuthCookies, getCookie, setAuthCookies } from '../utils/authCookies'

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
  const refreshToken = getCookie('refreshToken')

  if (!refreshToken) {
    return null
  }

  const response = await fetch(createApiUrl(endpoints.auth.refreshToken), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })
  const data = await parseResponse(response)

  setAuthCookies(data)
  return data.accessToken
}

export async function apiFetch(path, options = {}) {
  const { query, retryOnUnauthorized = true, ...fetchOptions } = options
  const token = getCookie('accessToken')
  const headers = new Headers(fetchOptions.headers)

  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(createApiUrl(path, query), {
    ...fetchOptions,
    headers,
  })

  if (response.status === 401 && retryOnUnauthorized) {
    try {
      const nextAccessToken = await refreshTokens()

      if (nextAccessToken) {
        headers.set('Authorization', `Bearer ${nextAccessToken}`)
        const retryResponse = await fetch(createApiUrl(path, query), {
          ...fetchOptions,
          headers,
        })

        return parseResponse(retryResponse)
      }
    } catch {
      clearAuthCookies()
    }
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
}
