import { payload, useApiClient } from '~/shared/api/apiClient'
import type { Group, CreateGroupDto, UpdateGroupDto } from '~/entities/group'
import type { Subject } from '~/entities/subject'

export async function fetchGroups(params?: { search?: string }): Promise<Group[]> {
  const api = useApiClient()
  const page = payload(await api.GET('/api/groups', { params: { query: { search: params?.search || undefined } } }))
  return page.data
}

export async function fetchGroupById(id: number): Promise<Group> {
  const api = useApiClient()
  return payload(await api.GET('/api/groups/{id}', { params: { path: { id } } }))
}

export async function createGroup(groupData: CreateGroupDto): Promise<Group> {
  const api = useApiClient()
  return payload(await api.POST('/api/groups', { body: groupData }))
}

export async function updateGroup(id: number, groupData: UpdateGroupDto): Promise<Group> {
  const api = useApiClient()
  return payload(await api.PATCH('/api/groups/{id}', { params: { path: { id } }, body: groupData }))
}

export async function deleteGroup(id: number): Promise<void> {
  const api = useApiClient()
  await api.DELETE('/api/groups/{id}', { params: { path: { id } } })
}

export async function fetchGroupSubjects(groupId: number): Promise<Subject[]> {
  const api = useApiClient()
  return payload(await api.GET('/api/groups/{id}/subjects', { params: { path: { id: groupId } } }))
}

export async function setGroupSubjects(groupId: number, subjectIds: number[]): Promise<Subject[]> {
  const api = useApiClient()
  return payload(await api.POST('/api/groups/{id}/subjects', { params: { path: { id: groupId } }, body: { subjectIds } }))
}
