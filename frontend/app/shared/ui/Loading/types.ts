import type { IconName } from '../Icon'

/**
 * Loading Component Types
 */

export type LoadingSize = 'sm' | 'md' | 'lg'

export interface LoadingSpinnerProps {
  /**
   * Размер
   * @default 'md'
   */
  size?: LoadingSize
}

export interface LoadingStateProps {
  /**
   * Сообщение при загрузке
   * @default 'Загрузка...'
   */
  message?: string

  /**
   * Размер спиннера
   * @default 'md'
   */
  size?: LoadingSize
}

export interface EmptyStateProps {
  /**
   * Сообщение
   * @default 'Нет данных'
   */
  message?: string

  /**
   * Описание
   */
  description?: string

  /**
   * Иконка над текстом
   * @default 'inbox'
   */
  icon?: IconName
}
