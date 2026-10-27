import type { User } from '~/entities/user'
import { payload, useApiClient } from '~/shared/api/apiClient'
import type { ApiSchemas } from '~/shared/api/generated'

export type LoginDto = ApiSchemas['LoginDto']

export interface AuthResponse {
  user: ApiSchemas['LoginResponseDto']['user'] & object
  accessToken: string
  // refreshToken is in httpOnly cookie, not in response body
}

/** Password accepted, but the account has the second factor on: a code is needed (no session yet) */
export interface TwoFactorChallenge {
  twoFactorRequired: true
  challengeToken: string
}

export type LoginResult = AuthResponse | TwoFactorChallenge

export type TwoFactorSetup = ApiSchemas['TwoFactorSetupResponseDto']

/** The spec types both login outcomes as one object with optional fields; this tells them apart once, here */
function toLoginResult(body: ApiSchemas['LoginResponseDto']): LoginResult {
  if (body.twoFactorRequired && body.challengeToken) {
    return { twoFactorRequired: true, challengeToken: body.challengeToken }
  }
  if (body.user && body.accessToken) return { user: body.user, accessToken: body.accessToken }
  throw new Error('Неожиданный ответ сервера при входе')
}

export const authApi = {
  async login(credentials: LoginDto): Promise<LoginResult> {
    const api = useApiClient()
    return toLoginResult(payload(await api.POST('/api/auth/login', { body: credentials })))
  },

  /** Second login step: the challenge from `login` and a code from the app (or a recovery code) */
  async verifyTwoFactor(challengeToken: string, code: string): Promise<AuthResponse> {
    const api = useApiClient()
    const result = toLoginResult(payload(await api.POST('/api/auth/2fa/verify', { body: { challengeToken, code } })))
    if ('twoFactorRequired' in result) throw new Error('Неожиданный ответ сервера при подтверждении')
    return result
  },

  async getMe(): Promise<User> {
    const api = useApiClient()
    return payload(await api.GET('/api/auth/me'))
  },

  async logout(): Promise<void> {
    const api = useApiClient()
    await api.POST('/api/auth/logout')
  },

  /** Change own password; the backend ends every session of the user, this one too */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const api = useApiClient()
    await api.POST('/api/auth/change-password', { body: { currentPassword, newPassword } })
  },

  /** Start enabling the second factor: secret and QR code (ADMIN) */
  async setupTwoFactor(): Promise<TwoFactorSetup> {
    const api = useApiClient()
    return payload(await api.POST('/api/auth/2fa/setup'))
  },

  /** Confirm with the first code; returns the recovery codes, shown only this once */
  async enableTwoFactor(code: string): Promise<string[]> {
    const api = useApiClient()
    return payload(await api.POST('/api/auth/2fa/enable', { body: { code } })).recoveryCodes
  },

  async disableTwoFactor(password: string, code: string): Promise<void> {
    const api = useApiClient()
    await api.POST('/api/auth/2fa/disable', { body: { password, code } })
  },
}
