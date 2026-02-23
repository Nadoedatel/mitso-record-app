import type { User } from '../../user/model/types'
import type { Group } from '../../group/model/types'
import type { Specialization } from '../../specialization/model/types'

export interface Student {
  id: number
  userId: number
  firstName: string
  lastName: string
  middleName?: string
  studentId: string // Номер зачетной книжки
  groupId?: number
  group?: Group
  course: number
  specializationId?: number
  specialization?: Specialization
  enrollmentYear: number
  phone?: string
  address?: string
  birthDate?: string
  createdAt: string
  updatedAt: string
  user?: User
}
