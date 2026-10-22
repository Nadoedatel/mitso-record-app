import type { Grade } from '~/entities/grade'
import type { Group } from '~/entities/group'
import type { Student } from '~/entities/student'
import { payload, useApiClient } from '~/shared/api/apiClient'
import type { ApiSchemas } from '~/shared/api/generated'

export type CreateGradeDto = ApiSchemas['CreateGradeDto']
export type GradeBatchDto = ApiSchemas['BatchCreateGradeDto']['grades'][number]
export type GradeBatchResult = Pick<ApiSchemas['GradeBatchResultResponseDto'], 'total' | 'succeeded' | 'failed' | 'errors'>

export const gradesApi = {
  /**
   * Fetch grades for a specific student
   */
  async fetchGradesForStudent(studentId: number): Promise<Grade[]> {
    const api = useApiClient()
    return payload(await api.GET('/api/grades/student/{id}', { params: { path: { id: studentId } } }))
  },

  /**
   * Fetch all grades with optional filters
   */
  async fetchGrades(filters?: {
    studentId?: number
    subjectId?: number
  }): Promise<Grade[]> {
    const api = useApiClient()
    const page = payload(
      await api.GET('/api/grades', {
        params: { query: { studentId: filters?.studentId || undefined, subjectId: filters?.subjectId || undefined } },
      }),
    )
    return page.data
  },

  /**
   * Create a new grade
   */
  async createGrade(data: CreateGradeDto): Promise<Grade> {
    const api = useApiClient()
    return payload(await api.POST('/api/grades', { body: data }))
  },

  /**
   * Update an existing grade
   */
  async updateGrade(id: number, data: Partial<CreateGradeDto>): Promise<Grade> {
    const api = useApiClient()
    return payload(await api.PATCH('/api/grades/{id}', { params: { path: { id } }, body: data }))
  },

  /**
   * Delete a grade
   */
  async deleteGrade(id: number): Promise<void> {
    const api = useApiClient()
    await api.DELETE('/api/grades/{id}', { params: { path: { id } } })
  },

  /**
   * Get groups assigned to a specific subject via SubjectGroup table
   */
  async fetchGroupsBySubject(subjectId: number): Promise<Group[]> {
    const api = useApiClient()
    return payload(await api.GET('/api/grades/subject/{subjectId}/groups', { params: { path: { subjectId } } }))
  },

  /**
   * Get students by group and subject with their grades
   */
  async fetchStudentsByGroupAndSubject(groupId: number, subjectId: number): Promise<Student[]> {
    const api = useApiClient()
    return payload(
      await api.GET('/api/grades/subject/{subjectId}/group/{groupId}/students', {
        params: { path: { subjectId, groupId } },
      }),
    )
  },

  /**
   * Create or update multiple grades in one request (upsert by student + subject + type)
   */
  async createBatchGrades(grades: GradeBatchDto[]): Promise<GradeBatchResult> {
    const api = useApiClient()
    const { total, succeeded, failed, errors } = payload(await api.POST('/api/grades/batch', { body: { grades } }))
    return { total, succeeded, failed, errors }
  },
}
