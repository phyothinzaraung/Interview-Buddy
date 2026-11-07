import axios, { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './apiError'
import { apiClient, clearCsrfToken, setAccessToken } from './client'

const originalAdapter = apiClient.defaults.adapter

function response(config: Parameters<AxiosAdapter>[0], status: number, data: unknown): AxiosResponse {
  return { config, data, status, statusText: status === 200 ? 'OK' : 'Unauthorized', headers: new AxiosHeaders() }
}

function rejectUnauthorized(config: Parameters<AxiosAdapter>[0]): never {
  const result = response(config, 401, { detail: 'Invalid or expired access token.' })
  throw new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, undefined, result)
}

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
  setAccessToken(null)
  clearCsrfToken()
  vi.restoreAllMocks()
})

describe('API client session renewal', () => {
  it('renews an expired access token once and retries the protected request', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({ data: { token: 'csrf-value' } } as never)
    const seen: Array<{ url: string; authorization: string | undefined; csrf: string | undefined; credentials: boolean | undefined }> = []
    apiClient.defaults.adapter = async (config) => {
      const authorization = config.headers.get('Authorization')?.toString()
      const csrf = config.headers.get('X-XSRF-TOKEN')?.toString()
      seen.push({ url: config.url ?? '', authorization, csrf, credentials: config.withCredentials })

      if (config.url === '/api/private' && authorization === 'Bearer old-access') return rejectUnauthorized(config)
      if (config.url === '/api/auth/refresh') {
        return response(config, 200, {
          accessToken: 'fresh-access',
          tokenType: 'Bearer',
          expiresInSeconds: 900,
          user: { id: 1, name: 'Jamie Chen', email: 'jamie@example.test', role: 'USER' },
        })
      }
      if (config.url === '/api/private' && authorization === 'Bearer fresh-access') {
        return response(config, 200, { ok: true })
      }
      throw new Error(`Unexpected API request: ${config.url}`)
    }
    setAccessToken('old-access')

    await expect(apiClient.get('/api/private')).resolves.toMatchObject({ data: { ok: true } })

    const refreshRequest = seen.find((request) => request.url === '/api/auth/refresh')
    expect(refreshRequest).toMatchObject({ authorization: undefined, csrf: 'csrf-value', credentials: true })
    expect(seen.filter((request) => request.url === '/api/private')).toHaveLength(2)
    expect(seen[2]?.authorization).toBe('Bearer fresh-access')
  })

  it('clears the in-memory token and emits expiry when refresh is rejected', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({ data: { token: 'csrf-value' } } as never)
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/api/private') return rejectUnauthorized(config)
      if (config.url === '/api/auth/refresh') return rejectUnauthorized(config)
      throw new Error(`Unexpected API request: ${config.url}`)
    }
    const onExpired = vi.fn()
    window.addEventListener('auth:expired', onExpired)
    setAccessToken('old-access')

    await expect(apiClient.get('/api/private')).rejects.toBeInstanceOf(ApiError)
    expect(onExpired).toHaveBeenCalledTimes(1)
    window.removeEventListener('auth:expired', onExpired)
  })
})
