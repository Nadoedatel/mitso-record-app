/**
 * Form Component Types
 */

export interface FormProps {
  /**
   * Класс для формы
   */
  class?: string
}

export interface FormFieldProps {
  /**
   * Метка поля
   */
  label?: string

  /**
   * ID для связи label и input
   */
  htmlFor?: string

  /**
   * Обязательное поле
   * @default false
   */
  required?: boolean

  /**
   * Текст ошибки
   */
  error?: string

  /**
   * Текст подсказки
   */
  hint?: string
}

export interface FormRowProps {
  /**
   * Количество колонок
   * @default 2
   */
  columns?: number

  /**
   * Gap между колонками
   * @default 'md'
   */
  gap?: 'sm' | 'md' | 'lg'
}

export interface FormEmits {
  (e: 'submit', event: Event): void
}
