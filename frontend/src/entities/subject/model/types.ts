import type { Teacher } from '../../teacher/model/types'

export interface Subject {
  id: number
  name: string
  code: string
  credits: number
  semester: number
  description?: string
  teacherId: number
  createdAt: string
  updatedAt: string
  teacher?: Teacher
}
