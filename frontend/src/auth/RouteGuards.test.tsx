import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/apiError'
import { AuthProvider, useAuth } from './AuthContext'
import { GuestRoute, ProtectedRoute } from './RouteGuards'
import { authService } from '../api/authService'

vi.mock('../api/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    restoreSession: vi.fn(),
  },
}))

vi.mock('../api/client', () => ({ setAccessToken: vi.fn() }))

const user = { id: 4, name: 'Jamie Chen', email: 'jamie@example.test', role: 'USER' as const }

function PrivatePage() {
  const { logout } = useAuth()
  return <div><h1>Private dashboard</h1><button onClick={() => void logout()}>Sign out</button></div>
}

function renderRoutes(initialPath: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<GuestRoute />}><Route path="/login" element={<h1>Login page</h1>} /></Route>
          <Route element={<ProtectedRoute />}><Route path="/private" element={<PrivatePage />} /></Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('authentication route guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.logout).mockResolvedValue()
  })

  it('does not render protected content before checking the refresh cookie', () => {
    vi.mocked(authService.restoreSession).mockReturnValue(new Promise(() => undefined))
    renderRoutes('/private')
    expect(screen.getByText('Checking your session…')).toBeInTheDocument()
    expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument()
  })

  it('redirects to login when the session is anonymous', async () => {
    vi.mocked(authService.restoreSession).mockRejectedValue(new ApiError('Expired session', { kind: 'http', status: 401 }))
    renderRoutes('/private')
    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument()
    expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument()
  })

  it('blocks protected pages after logout', async () => {
    vi.mocked(authService.restoreSession).mockResolvedValue(user)
    renderRoutes('/private')
    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument()
    expect(authService.logout).toHaveBeenCalledTimes(1)
  })
})
