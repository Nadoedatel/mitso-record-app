/**
 * Input Component Types
 */

export type InputSize =
  | 'sm'   // Маленький инпут (6px 10px)
  | 'md'   // Средний инпут (10px 15px) - по умолчанию
  | 'lg'   // Большой инпут (14px 18px)

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'url'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'search'

export interface BaseInputProps {
  /**
   * Значение инпута
   */
  modelValue?: string | number | null

  /**
   * Placeholder
   */
  placeholder?: string

  /**
   * Тип инпута
   * @default 'text'
   */
  type?: InputType

  /**
   * Размер инпута
   * @default 'md'
   */
  size?: InputSize

  /**
   * Отключенное состояние
   * @default false
   */
  disabled?: boolean

  /**
   * Только для чтения
   * @default false
   */
  readonly?: boolean

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
   * Минимальная длина (браузер подсветит форму при отправке)
   */
  minlength?: number

  /**
   * Максимальная длина
   */
  maxlength?: number

  /**
   * Автофокус
   * @default false
   */
  autofocus?: boolean

  /**
   * Инпут на всю ширину
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

export interface InputProps extends BaseInputProps {
  /**
   * Иконка слева
   */
  iconLeft?: string

  /**
   * Иконка справа
   */
  iconRight?: string
}

export interface SearchInputProps extends BaseInputProps {
  /**
   * Показать кнопку очистки
   * @default true
   */
  clearable?: boolean

  /**
   * Задержка перед emit update (debounce)
   * @default 0
   */
  debounce?: number
}

export interface NumberInputProps extends Omit<BaseInputProps, 'type'> {
  /**
   * Минимальное значение
   */
  min?: number

  /**
   * Максимальное значение
   */
  max?: number

  /**
   * Шаг изменения
   * @default 1
   */
  step?: number

  /**
   * Показать кнопки +/-
   * @default false
   */
  showControls?: boolean
}

export interface InputEmits {
  (e: 'update:modelValue', value: string | number | null): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'input', event: Event): void
  (e: 'change', event: Event): void
  (e: 'keydown', event: KeyboardEvent): void
  (e: 'keyup', event: KeyboardEvent): void
  (e: 'clear'): void
}
