export interface Faculty {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  _count?: {
    specializations: number
    groups: number
  }
}

export interface CreateFacultyDto {
  name: string
}

export interface UpdateFacultyDto {
  name?: string
}
