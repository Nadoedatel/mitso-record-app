import { computed } from 'vue'
import { jobsApi } from '../api/jobsApi'
import { useJob } from './useJob'

/** Import of students from a CSV file: upload, watch the job, expose progress and the result summary */
export function useStudentsImport() {
  const { job, error, running, run, stop } = useJob()

  const result = computed(() => (job.value?.state === 'completed' ? job.value.result : null))
  const failedReason = computed(() => (job.value?.state === 'failed' ? job.value.failedReason : null))

  /** Resolves true when the job completed (rows with errors are still a completed job) */
  async function importFile(file: File): Promise<boolean> {
    const finished = await run(() => jobsApi.startStudentsImport(file))
    return finished?.state === 'completed'
  }

  return { job, error, running, result, failedReason, importFile, stop }
}
