import type { User } from '../../user/model/types'

export interface Teacher {
  id: number
  userId: number
  firstName: string
  lastName: string
  middleName?: string
  department: string
  position: string
  academicDegree?: string
  phone?: string
  officeNumber?: string
  createdAt: string
  updatedAt: string
  user?: User
}
