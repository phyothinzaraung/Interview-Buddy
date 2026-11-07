/** Mirrors the backend UserProfileResponse DTO. */
export interface AuthenticatedUser {
  id: number
  name: string
  email: string
  role: 'USER'
}

/** Mirrors the backend AuthResponse DTO. The refresh token is only sent as an HttpOnly cookie. */
export interface AuthResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresInSeconds: number
  user: AuthenticatedUser
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}
