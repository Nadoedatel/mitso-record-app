/**
 * Breadcrumbs Component Types
 */

export interface BreadcrumbItem {
  label: string
  /** Link of the step; the last item (the current page) has none */
  to?: string
}

export interface BreadcrumbsProps {
  /** From the section down to the current page */
  items: BreadcrumbItem[]
}
