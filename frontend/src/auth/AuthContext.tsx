import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from '../api/apiError'
import { authService } from '../api/authService'
import { setAccessToken } from '../api/client'
import type { AuthenticatedUser, LoginRequest, RegisterRequest } from '../api/authTypes'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error'

interface AuthContextValue {
  user: AuthenticatedUser | null
  status: AuthStatus
  error: string | null
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  retrySessionRestore: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const retrySessionRestore = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const profile = await authService.restoreSession()
      setUser(profile)
      setStatus('authenticated')
    } catch (restoreError) {
      setAccessToken(null)
      const apiError = restoreError instanceof ApiError ? restoreError : null
      if (apiError?.status === 401) {
        setUser(null)
        setStatus('anonymous')
        return
      }
      setError(apiError?.message ?? 'We could not check your session. Check your connection and try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void retrySessionRestore()
    const onExpired = () => {
      setAccessToken(null)
      setUser(null)
      setStatus('anonymous')
      setError(null)
    }
    const onProfile = (event: Event) => {
      const profile = (event as CustomEvent<AuthenticatedUser>).detail
      if (profile) setUser(profile)
    }
    window.addEventListener('auth:expired', onExpired)
    window.addEventListener('auth:profile', onProfile)
    return () => {
      window.removeEventListener('auth:expired', onExpired)
      window.removeEventListener('auth:profile', onProfile)
    }
  }, [retrySessionRestore])

  const login = useCallback(async (request: LoginRequest) => {
    const response = await authService.login(request)
    setUser(response.user)
    setError(null)
    setStatus('authenticated')
  }, [])

  const register = useCallback(async (request: RegisterRequest) => {
    const response = await authService.register(request)
    setUser(response.user)
    setError(null)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Clear local access regardless; a failed network request cannot keep this browser signed in.
    } finally {
      setAccessToken(null)
      setUser(null)
      setError(null)
      setStatus('anonymous')
    }
  }, [])

  const value = useMemo(() => ({
    user,
    status,
    error,
    login,
    register,
    logout,
    retrySessionRestore,
  }), [user, status, error, login, register, logout, retrySessionRestore])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
