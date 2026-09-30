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

export interface CreateGroupDto {
  name: string;
  course: number;
  facultyId?: number;
}

export interface UpdateGroupDto {
  name?: string;
  course?: number;
  facultyId?: number;
}
