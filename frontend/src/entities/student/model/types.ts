import type { User } from '../../user/model/types'

export interface Student {
  id: number
  userId: number
  firstName: string
  lastName: string
  middleName?: string
  studentId: string // Номер зачетной книжки
  group: string
  course: number
  faculty: string
  specialization: string
  enrollmentYear: number
  phone?: string
  address?: string
  birthDate?: string
  createdAt: string
  updatedAt: string
  user?: User
}
