import { computed, getCurrentScope, onScopeDispose, ref } from 'vue'
import type { JobStatus } from '../api/jobsApi'
import { jobsApi } from '../api/jobsApi'

const UNFINISHED: JobStatus['state'][] = ['waiting', 'active', 'delayed']

/** How long to wait for a job before giving up on watching it (the job itself keeps running) */
const MAX_WATCH_MS = 5 * 60 * 1000

/**
 * Runs a background job and watches it: `run(start)` starts the job, polls its state until it finishes and
 * returns the final status (or null when it could not be followed). `job` is updated on every poll, so the UI can
 * show progress. A new `run` or leaving the component stops the previous watch.
 */
export function useJob(options: { pollMs?: number } = {}) {
  const pollMs = options.pollMs ?? 1000
  const job = ref<JobStatus | null>(null)
  const error = ref('')
  const watching = ref(false)
  let watchId = 0

  const running = computed(() => watching.value || (job.value !== null && UNFINISHED.includes(job.value.state)))

  function stop() {
    watchId++
    watching.value = false
  }
  if (getCurrentScope()) onScopeDispose(stop)

  async function run(start: () => Promise<JobStatus>): Promise<JobStatus | null> {
    stop()
    const id = watchId
    job.value = null
    error.value = ''
    watching.value = true
    try {
      let current = await start()
      job.value = current
      const startedAt = Date.now()
      while (UNFINISHED.includes(current.state)) {
        if (Date.now() - startedAt > MAX_WATCH_MS) throw new Error('Задача выполняется слишком долго. Проверьте её позже.')
        await new Promise((resolve) => setTimeout(resolve, pollMs))
        if (id !== watchId) return null // replaced by a newer run or the component is gone
        current = await jobsApi.getJob(current.id)
        job.value = current
      }
      return current
    } catch (err: unknown) {
      if (id === watchId) error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'
      return null
    } finally {
      if (id === watchId) watching.value = false
    }
  }

  return { job, error, running, run, stop }
}
