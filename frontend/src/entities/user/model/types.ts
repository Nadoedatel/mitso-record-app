import type { Student } from '~/entities/student'
import type { Teacher } from '~/entities/teacher'

export enum Role {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: number
  email: string
  role: Role
  student?: Student | null
  teacher?: Teacher | null
}
