import { payload, useApiClient } from '~/shared/api/apiClient'
import type { ApiSchemas } from '~/shared/api/generated'

export type JobStatus = ApiSchemas['JobStatusResponseDto']

export const jobsApi = {
  /** Queue the Excel export of a student's record book */
  async startStudentExport(studentId: number): Promise<JobStatus> {
    const api = useApiClient()
    return payload(await api.POST('/api/jobs/exports/students/{id}', { params: { path: { id: studentId } } }))
  },

  /** Queue the import of students from a CSV file */
  async startStudentsImport(file: File): Promise<JobStatus> {
    const api = useApiClient()
    return payload(
      await api.POST('/api/jobs/imports/students', {
        // The spec types a binary field as string; the multipart body is built by hand with the real File
        body: { file: '' },
        bodySerializer: () => {
          const form = new FormData()
          form.append('file', file)
          return form
        },
      }),
    )
  },

  async getJob(jobId: string): Promise<JobStatus> {
    const api = useApiClient()
    return payload(await api.GET('/api/jobs/{id}', { params: { path: { id: jobId } } }))
  },

  /** The file of a finished export job */
  async downloadFile(jobId: string): Promise<Blob> {
    const api = useApiClient()
    return payload(await api.GET('/api/jobs/{id}/file', { params: { path: { id: jobId } }, parseAs: 'blob' }))
  },
}
