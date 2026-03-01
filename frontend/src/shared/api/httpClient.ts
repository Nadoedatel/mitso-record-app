class HttpClient {
  private baseURL: string
  private accessToken: string | null = null
  private userData: any = null
  private readonly TOKEN_KEY = 'mitso_access_token'
  private readonly USER_DATA_KEY = 'mitso_user_data'

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Load token from localStorage on initialization
    if (process.client) {
      this.accessToken = localStorage.getItem(this.TOKEN_KEY)
      const storedUserData = localStorage.getItem(this.USER_DATA_KEY)
      if (storedUserData) {
        try {
          this.userData = JSON.parse(storedUserData)
        } catch (e) {
          console.error('Failed to parse user data:', e)
        }
      }
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
    if (process.client) {
      if (token) {
        localStorage.setItem(this.TOKEN_KEY, token)
      } else {
        localStorage.removeItem(this.TOKEN_KEY)
      }
    }
  }

  getAccessToken() {
    return this.accessToken
  }

  setUserData(data: any) {
    this.userData = data
    if (process.client) {
      if (data) {
        localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(data))
      } else {
        localStorage.removeItem(this.USER_DATA_KEY)
      }
    }
  }

  getUserData() {
    return this.userData
  }

  clearAuth() {
    this.setAccessToken(null)
    this.setUserData(null)
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

    try {
      const response = await fetch(url, config)

      // Handle 401 - try to refresh token
      if (response.status === 401 && !endpoint.includes('/auth')) {
        const refreshed = await this.refreshToken()
        if (refreshed) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`
          const retryResponse = await fetch(url, { ...config, headers })
          return this.handleResponse<T>(retryResponse)
        }
      }

      return this.handleResponse<T>(response)
    } catch (error) {
      console.error('HTTP Client Error:', error)
      throw error
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }))
      throw new Error(error.message || 'Request failed')
    }

    const data = await response.json()

    // API returns { data: ..., message: ... } for wrapped responses
    // But PaginatedResponse already has 'data' field, so we need to check
    // if it's a wrapper (has 'message' field) or the actual data
    if (data && 'data' in data && 'message' in data) {
      // This is a wrapped response: { data: ..., message: ... }
      return data.data as T
    }

    // Return as-is if it's already the expected type (e.g., PaginatedResponse)
    return data as T
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send refresh token cookie
      })

      if (response.ok) {
        const data = await response.json()
        // Use setAccessToken to also update localStorage
        this.setAccessToken(data.accessToken || data.data?.accessToken)
        return true
      }

      this.setAccessToken(null)
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.setAccessToken(null)
      return false
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
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

export type { HttpClient }
