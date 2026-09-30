import type { Subject } from '~/entities/subject'
import type { Teacher } from '~/entities/teacher'
import { useHttpClient } from '~/shared/api/httpClient'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface TeachersQuery {
  search?: string
  page?: number
  limit?: number
}

export interface CreateTeacherDto {
  firstName: string
  lastName: string
  middleName?: string
  email: string
  password: string
  department: string
  position: string
  academicDegree?: string
  phone?: string
  officeNumber?: string
}

export interface UpdateTeacherDto {
  firstName?: string
  lastName?: string
  middleName?: string
  email?: string
  department?: string
  position?: string
  academicDegree?: string
  phone?: string
  officeNumber?: string
}

export const teachersApi = {
  /**
   * Fetch all teachers with optional search and pagination
   */
  async fetchTeachers(query?: TeachersQuery, signal?: AbortSignal): Promise<PaginatedResponse<Teacher>> {
    const httpClient = useHttpClient()
    const params = new URLSearchParams()

    if (query?.search) params.append('search', query.search)
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())

    const queryString = params.toString() ? `?${params.toString()}` : ''
    return httpClient.get<PaginatedResponse<Teacher>>(`/teachers${queryString}`, { signal })
  },

  /**
   * Fetch teacher by ID
   */
  async fetchTeacherById(id: number): Promise<Teacher> {
    const httpClient = useHttpClient()
    return httpClient.get<Teacher>(`/teachers/${id}`)
  },

  /**
   * Create a new teacher
   */
  async createTeacher(teacherData: CreateTeacherDto): Promise<Teacher> {
    const httpClient = useHttpClient()
    return httpClient.post<Teacher>('/teachers', teacherData)
  },

  /**
   * Update teacher by ID
   */
  async updateTeacher(id: number, teacherData: UpdateTeacherDto): Promise<Teacher> {
    const httpClient = useHttpClient()
    return httpClient.patch<Teacher>(`/teachers/${id}`, teacherData)
  },

  /**
   * Delete teacher by ID
   */
  async deleteTeacher(id: number): Promise<void> {
    const httpClient = useHttpClient()
    await httpClient.delete(`/teachers/${id}`)
  },

  /**
   * Get subjects for a teacher
   */
  async getTeacherSubjects(teacherId: number): Promise<Subject[]> {
    const httpClient = useHttpClient()
    return httpClient.get<Subject[]>(`/teachers/${teacherId}/subjects`)
  },

  /**
   * Assign subjects to teacher (replaces all existing)
   */
  async assignSubjects(teacherId: number, subjectIds: number[]): Promise<void> {
    const httpClient = useHttpClient()
    await httpClient.post(`/teachers/${teacherId}/subjects`, { subjectIds })
  },
}
