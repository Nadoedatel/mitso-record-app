import type { ApiSchemas } from '~/shared/api/generated';
import type { Faculty } from '../../faculty/model/types';

export interface Group {
  id: number;
  name: string;
  course: number;
  facultyId?: number;
  faculty?: Faculty;
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateGroupDto = ApiSchemas['CreateGroupDto']

export type UpdateGroupDto = ApiSchemas['UpdateGroupDto']
