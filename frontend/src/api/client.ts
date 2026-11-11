import axios, { type InternalAxiosRequestConfig } from 'axios'
import { ApiError, normalizeApiError } from './apiError'
import type { AuthResponse } from './authTypes'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const baseURL = configuredBaseUrl || '/'

/** Access tokens and CSRF values live in memory only. Refresh tokens remain HttpOnly cookies. */
let accessToken: string | null = null
let csrfToken: string | null = null
let csrfRequest: Promise<string> | null = null
let refreshRequest: Promise<AuthResponse> | null = null
let refreshRejected = false

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 20_000,
})

export function setAccessToken(token: string | null): void {
  accessToken = token
  if (token) refreshRejected = false
}

export function clearCsrfToken(): void {
  csrfToken = null
}

export async function getCsrfToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) csrfToken = null
  if (csrfToken) return csrfToken
  if (csrfRequest) return csrfRequest

  const requestUrl = configuredBaseUrl
    ? `${configuredBaseUrl.replace(/\/+$/, '')}/api/auth/csrf`
    : '/api/auth/csrf'

  csrfRequest = axios.get<{ token: string }>(requestUrl, {
    withCredentials: true,
    timeout: 20_000,
    headers: { Accept: 'application/json' },
  }).then(({ data }) => {
    csrfToken = data.token
    return data.token
  }).catch((error: unknown) => {
    throw normalizeApiError(error)
  }).finally(() => {
    csrfRequest = null
  })

  return csrfRequest
}

function isSafeMethod(method?: string): boolean {
  return ['get', 'head', 'options'].includes((method ?? 'get').toLowerCase())
}

function isAuthEndpoint(url?: string): boolean {
  return /\/api\/auth\/(login|register|refresh|logout|csrf)(?:\?|$)/.test(url ?? '')
}

type RetriableRequest = InternalAxiosRequestConfig & { _authRetried?: boolean }

function expiredSessionError(): ApiError {
  return new ApiError('Your session has expired. Sign in again to continue.', { kind: 'http', status: 401 })
}

function expireSession(): void {
  const wasAlreadyExpired = refreshRejected
  refreshRejected = true
  accessToken = null
  if (!wasAlreadyExpired && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:expired'))
  }
}

export async function refreshAuthSession(): Promise<AuthResponse> {
  if (refreshRejected) throw expiredSessionError()

  if (!refreshRequest) {
    refreshRequest = (async () => {
      const csrf = await getCsrfToken(true)
      const { data } = await apiClient.post<AuthResponse>('/api/auth/refresh', {}, {
        headers: { 'X-XSRF-TOKEN': csrf },
      })
      setAccessToken(data.accessToken)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:profile', { detail: data.user }))
      }
      return data
    })().finally(() => {
      refreshRequest = null
    })
  }

  try {
    return await refreshRequest
  } catch (error) {
    const normalizedError = normalizeApiError(error)
    if (normalizedError.status === 401) {
      expireSession()
      throw expiredSessionError()
    }
    throw normalizedError
  }
}

async function requireAccessToken(): Promise<string> {
  if (accessToken) return accessToken
  return (await refreshAuthSession()).accessToken
}

apiClient.interceptors.request.use(async (config) => {
  if (!isAuthEndpoint(config.url)) {
    const token = await requireAccessToken()
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  if (!isSafeMethod(config.method)) {
    config.headers.set('X-XSRF-TOKEN', await getCsrfToken())
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const request = error.config as RetriableRequest | undefined
      if (error.response?.status === 401 && request && !isAuthEndpoint(request.url)) {
        if (request._authRetried) {
          expireSession()
          return Promise.reject(normalizeApiError(error))
        }
        request._authRetried = true
        try {
          const session = await refreshAuthSession()
          request.headers.set('Authorization', `${session.tokenType} ${session.accessToken}`)
          return apiClient.request(request)
        } catch {
          return Promise.reject(normalizeApiError(error))
        }
      }
    }
    return Promise.reject(normalizeApiError(error))
  },
)
