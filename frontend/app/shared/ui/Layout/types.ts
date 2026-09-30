/**
 * Layout Component Types
 */

export interface ContainerProps {
  /**
   * Максимальная ширина
   * @default 'lg'
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'

  /**
   * Padding
   * @default true
   */
  padding?: boolean
}

export interface HeaderProps {
  /**
   * Заголовок
   */
  title?: string
}

export interface SectionProps {
  /**
   * Заголовок секции
   */
  title?: string

  /**
   * Padding
   * @default 'md'
   */
  padding?: 'sm' | 'md' | 'lg'
}
