import type { User } from '../../user/model/types'
import type { Group } from '../../group/model/types'
import type { Specialization } from '../../specialization/model/types'
import type { Grade } from '../../grade/model/types'

export interface Student {
  id: number
  userId: number
  firstName: string
  lastName: string
  middleName?: string | null
  studentId: string // Номер зачетной книжки
  groupId?: number | null
  group?: Group | null
  course: number
  specializationId?: number | null
  specialization?: Specialization | null
  enrollmentYear: number
  phone?: string | null
  address?: string | null
  birthDate?: string | null
  createdAt: string
  updatedAt: string
  user?: User
  grades?: Grade[]
}
