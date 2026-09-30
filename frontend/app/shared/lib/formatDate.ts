/**
 * Format a date as DD.MM.YYYY (ru-RU). Returns `fallback` for empty values.
 */
export function formatDate(date: Date | string | null | undefined, fallback = '-'): string {
  if (!date) return fallback
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
