/**
 * Button Component Types
 */

export type ButtonVariant =
  | 'primary'      // Основная кнопка (фиолетовая/синяя)
  | 'secondary'    // Вторичная кнопка (серая)
  | 'danger'       // Опасное действие (красная)
  | 'success'      // Успешное действие (зеленая)
  | 'ghost'        // Прозрачная кнопка

export type ButtonSize =
  | 'sm'   // Маленькая кнопка (6px 12px)
  | 'md'   // Средняя кнопка (10px 20px) - по умолчанию
  | 'lg'   // Большая кнопка (12px 24px)

export type ButtonType = 'button' | 'submit' | 'reset'

export interface ButtonProps {
  /**
   * Вариант кнопки
   * @default 'primary'
   */
  variant?: ButtonVariant

  /**
   * Размер кнопки
   * @default 'md'
   */
  size?: ButtonSize

  /**
   * Тип кнопки
   * @default 'button'
   */
  type?: ButtonType

  /**
   * Отключенное состояние
   * @default false
   */
  disabled?: boolean

  /**
   * Состояние загрузки
   * @default false
   */
  loading?: boolean

  /**
   * Кнопка на всю ширину
   * @default false
   */
  fullWidth?: boolean

  /**
   * Иконка слева от текста
   */
  iconLeft?: string

  /**
   * Иконка справа от текста
   */
  iconRight?: string
}

export interface ButtonEmits {
  (e: 'click', event: MouseEvent): void
}
