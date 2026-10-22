import { ref } from 'vue'
import { downloadBlob } from '~/shared/lib/downloadBlob'
import { useToast } from '~/shared/lib/useToast'
import { jobsApi } from '../api/jobsApi'
import { useJob } from './useJob'

/** Export of a student's record book to Excel: start the job, wait for it, download the file */
export function useRecordBookExport() {
  const toast = useToast()
  const { run, running } = useJob()
  const downloading = ref(false)

  async function exportRecordBook(studentId: number) {
    const job = await run(() => jobsApi.startStudentExport(studentId))
    if (!job) return toast.error('Не удалось подготовить файл. Попробуйте ещё раз.')
    if (job.state === 'failed') return toast.error(job.failedReason ?? 'Не удалось подготовить файл')

    downloading.value = true
    try {
      downloadBlob(await jobsApi.downloadFile(job.id), job.result?.fileName ?? 'zachetka.xlsx')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Не удалось скачать файл')
    } finally {
      downloading.value = false
    }
  }

  return { exportRecordBook, exporting: running, downloading }
}
