import type { User } from '~/entities/user'
import { useHttpClient } from '~/shared/api/httpClient'

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  // refreshToken is in httpOnly cookie, not in response body
}

export const authApi = {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const httpClient = useHttpClient()
    return httpClient.post<AuthResponse>('/auth/login', credentials)
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
