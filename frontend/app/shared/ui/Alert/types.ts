/**
 * Alert Component Types
 */

export type AlertVariant = 'success' | 'error' | 'warning' | 'info'

export interface AlertProps {
  /**
   * Вариант отображения
   * @default 'info'
   */
  variant?: AlertVariant

  /**
   * Заголовок
   */
  title?: string

  /**
   * Показывать кнопку закрытия
   * @default false
   */
  closable?: boolean
}

export interface AlertEmits {
  (e: 'close'): void
}
