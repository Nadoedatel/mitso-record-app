import type { Student } from '~/entities/student'
import { payload, useApiClient } from '~/shared/api/apiClient'
import type { ApiSchemas } from '~/shared/api/generated'
import type { PaginatedResponse } from '~/shared/api/types'

export type { PaginatedResponse }
export type CreateStudentDto = ApiSchemas['CreateStudentDto']
export type UpdateStudentDto = ApiSchemas['UpdateStudentDto']

export interface StudentsQuery {
  search?: string
  groupId?: number
  page?: number
  limit?: number
}

export const studentsApi = {
  /**
   * Fetch all students with optional search and pagination
   */
  async fetchStudents(query?: StudentsQuery, signal?: AbortSignal): Promise<PaginatedResponse<Student>> {
    const api = useApiClient()
    return payload(
      await api.GET('/api/students', {
        params: {
          query: {
            search: query?.search || undefined,
            groupId: query?.groupId || undefined,
            page: query?.page || undefined,
            limit: query?.limit || undefined,
          },
        },
        signal,
      }),
    )
  },

  /**
   * Fetch student by ID
   */
  async fetchStudentById(id: number): Promise<Student> {
    const api = useApiClient()
    return payload(await api.GET('/api/students/{id}', { params: { path: { id } } }))
  },

  /**
   * Create a new student
   */
  async createStudent(studentData: CreateStudentDto): Promise<Student> {
    const api = useApiClient()
    return payload(await api.POST('/api/students', { body: studentData }))
  },

  /**
   * Update student by ID
   */
  async updateStudent(id: number, studentData: UpdateStudentDto): Promise<Student> {
    const api = useApiClient()
    return payload(await api.PATCH('/api/students/{id}', { params: { path: { id } }, body: studentData }))
  },

  /**
   * Delete student by ID
   */
  async deleteStudent(id: number): Promise<void> {
    const api = useApiClient()
    await api.DELETE('/api/students/{id}', { params: { path: { id } } })
  },
}
