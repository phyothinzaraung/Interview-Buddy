import { apiClient, clearCsrfToken, getCsrfToken, setAccessToken } from './client'
import type { AuthResponse, AuthenticatedUser, LoginRequest, RegisterRequest } from './authTypes'

let restoreRequest: Promise<AuthenticatedUser> | null = null

export const authService = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    await getCsrfToken()
    const { data } = await apiClient.post<AuthResponse>('/api/auth/login', request)
    setAccessToken(data.accessToken)
    return data
  },

  async register(request: RegisterRequest): Promise<AuthResponse> {
    await getCsrfToken()
    const { data } = await apiClient.post<AuthResponse>('/api/auth/register', request)
    setAccessToken(data.accessToken)
    return data
  },

  async getCurrentUser(): Promise<AuthenticatedUser> {
    const { data } = await apiClient.get<AuthenticatedUser>('/api/auth/me')
    return data
  },

  async restoreSession(): Promise<AuthenticatedUser> {
    if (!restoreRequest) {
      restoreRequest = (async () => {
        const csrf = await getCsrfToken(true)
        const { data } = await apiClient.post<AuthResponse>('/api/auth/refresh', {}, {
          headers: { 'X-XSRF-TOKEN': csrf },
        })
        setAccessToken(data.accessToken)
        return authService.getCurrentUser()
      })().finally(() => {
        restoreRequest = null
      })
    }
    return restoreRequest
  },

  async logout(): Promise<void> {
    try {
      await getCsrfToken(true)
      await apiClient.post('/api/auth/logout')
    } finally {
      setAccessToken(null)
      clearCsrfToken()
    }
  },
}
