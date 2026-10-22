import type { User } from '../../user/model/types'

export interface Teacher {
  id: number
  userId: number
  firstName: string
  lastName: string
  middleName?: string | null
  department: string
  position: string
  academicDegree?: string | null
  phone?: string | null
  officeNumber?: string | null
  createdAt: string
  updatedAt: string
  user?: User
}
