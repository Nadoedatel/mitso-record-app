import type { ApiSchemas } from '~/shared/api/generated'

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

export type CreateFacultyDto = ApiSchemas['CreateFacultyDto']

export type UpdateFacultyDto = ApiSchemas['UpdateFacultyDto']
