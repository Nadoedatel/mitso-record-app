import type { User } from '~/entities/user'
import { useHttpClient } from '~/shared/api/httpClient'

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  password: string
  role?: 'STUDENT' | 'TEACHER'
}

export interface AuthResponse {
  user: User
  accessToken: string
  // refreshToken is now in httpOnly cookie, not in response body
}

export interface RefreshResponse {
  accessToken: string
  // refreshToken is now in httpOnly cookie, not in response body
}

export const authApi = {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const httpClient = useHttpClient()
    return httpClient.post<AuthResponse>('/auth/login', credentials)
  },

  async register(data: RegisterDto): Promise<AuthResponse> {
    const httpClient = useHttpClient()
    return httpClient.post<AuthResponse>('/auth/register', data)
  },

  async refresh(): Promise<RefreshResponse> {
    const httpClient = useHttpClient()
    // refreshToken is automatically sent via httpOnly cookie
    return httpClient.post<RefreshResponse>('/auth/refresh')
  },

  async getMe(): Promise<User> {
    const httpClient = useHttpClient()
    return httpClient.get<User>('/auth/me')
  },

  async logout(): Promise<void> {
    const httpClient = useHttpClient()
    return httpClient.post<void>('/auth/logout')
  },
}
