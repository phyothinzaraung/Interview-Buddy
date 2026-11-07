import axios, { type InternalAxiosRequestConfig } from 'axios'
import { normalizeApiError } from './apiError'
import type { AuthResponse } from './authTypes'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const baseURL = configuredBaseUrl || '/'

/** Access tokens and CSRF values live in memory only. Refresh tokens remain HttpOnly cookies. */
let accessToken: string | null = null
let csrfToken: string | null = null
let csrfRequest: Promise<string> | null = null
let refreshRequest: Promise<AuthResponse> | null = null

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

async function renewAccessToken(): Promise<AuthResponse> {
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
  return refreshRequest
}

apiClient.interceptors.request.use(async (config) => {
  if (accessToken && !isAuthEndpoint(config.url)) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
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
      if (error.response?.status === 401 && request && !request._authRetried && !isAuthEndpoint(request.url)) {
        request._authRetried = true
        try {
          const session = await renewAccessToken()
          request.headers.set('Authorization', `${session.tokenType} ${session.accessToken}`)
          return apiClient.request(request)
        } catch (refreshError) {
          const normalizedRefreshError = normalizeApiError(refreshError)
          if (normalizedRefreshError.status === 401) {
            setAccessToken(null)
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:expired'))
          }
          return Promise.reject(normalizeApiError(error))
        }
      }
    }
    return Promise.reject(normalizeApiError(error))
  },
)
