import { useHttpClient } from '~/shared/api/httpClient';
import type { Group, CreateGroupDto, UpdateGroupDto } from '~/entities/group';

const httpClient = useHttpClient();

export async function fetchGroups(params?: { search?: string }): Promise<Group[]> {
  const { data } = await httpClient.get<{ data: Group[] }>('/groups', { params });
  return data.data;
}

export async function fetchGroupById(id: number): Promise<Group> {
  const { data } = await httpClient.get<{ data: Group }>(`/groups/${id}`);
  return data.data;
}

export async function createGroup(groupData: CreateGroupDto): Promise<Group> {
  const { data } = await httpClient.post<{ data: Group }>('/groups', groupData);
  return data.data;
}

export async function updateGroup(id: number, groupData: UpdateGroupDto): Promise<Group> {
  const { data } = await httpClient.patch<{ data: Group }>(`/groups/${id}`, groupData);
  return data.data;
}

export async function deleteGroup(id: number): Promise<void> {
  await httpClient.delete(`/groups/${id}`);
}
