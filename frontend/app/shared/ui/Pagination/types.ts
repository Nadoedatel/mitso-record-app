/**
 * Pagination Component Types
 */

export interface PaginationProps {
  /**
   * Текущая страница
   */
  currentPage: number

  /**
   * Общее количество страниц
   */
  totalPages: number

  /**
   * Элементов на странице
   * @default 10
   */
  perPage?: number

  /**
   * Всего элементов
   */
  total?: number
}

export interface PaginationEmits {
  (e: 'update:currentPage', page: number): void
  (e: 'change', page: number): void
}
