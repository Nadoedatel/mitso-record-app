import { useHttpClient } from '~/shared/api/httpClient';
import type { Group, CreateGroupDto, UpdateGroupDto } from '~/entities/group';

export async function fetchGroups(params?: { search?: string }): Promise<Group[]> {
  const httpClient = useHttpClient();

  // Build query string manually
  const queryParams = new URLSearchParams();
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const response = await httpClient.get<{ data: Group[] }>(`/groups${queryString}`);
  return response.data;
}

export async function fetchGroupById(id: number): Promise<Group> {
  const httpClient = useHttpClient();
  return httpClient.get<Group>(`/groups/${id}`);
}

export async function createGroup(groupData: CreateGroupDto): Promise<Group> {
  const httpClient = useHttpClient();
  return httpClient.post<Group>('/groups', groupData);
}

export async function updateGroup(id: number, groupData: UpdateGroupDto): Promise<Group> {
  const httpClient = useHttpClient();
  return httpClient.patch<Group>(`/groups/${id}`, groupData);
}

export async function deleteGroup(id: number): Promise<void> {
  const httpClient = useHttpClient();
  await httpClient.delete(`/groups/${id}`);
}
