import { payload, useApiClient } from '~/shared/api/apiClient'
import type { Specialization, CreateSpecializationDto, UpdateSpecializationDto } from '~/entities/specialization'

export async function fetchSpecializations(params?: { facultyId?: number; search?: string }): Promise<Specialization[]> {
  const api = useApiClient()
  const page = payload(
    await api.GET('/api/specializations', {
      params: { query: { facultyId: params?.facultyId || undefined, search: params?.search || undefined } },
    }),
  )
  return page.data
}

export async function fetchSpecializationById(id: number): Promise<Specialization> {
  const api = useApiClient()
  return payload(await api.GET('/api/specializations/{id}', { params: { path: { id } } }))
}

export async function createSpecialization(specializationData: CreateSpecializationDto): Promise<Specialization> {
  const api = useApiClient()
  return payload(await api.POST('/api/specializations', { body: specializationData }))
}

export async function updateSpecialization(id: number, specializationData: UpdateSpecializationDto): Promise<Specialization> {
  const api = useApiClient()
  return payload(await api.PATCH('/api/specializations/{id}', { params: { path: { id } }, body: specializationData }))
}

export async function deleteSpecialization(id: number): Promise<void> {
  const api = useApiClient()
  await api.DELETE('/api/specializations/{id}', { params: { path: { id } } })
}
