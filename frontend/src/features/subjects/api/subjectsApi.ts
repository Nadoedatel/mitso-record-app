import type { Subject } from '~/entities/subject'
import { useHttpClient } from '~/shared/api/httpClient'

export const subjectsApi = {
  /**
   * Fetch all subjects with optional filters
   */
  async fetchSubjects(filters?: {
    teacherId?: number
    semester?: number
  }): Promise<Subject[]> {
    const httpClient = useHttpClient()
    const params = new URLSearchParams()

    if (filters?.teacherId) {
      params.append('teacherId', filters.teacherId.toString())
    }
    if (filters?.semester) {
      params.append('semester', filters.semester.toString())
    }

    const query = params.toString() ? `?${params.toString()}` : ''
    return httpClient.get<Subject[]>(`/subjects${query}`)
  },

  /**
   * Fetch subject by ID
   */
  async fetchSubjectById(id: number): Promise<Subject> {
    const httpClient = useHttpClient()
    return httpClient.get<Subject>(`/subjects/${id}`)
  },
}
