/**
 * Table Component Types
 */

export interface TableColumn<T = Record<string, unknown>> {
  /**
   * Ключ поля в данных
   */
  key: keyof T | string

  /**
   * Заголовок колонки
   */
  label: string

  /**
   * Ширина колонки
   */
  width?: string

  /**
   * Выравнивание содержимого
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right'

  /**
   * Функция для форматирования значения
   */
  formatter?: (value: T[keyof T], row: T) => string

  /**
   * Сортировка по клику на заголовок (по значению поля `key`, не по отформатированному тексту)
   * @default false
   */
  sortable?: boolean
}

export interface TableProps<T = Record<string, unknown>> {
  /**
   * Колонки таблицы
   */
  columns: TableColumn<T>[]

  /**
   * Данные таблицы
   */
  data: T[]

  /**
   * Поле с уникальным ключом строки (по умолчанию индекс)
   */
  rowKey?: keyof T

  /**
   * Показывать полосы
   * @default false
   */
  striped?: boolean

  /**
   * Hover эффект на строках
   * @default true
   */
  hoverable?: boolean

  /**
   * Bordered таблица
   * @default true
   */
  bordered?: boolean

  /**
   * Загрузка
   * @default false
   */
  loading?: boolean

  /**
   * Пустое состояние
   */
  emptyText?: string

  /**
   * Строка кликабельна: курсор, фокус с клавиатуры и Enter вызывают rowClick
   * @default false
   */
  clickable?: boolean

  /**
   * На узком экране (до 640px): карточки вместо таблицы ('cards') или прокрутка вбок ('scroll')
   * @default 'cards'
   */
  mobile?: 'cards' | 'scroll'

  /**
   * Высота, после которой таблица прокручивается внутри себя, а шапка остаётся на месте (например '420px')
   */
  maxHeight?: string

  /**
   * Сортировку делает сервер: таблица только показывает стрелки и вызывает sort, данные не переставляет
   * @default false
   */
  manualSort?: boolean

  /**
   * Подпись таблицы для скринридеров (на экране не видна)
   */
  caption?: string
}

export interface TableEmits<T = Record<string, unknown>> {
  (e: 'rowClick', row: T, index: number): void
  /** null = сортировка снята */
  (e: 'sort', state: { key: string; direction: 'asc' | 'desc' } | null): void
}

export interface TableRowProps {
  /**
   * Кликабельность строки
   * @default false
   */
  clickable?: boolean

  /**
   * Hover эффект
   * @default false
   */
  hoverable?: boolean

  /**
   * Полосатость
   * @default false
   */
  striped?: boolean

  /**
   * Индекс строки (для striped)
   */
  index?: number
}

export interface TableRowEmits {
  (e: 'click', event: MouseEvent): void
}

export interface TableCellProps {
  /**
   * Выравнивание
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right'

  /**
   * Ширина
   */
  width?: string
}
