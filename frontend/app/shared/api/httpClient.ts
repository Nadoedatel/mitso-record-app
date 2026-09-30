/** Auth endpoints that must never trigger a token refresh on 401 */
const NO_REFRESH_ENDPOINTS = ['/auth/login', '/auth/refresh']

interface ApiErrorBody {
  message?: string | string[]
}

class HttpClient {
  private baseURL: string
  private accessToken: string | null = null
  /** Shared in-flight refresh: parallel 401s must reuse one call, the refresh token is rotated */
  private refreshPromise: Promise<boolean> | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  getAccessToken() {
    return this.accessToken
  }

  clearAuth() {
    this.accessToken = null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Include cookies for refresh token
    }

    const response = await fetch(url, config)

    // Handle 401 - try to refresh token and retry once
    if (response.status === 401 && !NO_REFRESH_ENDPOINTS.includes(endpoint)) {
      const refreshed = await this.refresh()
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`
        const retryResponse = await fetch(url, { ...config, headers })
        return this.handleResponse<T>(retryResponse)
      }
    }

    return this.handleResponse<T>(response)
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const body: ApiErrorBody = await response.json().catch(() => ({
        message: response.statusText,
      }))
      // class-validator returns an array of messages
      const message = Array.isArray(body.message) ? body.message.join(', ') : body.message
      throw new Error(message || 'Request failed')
    }

    // 204 / empty body (e.g. delete)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T
    }

    const data: unknown = await response.json()

    // API returns { data: ..., message: ... } for wrapped responses
    // But PaginatedResponse already has 'data' field, so we need to check
    // if it's a wrapper (has 'message' field) or the actual data
    if (data && typeof data === 'object' && 'data' in data && 'message' in data) {
      return (data as { data: T }).data
    }

    // Return as-is if it's already the expected type (e.g., PaginatedResponse)
    return data as T
  }

  /**
   * Refresh access token via httpOnly cookie.
   * Concurrent calls share one request. Returns false if the session is gone.
   */
  refresh(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh().finally(() => {
        this.refreshPromise = null
      })
    }
    return this.refreshPromise
  }

  private async doRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send refresh token cookie
      })

      if (!response.ok) {
        this.accessToken = null
        return false
      }

      const data: { accessToken?: string; data?: { accessToken?: string } } = await response.json()
      this.accessToken = data.accessToken ?? data.data?.accessToken ?? null
      return !!this.accessToken
    } catch {
      this.accessToken = null
      return false
    }
  }

  async get<T>(endpoint: string, options: { signal?: AbortSignal } = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', signal: options.signal })
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Create singleton instance
let httpClient: HttpClient

export const useHttpClient = () => {
  if (!httpClient) {
    const config = useRuntimeConfig()
    httpClient = new HttpClient(config.public.apiUrl as string)
  }
  return httpClient
}

export { HttpClient }
