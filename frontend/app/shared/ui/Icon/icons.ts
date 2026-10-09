import {
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  GraduationCap,
  Inbox,
  Info,
  LogOut,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-vue-next'

/**
 * The icons the app uses (Lucide, ISC license). Imported one by one so the bundle only holds these.
 * To add an icon: import it above and give it a name here.
 */
export const icons = {
  book: BookOpen,
  calendar: Calendar,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevrons-up-down': ChevronsUpDown,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  'graduation-cap': GraduationCap,
  inbox: Inbox,
  info: Info,
  'log-out': LogOut,
  moon: Moon,
  pencil: Pencil,
  plus: Plus,
  search: Search,
  sun: Sun,
  trash: Trash2,
  'triangle-alert': TriangleAlert,
  x: X,
} as const

export type IconName = keyof typeof icons
