import type { Student } from '~/entities/student'
import { useHttpClient } from '~/shared/api/httpClient'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface StudentsQuery {
  search?: string
  page?: number
  limit?: number
}

export interface CreateStudentDto {
  userId: number
  firstName: string
  lastName: string
  middleName?: string
  studentId: string
  groupId?: number
  course: number
  specializationId?: number
  enrollmentYear: number
  phone?: string
  address?: string
  birthDate?: string
}

export interface UpdateStudentDto {
  firstName?: string
  lastName?: string
  middleName?: string
  groupId?: number
  course?: number
  specializationId?: number
  studentId?: string
  enrollmentYear?: number
  phone?: string
  address?: string
  birthDate?: string
}

export const studentsApi = {
  /**
   * Fetch all students with optional search and pagination
   */
  async fetchStudents(query?: StudentsQuery): Promise<PaginatedResponse<Student>> {
    const httpClient = useHttpClient()
    const params = new URLSearchParams()

    if (query?.search) params.append('search', query.search)
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())

    const queryString = params.toString() ? `?${params.toString()}` : ''
    return httpClient.get<PaginatedResponse<Student>>(`/students${queryString}`)
  },

  /**
   * Fetch student by ID
   */
  async fetchStudentById(id: number): Promise<Student> {
    const httpClient = useHttpClient()
    return httpClient.get<Student>(`/students/${id}`)
  },

  /**
   * Create a new student
   */
  async createStudent(studentData: CreateStudentDto): Promise<Student> {
    const httpClient = useHttpClient()
    return httpClient.post<Student>('/students', studentData)
  },

  /**
   * Update student by ID
   */
  async updateStudent(id: number, studentData: UpdateStudentDto): Promise<Student> {
    const httpClient = useHttpClient()
    return httpClient.patch<Student>(`/students/${id}`, studentData)
  },

  /**
   * Delete student by ID
   */
  async deleteStudent(id: number): Promise<void> {
    const httpClient = useHttpClient()
    await httpClient.delete(`/students/${id}`)
  },
}
