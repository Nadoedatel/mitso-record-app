/**
 * Error from a failed API call. Extends Error, so existing `err instanceof Error` handling keeps working.
 * `requestId` is the backend's x-request-id: quote it in a bug report to find the exact log lines.
 */
export class ApiError extends Error {
  readonly status: number
  readonly requestId?: string

  constructor(message: string, status: number, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.requestId = requestId
  }
}
