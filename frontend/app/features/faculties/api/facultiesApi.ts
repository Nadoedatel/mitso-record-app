import { payload, useApiClient } from '~/shared/api/apiClient'
import type { Faculty, CreateFacultyDto, UpdateFacultyDto } from '~/entities/faculty'

export async function fetchFaculties(params?: { search?: string }): Promise<Faculty[]> {
  const api = useApiClient()
  const page = payload(await api.GET('/api/faculties', { params: { query: { search: params?.search || undefined } } }))
  return page.data
}

export async function fetchFacultyById(id: number): Promise<Faculty> {
  const api = useApiClient()
  return payload(await api.GET('/api/faculties/{id}', { params: { path: { id } } }))
}

export async function createFaculty(facultyData: CreateFacultyDto): Promise<Faculty> {
  const api = useApiClient()
  return payload(await api.POST('/api/faculties', { body: facultyData }))
}

export async function updateFaculty(id: number, facultyData: UpdateFacultyDto): Promise<Faculty> {
  const api = useApiClient()
  return payload(await api.PATCH('/api/faculties/{id}', { params: { path: { id } }, body: facultyData }))
}

export async function deleteFaculty(id: number): Promise<void> {
  const api = useApiClient()
  await api.DELETE('/api/faculties/{id}', { params: { path: { id } } })
}
