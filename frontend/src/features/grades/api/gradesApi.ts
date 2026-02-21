import type { Grade } from '~/entities/grade'
import { useHttpClient } from '~/shared/api/httpClient'

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
    return httpClient.get<Grade[]>(`/grades${query}`)
  },
}
