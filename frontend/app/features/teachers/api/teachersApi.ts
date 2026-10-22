import type { Subject } from '~/entities/subject'
import type { Teacher } from '~/entities/teacher'
import { payload, useApiClient } from '~/shared/api/apiClient'
import type { ApiSchemas } from '~/shared/api/generated'
import type { PaginatedResponse } from '~/shared/api/types'

export type { PaginatedResponse }
export type CreateTeacherDto = ApiSchemas['CreateTeacherDto']
export type UpdateTeacherDto = ApiSchemas['UpdateTeacherDto']

export interface TeachersQuery {
  search?: string
  page?: number
  limit?: number
}

export const teachersApi = {
  /**
   * Fetch all teachers with optional search and pagination
   */
  async fetchTeachers(query?: TeachersQuery, signal?: AbortSignal): Promise<PaginatedResponse<Teacher>> {
    const api = useApiClient()
    return payload(
      await api.GET('/api/teachers', {
        params: {
          query: { search: query?.search || undefined, page: query?.page || undefined, limit: query?.limit || undefined },
        },
        signal,
      }),
    )
  },

  /**
   * Fetch teacher by ID
   */
  async fetchTeacherById(id: number): Promise<Teacher> {
    const api = useApiClient()
    return payload(await api.GET('/api/teachers/{id}', { params: { path: { id } } }))
  },

  /**
   * Create a new teacher
   */
  async createTeacher(teacherData: CreateTeacherDto): Promise<Teacher> {
    const api = useApiClient()
    return payload(await api.POST('/api/teachers', { body: teacherData }))
  },

  /**
   * Update teacher by ID
   */
  async updateTeacher(id: number, teacherData: UpdateTeacherDto): Promise<Teacher> {
    const api = useApiClient()
    return payload(await api.PATCH('/api/teachers/{id}', { params: { path: { id } }, body: teacherData }))
  },

  /**
   * Delete teacher by ID
   */
  async deleteTeacher(id: number): Promise<void> {
    const api = useApiClient()
    await api.DELETE('/api/teachers/{id}', { params: { path: { id } } })
  },

  /**
   * Get subjects for a teacher
   */
  async getTeacherSubjects(teacherId: number): Promise<Subject[]> {
    const api = useApiClient()
    return payload(await api.GET('/api/teachers/{id}/subjects', { params: { path: { id: teacherId } } }))
  },

  /**
   * Assign subjects to teacher (replaces all existing)
   */
  async assignSubjects(teacherId: number, subjectIds: number[]): Promise<void> {
    const api = useApiClient()
    await api.POST('/api/teachers/{id}/subjects', { params: { path: { id: teacherId } }, body: { subjectIds } })
  },
}
