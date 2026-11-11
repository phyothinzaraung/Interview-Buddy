import axios, { AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import { authService } from './authService'
import { apiClient, clearCsrfToken, setAccessToken } from './client'
import { interviewService } from './interviewService'
import { questionService } from './questionService'

const originalAdapter = apiClient.defaults.adapter

function response(config: Parameters<AxiosAdapter>[0], data: unknown): AxiosResponse {
  return { config, data, status: 200, statusText: 'OK', headers: new AxiosHeaders() }
}

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
  setAccessToken(null)
  clearCsrfToken()
  vi.restoreAllMocks()
})

it('carries the login access token through My Interviews and question generation services', async () => {
  vi.spyOn(axios, 'get').mockResolvedValue({ data: { token: 'csrf-value' } } as never)
  const requests: Array<{ method: string; url: string; authorization: string | undefined; csrf: string | undefined }> = []
  apiClient.defaults.adapter = async (config) => {
    requests.push({
      method: config.method?.toUpperCase() ?? 'GET',
      url: config.url ?? '',
      authorization: config.headers.get('Authorization')?.toString(),
      csrf: config.headers.get('X-XSRF-TOKEN')?.toString(),
    })

    if (config.url === '/api/auth/login') {
      return response(config, {
        accessToken: 'login-access-token',
        tokenType: 'Bearer',
        expiresInSeconds: 900,
        user: { id: 2, name: 'Riley Park', email: 'riley@example.test', role: 'USER' },
      })
    }
    if (config.url === '/api/interviews') return response(config, [])
    if (config.url === '/api/interviews/7/questions/generate') return response(config, { questions: [] })
    throw new Error(`Unexpected API request: ${config.url}`)
  }

  await authService.login({ email: 'riley@example.test', password: 'correct-password' })
  await interviewService.getInterviews()
  await questionService.generateQuestions(7, { numberOfQuestions: 3 })

  expect(requests).toEqual([
    { method: 'POST', url: '/api/auth/login', authorization: undefined, csrf: 'csrf-value' },
    { method: 'GET', url: '/api/interviews', authorization: 'Bearer login-access-token', csrf: undefined },
    { method: 'POST', url: '/api/interviews/7/questions/generate', authorization: 'Bearer login-access-token', csrf: 'csrf-value' },
  ])
})
