import { useHttpClient } from '~/shared/api/httpClient'
import type { Faculty, CreateFacultyDto, UpdateFacultyDto } from '~/entities/faculty'

export async function fetchFaculties(params?: { search?: string }): Promise<Faculty[]> {
  const httpClient = useHttpClient()

  const queryParams = new URLSearchParams()
  if (params?.search) {
    queryParams.append('search', params.search)
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

  const response = await httpClient.get<{ data: Faculty[] }>(`/faculties${queryString}`)
  return response.data
}

export async function fetchFacultyById(id: number): Promise<Faculty> {
  const httpClient = useHttpClient()
  return httpClient.get<Faculty>(`/faculties/${id}`)
}

export async function createFaculty(facultyData: CreateFacultyDto): Promise<Faculty> {
  const httpClient = useHttpClient()
  return httpClient.post<Faculty>('/faculties', facultyData)
}

export async function updateFaculty(id: number, facultyData: UpdateFacultyDto): Promise<Faculty> {
  const httpClient = useHttpClient()
  return httpClient.patch<Faculty>(`/faculties/${id}`, facultyData)
}

export async function deleteFaculty(id: number): Promise<void> {
  const httpClient = useHttpClient()
  await httpClient.delete(`/faculties/${id}`)
}
