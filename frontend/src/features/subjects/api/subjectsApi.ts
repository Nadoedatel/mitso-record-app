import type { Subject } from '~/entities/subject'
import { useHttpClient } from '~/shared/api/httpClient'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateSubjectDto {
  name: string
  code: string
  credits: number
  semester: number
  description?: string
  teacherId?: number
}

export interface UpdateSubjectDto {
  name?: string
  code?: string
  credits?: number
  semester?: number
  description?: string
  teacherId?: number
}

export const subjectsApi = {
  /**
   * Fetch all subjects with optional filters
   */
  async fetchSubjects(filters?: {
    teacherId?: number
    semester?: number
    page?: number
    limit?: number
    search?: string
  }): Promise<PaginatedResponse<Subject>> {
    const httpClient = useHttpClient()
    const params = new URLSearchParams()

    if (filters?.teacherId) {
      params.append('teacherId', filters.teacherId.toString())
    }
    if (filters?.semester) {
      params.append('semester', filters.semester.toString())
    }
    if (filters?.page) {
      params.append('page', filters.page.toString())
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString())
    }
    if (filters?.search) {
      params.append('search', filters.search)
    }

    const query = params.toString() ? `?${params.toString()}` : ''
    return httpClient.get<PaginatedResponse<Subject>>(`/subjects${query}`)
  },

  /**
   * Fetch subject by ID
   */
  async fetchSubjectById(id: number): Promise<Subject> {
    const httpClient = useHttpClient()
    return httpClient.get<Subject>(`/subjects/${id}`)
  },

  /**
   * Create a new subject
   */
  async createSubject(subjectData: CreateSubjectDto): Promise<Subject> {
    const httpClient = useHttpClient()
    return httpClient.post<Subject>('/subjects', subjectData)
  },

  /**
   * Update subject by ID
   */
  async updateSubject(id: number, subjectData: UpdateSubjectDto): Promise<Subject> {
    const httpClient = useHttpClient()
    return httpClient.patch<Subject>(`/subjects/${id}`, subjectData)
  },

  /**
   * Delete subject by ID
   */
  async deleteSubject(id: number): Promise<void> {
    const httpClient = useHttpClient()
    await httpClient.delete(`/subjects/${id}`)
  },

  /**
   * Assign groups to subject
   */
  async assignGroups(subjectId: number, groupIds: number[]): Promise<void> {
    const httpClient = useHttpClient()
    await httpClient.post(`/subjects/${subjectId}/groups`, { groupIds })
  },

  /**
   * Get teachers for a subject
   */
  async getSubjectTeachers(subjectId: number): Promise<any[]> {
    const httpClient = useHttpClient()
    return httpClient.get<any[]>(`/subjects/${subjectId}/teachers`)
  },

  /**
   * Assign teachers to subject (replaces all existing)
   */
  async assignTeachers(subjectId: number, teacherIds: number[]): Promise<void> {
    const httpClient = useHttpClient()
    await httpClient.post(`/subjects/${subjectId}/teachers`, { teacherIds })
  },
}
