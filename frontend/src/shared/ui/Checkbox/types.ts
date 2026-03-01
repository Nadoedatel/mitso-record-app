/**
 * Checkbox Component Types
 */

export interface CheckboxProps {
  /**
   * v-model значение
   */
  modelValue: boolean

  /**
   * Label текст
   */
  label?: string

  /**
   * Disabled состояние
   * @default false
   */
  disabled?: boolean

  /**
   * ID для связи с label
   */
  id?: string
}

export interface CheckboxEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}
