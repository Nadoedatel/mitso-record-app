import type { Student } from '~/entities/student'
import { useHttpClient } from '~/shared/api/httpClient'

export const studentsApi = {
  /**
   * Fetch all students with optional search
   */
  async fetchStudents(search?: string): Promise<Student[]> {
    const httpClient = useHttpClient()
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return httpClient.get<Student[]>(`/students${query}`)
  },

  /**
   * Fetch student by ID
   */
  async fetchStudentById(id: number): Promise<Student> {
    const httpClient = useHttpClient()
    return httpClient.get<Student>(`/students/${id}`)
  },
}
