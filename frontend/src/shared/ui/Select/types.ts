/**
 * Select Component Types
 */

export interface SelectOption<T = string | number> {
  label: string
  value: T
  disabled?: boolean
}

export type SelectSize = 'sm' | 'md' | 'lg'

export interface SelectProps<T = string | number> {
  /**
   * Значение select
   */
  modelValue?: T | null

  /**
   * Опции выбора
   */
  options: SelectOption<T>[]

  /**
   * Placeholder
   * @default 'Выберите...'
   */
  placeholder?: string

  /**
   * Размер select
   * @default 'md'
   */
  size?: SelectSize

  /**
   * Отключенное состояние
   * @default false
   */
  disabled?: boolean

  /**
   * Обязательное поле
   * @default false
   */
  required?: boolean

  /**
   * Состояние ошибки
   * @default false
   */
  error?: boolean

  /**
   * Текст ошибки
   */
  errorMessage?: string

  /**
   * Select на всю ширину
   * @default false
   */
  fullWidth?: boolean

  /**
   * Имя поля для формы
   */
  name?: string

  /**
   * ID элемента
   */
  id?: string
}

export interface SelectEmits<T = string | number> {
  (e: 'update:modelValue', value: T | null): void
  (e: 'change', value: T | null): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}
