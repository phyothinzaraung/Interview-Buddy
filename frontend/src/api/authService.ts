import { apiClient, clearCsrfToken, getCsrfToken, refreshAuthSession, setAccessToken } from './client'
import type { AuthResponse, AuthenticatedUser, LoginRequest, RegisterRequest } from './authTypes'

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
    return (await refreshAuthSession()).user
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
