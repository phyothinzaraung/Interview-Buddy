import axios from 'axios'

type ApiProblem = {
  title?: unknown
  detail?: unknown
  message?: unknown
  status?: unknown
  errors?: unknown
}

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'request'

/** A normalized error shape for API failures, including Spring ProblemDetail responses. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly details?: unknown

  constructor(message: string, options: { kind: ApiErrorKind; status?: number; details?: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.kind = options.kind
    this.status = options.status
    this.details = options.details
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getServerMessage(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined

  const problem = data as ApiProblem
  if (typeof problem.detail === 'string' && problem.detail.trim()) return problem.detail
  if (typeof problem.message === 'string' && problem.message.trim()) return problem.message
  if (typeof problem.title === 'string' && problem.title.trim()) return problem.title
  return undefined
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    if (error.response) {
      const data: unknown = error.response.data
      const status = error.response.status
      return new ApiError(
        getServerMessage(data) ?? (status === 429
          ? 'Too many requests were sent. Please wait a moment and try again.'
          : status === 408
            ? 'The server timed out while processing the request. Please try again.'
            : `The request failed with status ${status}.`),
        {
          kind: 'http',
          status,
          details: data,
        },
      )
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('The request timed out while waiting for the server. Please try again.', {
        kind: 'timeout',
      })
    }

    if (error.request) {
      return new ApiError('Unable to reach the server. Check your connection and try again.', {
        kind: 'network',
      })
    }

    return new ApiError(error.message || 'The request could not be prepared.', {
      kind: 'request',
    })
  }

  return new ApiError(error instanceof Error ? error.message : 'An unexpected API error occurred.', {
    kind: 'request',
  })
}
