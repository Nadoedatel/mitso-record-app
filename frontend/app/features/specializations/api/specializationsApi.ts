import { useHttpClient } from '~/shared/api/httpClient'
import type { Specialization, CreateSpecializationDto, UpdateSpecializationDto } from '~/entities/specialization'

export async function fetchSpecializations(params?: { facultyId?: number; search?: string }): Promise<Specialization[]> {
  const httpClient = useHttpClient()

  const queryParams = new URLSearchParams()
  if (params?.facultyId) {
    queryParams.append('facultyId', params.facultyId.toString())
  }
  if (params?.search) {
    queryParams.append('search', params.search)
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

  const response = await httpClient.get<{ data: Specialization[] }>(`/specializations${queryString}`)
  return response.data
}

export async function fetchSpecializationById(id: number): Promise<Specialization> {
  const httpClient = useHttpClient()
  return httpClient.get<Specialization>(`/specializations/${id}`)
}

export async function createSpecialization(specializationData: CreateSpecializationDto): Promise<Specialization> {
  const httpClient = useHttpClient()
  return httpClient.post<Specialization>('/specializations', specializationData)
}

export async function updateSpecialization(id: number, specializationData: UpdateSpecializationDto): Promise<Specialization> {
  const httpClient = useHttpClient()
  return httpClient.patch<Specialization>(`/specializations/${id}`, specializationData)
}

export async function deleteSpecialization(id: number): Promise<void> {
  const httpClient = useHttpClient()
  await httpClient.delete(`/specializations/${id}`)
}
