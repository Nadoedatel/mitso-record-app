/**
 * Modal Component Types
 */

export interface ModalProps {
  /**
   * Показать/скрыть модальное окно
   */
  modelValue: boolean

  /**
   * Заголовок модального окна
   */
  title?: string

  /**
   * Ширина модального окна
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'

  /**
   * Закрывать при клике на overlay
   * @default true
   */
  closeOnOverlayClick?: boolean

  /**
   * Показывать кнопку закрытия
   * @default true
   */
  showClose?: boolean
}

export interface ModalEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}

export interface ModalHeaderProps {
  /**
   * id заголовка: Modal ссылается на него через aria-labelledby
   */
  titleId?: string

  /**
   * Заголовок
   */
  title?: string

  /**
   * Показывать кнопку закрытия
   * @default true
   */
  showClose?: boolean
}

export interface ModalHeaderEmits {
  (e: 'close'): void
}

export interface ModalActionsProps {
  /**
   * Выравнивание кнопок
   * @default 'end'
   */
  align?: 'start' | 'center' | 'end' | 'between'
}
