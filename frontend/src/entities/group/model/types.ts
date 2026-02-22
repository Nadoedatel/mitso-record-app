export interface Group {
  id: number;
  name: string;
  course: number;
  faculty: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGroupDto {
  name: string;
  course: number;
  faculty: string;
}

export interface UpdateGroupDto {
  name?: string;
  course?: number;
  faculty?: string;
}
