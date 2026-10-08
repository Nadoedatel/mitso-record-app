import type { ApiSchemas } from '~/shared/api/generated'
import type { Faculty } from '../../faculty'

export interface Specialization {
  id: number
  name: string
  code?: string
  facultyId: number
  faculty?: Faculty
  createdAt: string
  updatedAt: string
  _count?: {
    students: number
  }
}

export type CreateSpecializationDto = ApiSchemas['CreateSpecializationDto']

export type UpdateSpecializationDto = ApiSchemas['UpdateSpecializationDto']
