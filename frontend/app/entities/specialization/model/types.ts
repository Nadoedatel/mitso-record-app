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

export interface CreateSpecializationDto {
  name: string
  code?: string
  facultyId: number
}

export interface UpdateSpecializationDto {
  name?: string
  code?: string
  facultyId?: number
}
