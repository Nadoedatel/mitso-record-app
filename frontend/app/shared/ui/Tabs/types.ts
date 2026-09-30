/**
 * Tabs Component Types
 */

export interface Tab {
  key: string
  label: string
  disabled?: boolean
}

export interface TabsProps {
  /**
   * Список вкладок
   */
  tabs: Tab[]

  /**
   * Активная вкладка
   */
  modelValue: string
}

export interface TabsEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}
