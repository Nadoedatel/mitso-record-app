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
  /** Role values as the API sends them (plain strings; `Role.ADMIN` etc. are assignable) */
  role: `${Role}`
  /** Second login factor is on (the profile from /auth/me only) */
  twoFactorEnabled?: boolean
  student?: Student | null
  teacher?: Teacher | null
}
