/**
 * Badge Component Types
 */

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'

export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps {
  /**
   * Вариант отображения
   * @default 'primary'
   */
  variant?: BadgeVariant

  /**
   * Размер
   * @default 'md'
   */
  size?: BadgeSize

  /**
   * Pill стиль (закругленный)
   * @default false
   */
  pill?: boolean

  /**
   * Outlined стиль
   * @default false
   */
  outlined?: boolean
}

export type GradeType = 'EXAM' | 'CREDIT' | 'DIFFERENTIAL_CREDIT' | 'COURSEWORK' | 'TEST' | 'LAB'

export type GradeValue =
  | 'ОТЛИЧНО'
  | 'ХОРОШО'
  | 'УДОВЛЕТВОРИТЕЛЬНО'
  | 'НЕУДОВЛЕТВОРИТЕЛЬНО'
  | 'ЗАЧТЕНО'
  | 'НЕ_ЗАЧТЕНО'
  | number

export interface GradeTypeBadgeProps {
  /**
   * Тип оценки
   */
  type: GradeType

  /**
   * Размер
   * @default 'sm'
   */
  size?: BadgeSize
}

export interface GradeValueBadgeProps {
  /**
   * Значение оценки
   */
  value: GradeValue

  /**
   * Тип оценки: для CREDIT значение 1/0 показывается как «Зачёт» / «Не зачёт»
   */
  type?: GradeType

  /**
   * Размер
   * @default 'sm'
   */
  size?: BadgeSize
}
