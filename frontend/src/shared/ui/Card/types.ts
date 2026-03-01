/**
 * Card Component Types
 */

export interface CardProps {
  /**
   * Вариант отображения карточки
   * @default 'default'
   */
  variant?: 'default' | 'bordered' | 'elevated'

  /**
   * Размер padding
   * @default 'md'
   */
  padding?: 'sm' | 'md' | 'lg'

  /**
   * Hover эффект
   * @default false
   */
  hoverable?: boolean

  /**
   * Кликабельность
   * @default false
   */
  clickable?: boolean
}

export interface CardEmits {
  (e: 'click', event: MouseEvent): void
}

export interface InfoCardProps {
  /**
   * Заголовок карточки
   */
  title?: string

  /**
   * Данные для отображения (ключ-значение)
   */
  items: Array<{
    label: string
    value: string | number
  }>

  /**
   * Размер padding
   * @default 'md'
   */
  padding?: 'sm' | 'md' | 'lg'
}
