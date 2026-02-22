import type { Grade } from '~/entities/grade'
import { useHttpClient } from '~/shared/api/httpClient'

export interface CreateGradeDto {
  studentId: number
  subjectId: number
  gradeValue: number
  gradeType: 'EXAM' | 'CREDIT' | 'COURSEWORK' | 'LAB' | 'TEST'
  examDate?: string
  notes?: string
}

export interface GradeBatchDto {
  studentId: number
  subjectId: number
  gradeValue: number
  gradeType: 'EXAM' | 'CREDIT' | 'COURSEWORK' | 'LAB' | 'TEST'
  examDate?: string
  notes?: string
}

export interface GroupInfo {
  group: string
  studentCount: number
}

export interface StudentWithGrades {
  id: number
  firstName: string
  lastName: string
  middleName?: string
  group: string
  studentId: string
  grades?: Grade[]
}

export const gradesApi = {
  /**
   * Fetch grades for a specific student
   */
  async fetchGradesForStudent(studentId: number): Promise<Grade[]> {
    const httpClient = useHttpClient()
    return httpClient.get<Grade[]>(`/grades/student/${studentId}`)
  },

  /**
   * Fetch all grades with optional filters
   */
  async fetchGrades(filters?: {
    studentId?: number
    subjectId?: number
  }): Promise<Grade[]> {
    const httpClient = useHttpClient()
    const params = new URLSearchParams()

    if (filters?.studentId) {
      params.append('studentId', filters.studentId.toString())
    }
    if (filters?.subjectId) {
      params.append('subjectId', filters.subjectId.toString())
    }

    const query = params.toString() ? `?${params.toString()}` : ''
    const res = await httpClient.get<{ data: Grade[]; total: number; page: number; limit: number; totalPages: number }>(
        `/grades${query}`,
    )

    return res.data // <-- тут именно массив оценок
  },

  /**
   * Create a new grade
   */
  async createGrade(data: CreateGradeDto): Promise<Grade> {
    const httpClient = useHttpClient()
    return httpClient.post<Grade>('/grades', data)
  },

  /**
   * Update an existing grade
   */
  async updateGrade(id: number, data: Partial<CreateGradeDto>): Promise<Grade> {
    const httpClient = useHttpClient()
    return httpClient.patch<Grade>(`/grades/${id}`, data)
  },

  /**
   * Delete a grade
   */
  async deleteGrade(id: number): Promise<void> {
    const httpClient = useHttpClient()
    return httpClient.delete<void>(`/grades/${id}`)
  },

  /**
   * Get unique groups for a specific subject
   * Fetches all students and filters by those who have grades in this subject
   */
  async fetchGroupsBySubject(subjectId: number): Promise<GroupInfo[]> {
    const httpClient = useHttpClient()

    // Fetch all grades for this subject
    const gradesResponse = await httpClient.get<{ data: Grade[] }>(`/grades?subjectId=${subjectId}`)

    // Get unique student IDs
    const studentIds = [...new Set(gradesResponse.data.map(g => g.studentId))]

    // Fetch all students to get their groups
    const studentsResponse = await httpClient.get<{ data: StudentWithGrades[] }>(`/students?limit=1000`)

    // Filter students who have grades in this subject and group them
    const groupMap = new Map<string, Set<number>>()
    studentsResponse.data.forEach((student) => {
      if (studentIds.includes(student.id)) {
        if (!groupMap.has(student.group)) {
          groupMap.set(student.group, new Set())
        }
        groupMap.get(student.group)!.add(student.id)
      }
    })

    return Array.from(groupMap.entries()).map(([group, studentSet]) => ({
      group,
      studentCount: studentSet.size,
    }))
  },

  /**
   * Get students by group with their grades for a specific subject
   */
  async fetchStudentsByGroupAndSubject(group: string, subjectId: number): Promise<StudentWithGrades[]> {
    const httpClient = useHttpClient()

    // Fetch all students and filter by group
    const studentsResponse = await httpClient.get<{ data: StudentWithGrades[] }>(`/students?limit=1000`)
    const groupStudents = studentsResponse.data.filter(s => s.group === group)

    // Fetch grades for each student for this specific subject
    const studentsWithGrades = await Promise.all(
      groupStudents.map(async (student) => {
        try {
          const grades = await httpClient.get<{ data: Grade[] }>(`/grades?studentId=${student.id}&subjectId=${subjectId}`)
          return {
            ...student,
            grades: grades.data,
          }
        } catch {
          return {
            ...student,
            grades: [],
          }
        }
      })
    )

    return studentsWithGrades
  },

  /**
   * Create multiple grades in batch
   */
  async createBatchGrades(grades: GradeBatchDto[]): Promise<Grade[]> {
    const httpClient = useHttpClient()
    const results = await Promise.all(
      grades.map((grade) => httpClient.post<Grade>('/grades', grade))
    )
    return results
  },
}
