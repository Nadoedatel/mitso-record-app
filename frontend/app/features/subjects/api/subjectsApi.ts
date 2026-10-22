import type { Teacher } from '~/entities/teacher'
import type { Subject } from '~/entities/subject'
import { payload, useApiClient } from '~/shared/api/apiClient'
import type { ApiSchemas } from '~/shared/api/generated'
import type { PaginatedResponse } from '~/shared/api/types'

export type { PaginatedResponse }
export type CreateSubjectDto = ApiSchemas['CreateSubjectDto']
export type UpdateSubjectDto = ApiSchemas['UpdateSubjectDto']

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
  }, signal?: AbortSignal): Promise<PaginatedResponse<Subject>> {
    const api = useApiClient()
    return payload(
      await api.GET('/api/subjects', {
        params: {
          query: {
            teacherId: filters?.teacherId || undefined,
            semester: filters?.semester || undefined,
            page: filters?.page || undefined,
            limit: filters?.limit || undefined,
            search: filters?.search || undefined,
          },
        },
        signal,
      }),
    )
  },

  /**
   * Fetch subject by ID
   */
  async fetchSubjectById(id: number): Promise<Subject> {
    const api = useApiClient()
    return payload(await api.GET('/api/subjects/{id}', { params: { path: { id } } }))
  },

  /**
   * Create a new subject
   */
  async createSubject(subjectData: CreateSubjectDto): Promise<Subject> {
    const api = useApiClient()
    return payload(await api.POST('/api/subjects', { body: subjectData }))
  },

  /**
   * Update subject by ID
   */
  async updateSubject(id: number, subjectData: UpdateSubjectDto): Promise<Subject> {
    const api = useApiClient()
    return payload(await api.PATCH('/api/subjects/{id}', { params: { path: { id } }, body: subjectData }))
  },

  /**
   * Delete subject by ID
   */
  async deleteSubject(id: number): Promise<void> {
    const api = useApiClient()
    await api.DELETE('/api/subjects/{id}', { params: { path: { id } } })
  },

  /**
   * Assign groups to subject
   */
  async assignGroups(subjectId: number, groupIds: number[]): Promise<void> {
    const api = useApiClient()
    await api.POST('/api/subjects/{id}/groups', { params: { path: { id: subjectId } }, body: { groupIds } })
  },

  /**
   * Get teachers for a subject
   */
  async getSubjectTeachers(subjectId: number): Promise<Teacher[]> {
    const api = useApiClient()
    return payload(await api.GET('/api/subjects/{id}/teachers', { params: { path: { id: subjectId } } }))
  },

  /**
   * Assign teachers to subject (replaces all existing)
   */
  async assignTeachers(subjectId: number, teacherIds: number[]): Promise<void> {
    const api = useApiClient()
    await api.POST('/api/subjects/{id}/teachers', { params: { path: { id: subjectId } }, body: { teacherIds } })
  },
}
