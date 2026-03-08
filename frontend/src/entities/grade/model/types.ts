import type { Student } from '../../student/model/types'
import type { Subject } from '../../subject/model/types'
import type { Teacher } from '../../teacher/model/types'

export enum GradeType {
  EXAM = 'EXAM',
  CREDIT = 'CREDIT',
  COURSEWORK = 'COURSEWORK',
  TEST = 'TEST',
  LAB = 'LAB',
}

export interface Grade {
  id: number
  studentId: number
  subjectId: number
  teacherId?: number | null
  gradeValue: number // 0-100
  gradeType: GradeType
  examDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  student?: Student
  subject?: Subject
  teacher?: Teacher | null
}
