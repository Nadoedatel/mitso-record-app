/** Same limits as `changePasswordSchema` on the backend */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

export interface PasswordChangeErrors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

/**
 * Checks the password change form before the request, so the usual mistakes show under their fields
 * (in Russian: the backend's zod messages for the limits are English). Whether the current password is right
 * only the backend knows.
 */
export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): PasswordChangeErrors {
  const errors: PasswordChangeErrors = {}

  if (currentPassword.length === 0) {
    errors.currentPassword = 'Введите текущий пароль'
  } else if (currentPassword.length > PASSWORD_MAX_LENGTH) {
    errors.currentPassword = `Не длиннее ${PASSWORD_MAX_LENGTH} символов`
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    errors.newPassword = `Не короче ${PASSWORD_MIN_LENGTH} символов`
  } else if (newPassword.length > PASSWORD_MAX_LENGTH) {
    errors.newPassword = `Не длиннее ${PASSWORD_MAX_LENGTH} символов`
  } else if (newPassword === currentPassword) {
    errors.newPassword = 'Новый пароль должен отличаться от текущего'
  }

  if (confirmPassword !== newPassword) {
    errors.confirmPassword = 'Пароли не совпадают'
  }

  return errors
}
