import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/apiError'
import { authService } from '../api/authService'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../api/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    restoreSession: vi.fn(),
  },
}))

vi.mock('../api/client', () => ({ setAccessToken: vi.fn() }))

const restoredUser = { id: 8, name: 'Alex Morgan', email: 'alex@example.test', role: 'USER' as const }

function AuthStateProbe() {
  const { user, status, error, login, logout, retrySessionRestore } = useAuth()
  return (
    <section>
      <p data-testid="auth-state">{status}:{user?.name ?? 'anonymous'}</p>
      {error && <p role="alert">{error}</p>}
      <button onClick={() => void login({ email: 'alex@example.test', password: 'correct-horse' })}>Log in</button>
      <button onClick={() => void logout()}>Log out</button>
      <button onClick={() => void retrySessionRestore()}>Retry</button>
    </section>
  )
}

function renderProbe() {
  return render(<AuthProvider><AuthStateProbe /></AuthProvider>)
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.restoreSession).mockResolvedValue(restoredUser)
    vi.mocked(authService.logout).mockResolvedValue()
  })

  it('restores the authenticated profile when the app starts', async () => {
    renderProbe()
    expect(await screen.findByText('authenticated:Alex Morgan')).toBeInTheDocument()
    expect(authService.restoreSession).toHaveBeenCalledTimes(1)
  })

  it('clears authentication state after logout', async () => {
    renderProbe()
    await screen.findByText('authenticated:Alex Morgan')
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous:anonymous'))
    expect(authService.logout).toHaveBeenCalledTimes(1)
  })

  it('sets the returned profile after a successful login', async () => {
    const loggedInUser = { id: 9, name: 'Sam Lee', email: 'sam@example.test', role: 'USER' as const }
    vi.mocked(authService.login).mockResolvedValue({
      accessToken: 'short-lived-test-token',
      tokenType: 'Bearer',
      expiresInSeconds: 900,
      user: loggedInUser,
    })
    renderProbe()
    await screen.findByText('authenticated:Alex Morgan')
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('authenticated:Sam Lee')).toBeInTheDocument()
    expect(authService.login).toHaveBeenCalledWith({ email: 'alex@example.test', password: 'correct-horse' })
  })

  it('treats a rejected refresh cookie as an anonymous session', async () => {
    vi.mocked(authService.restoreSession).mockRejectedValueOnce(
      new ApiError('Invalid email or password, or the session has expired.', { kind: 'http', status: 401 }),
    )
    renderProbe()
    expect(await screen.findByText('anonymous:anonymous')).toBeInTheDocument()
  })

  it('shows a recoverable network error and retries session restoration', async () => {
    vi.mocked(authService.restoreSession)
      .mockRejectedValueOnce(new ApiError('Unable to reach the server.', { kind: 'network' }))
      .mockResolvedValueOnce(restoredUser)
    renderProbe()
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the server.')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('authenticated:Alex Morgan')).toBeInTheDocument()
    expect(authService.restoreSession).toHaveBeenCalledTimes(2)
  })
})
