import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'

const authMocks = vi.hoisted(() => ({ login: vi.fn(), register: vi.fn(), retrySessionRestore: vi.fn() }))

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    login: authMocks.login,
    register: authMocks.register,
    retrySessionRestore: authMocks.retrySessionRestore,
    status: 'anonymous',
    user: null,
    error: null,
    logout: vi.fn(),
  }),
}))

describe('authentication forms', () => {
  beforeEach(() => vi.clearAllMocks())

  it('validates login email and password before calling the service', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(authMocks.login).not.toHaveBeenCalled()
  })

  it('validates password length and confirmation during registration', async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Jamie Chen' } })
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'jamie@example.test' } })
    fireEvent.change(screen.getByLabelText('Password', { selector: 'input' }), { target: { value: 'short' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Use at least 12 characters.')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(authMocks.register).not.toHaveBeenCalled()
  })

  it('lets users reveal and hide password text', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })
})
