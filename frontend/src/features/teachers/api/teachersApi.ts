import type { Teacher } from '~/entities/teacher'
import { useHttpClient } from '~/shared/api/httpClient'

export const teachersApi = {
  /**
   * Fetch all teachers with optional search
   */
  async fetchTeachers(search?: string): Promise<Teacher[]> {
    const httpClient = useHttpClient()
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return httpClient.get<Teacher[]>(`/teachers${query}`)
  },

  /**
   * Fetch teacher by ID
   */
  async fetchTeacherById(id: number): Promise<Teacher> {
    const httpClient = useHttpClient()
    return httpClient.get<Teacher>(`/teachers/${id}`)
  },
}
