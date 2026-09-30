/** Paginated list response of the backend (`PaginatedResponse` in backend/src/common/dto) */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
