import type { Grade, GradeType } from '~/entities/grade'
import type { Group } from '~/entities/group'
import type { Student } from '~/entities/student'
import { useHttpClient } from '~/shared/api/httpClient'

export interface CreateGradeDto {
  studentId: number
  subjectId: number
  gradeValue: number
  gradeType: GradeType
  examDate?: string
  notes?: string
}

export interface GradeBatchDto {
  studentId: number
  subjectId: number
  gradeValue: number
  gradeType: GradeType
  examDate?: string
  notes?: string
}

export interface GradeBatchResult {
  total: number
  succeeded: number
  failed: number
  errors: { index: number; reason: string }[]
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
   * Get groups assigned to a specific subject via SubjectGroup table
   * Uses new backend endpoint
   */
  async fetchGroupsBySubject(subjectId: number): Promise<Group[]> {
    const httpClient = useHttpClient()
    return httpClient.get<Group[]>(`/grades/subject/${subjectId}/groups`)
  },

  /**
   * Get students by group and subject with their grades
   * Uses new backend endpoint
   */
  async fetchStudentsByGroupAndSubject(groupId: number, subjectId: number): Promise<Student[]> {
    const httpClient = useHttpClient()
    return httpClient.get<Student[]>(`/grades/subject/${subjectId}/group/${groupId}/students`)
  },

  /**
   * Create or update multiple grades in one request (upsert by student + subject + type)
   */
  async createBatchGrades(grades: GradeBatchDto[]): Promise<GradeBatchResult> {
    const httpClient = useHttpClient()
    return httpClient.post<GradeBatchResult>('/grades/batch', { grades })
  },
}
