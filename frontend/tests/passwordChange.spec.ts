import { describe, expect, it } from 'vitest'
import { validatePasswordChange } from '~/features/auth/model/passwordChange'

describe('password change form', () => {
  it('accepts a new password of 8+ characters, repeated, different from the current one', () => {
    expect(validatePasswordChange('old-password', 'new-password', 'new-password')).toEqual({})
  })

  it('rejects a short or too long new password', () => {
    expect(validatePasswordChange('old', 'short', 'short').newPassword).toBe('Не короче 8 символов')
    const long = 'x'.repeat(129)
    expect(validatePasswordChange('old', long, long).newPassword).toBe('Не длиннее 128 символов')
  })

  it('rejects the current password reused as the new one (the backend refuses it too)', () => {
    expect(validatePasswordChange('same-password', 'same-password', 'same-password').newPassword).toBe(
      'Новый пароль должен отличаться от текущего',
    )
  })

  it('asks for the current password and caps its length like the backend', () => {
    expect(validatePasswordChange('', 'new-password', 'new-password').currentPassword).toBe('Введите текущий пароль')
    expect(validatePasswordChange('x'.repeat(129), 'new-password', 'new-password').currentPassword).toBe(
      'Не длиннее 128 символов',
    )
  })

  it('reports a confirmation that does not match', () => {
    expect(validatePasswordChange('old-password', 'new-password', 'new-passw0rd')).toEqual({
      confirmPassword: 'Пароли не совпадают',
    })
  })
})
