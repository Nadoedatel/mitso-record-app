/**
 * Dropdown Component Types
 */

import type { IconName } from '../Icon/icons'

/** Side of the trigger the menu opens to, and which edges line up */
export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'

export interface DropdownProps {
  /**
   * Где открывается меню
   * @default 'bottom-end'
   */
  placement?: DropdownPlacement

  /** Accessible name of the trigger when its content is only an icon */
  label?: string

  /**
   * Кнопка и меню на всю ширину родителя
   * @default false
   */
  block?: boolean
}

export interface DropdownItemProps {
  icon?: IconName

  /**
   * Вариант пункта
   * @default 'default'
   */
  variant?: 'default' | 'danger'

  /** Set for one of several options (theme and the like): the item becomes a radio item with a check mark */
  checked?: boolean
}

export interface DropdownItemEmits {
  (e: 'select'): void
}

export interface DropdownGroupProps {
  /** Visible caption of the group, also its accessible name */
  label: string
}
