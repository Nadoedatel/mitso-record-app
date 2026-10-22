import { beforeEach, describe, expect, it, vi } from 'vitest'

const jobsApi = vi.hoisted(() => ({ getJob: vi.fn() }))
vi.mock('~/features/jobs/api/jobsApi', () => ({ jobsApi }))

import { useJob } from '~/features/jobs/model/useJob'
import type { JobStatus } from '~/features/jobs/api/jobsApi'

const job = (state: JobStatus['state'], progress = 0): JobStatus => ({
  id: 'j1',
  kind: 'import-students',
  state,
  progress,
  attemptsMade: 0,
  failedReason: null,
  result: null,
})

describe('useJob', () => {
  beforeEach(() => jobsApi.getJob.mockReset())

  it('polls until the job completes and keeps the last state in `job`', async () => {
    jobsApi.getJob.mockResolvedValueOnce(job('active', 40)).mockResolvedValueOnce(job('completed', 100))
    const { job: current, run, running } = useJob({ pollMs: 1 })

    const promise = run(async () => job('waiting'))
    expect(running.value).toBe(true)
    const final = await promise

    expect(final?.state).toBe('completed')
    expect(jobsApi.getJob).toHaveBeenCalledTimes(2)
    expect(current.value?.progress).toBe(100)
    expect(running.value).toBe(false)
  })

  it('returns a failed job as is (the caller decides what to show)', async () => {
    jobsApi.getJob.mockResolvedValueOnce({ ...job('failed'), failedReason: 'Не удалось' })
    const { run, error } = useJob({ pollMs: 1 })

    const final = await run(async () => job('active'))

    expect(final?.state).toBe('failed')
    expect(error.value).toBe('')
  })

  it('does not poll a job that is already finished when started', async () => {
    const { run } = useJob({ pollMs: 1 })
    expect((await run(async () => job('completed', 100)))?.state).toBe('completed')
    expect(jobsApi.getJob).not.toHaveBeenCalled()
  })

  it('reports an error from starting or polling and returns null', async () => {
    const { run, error, running } = useJob({ pollMs: 1 })

    expect(await run(async () => Promise.reject(new Error('Нет связи')))).toBeNull()
    expect(error.value).toBe('Нет связи')
    expect(running.value).toBe(false)

    jobsApi.getJob.mockRejectedValueOnce(new Error('503'))
    expect(await run(async () => job('active'))).toBeNull()
    expect(error.value).toBe('503')
  })

  it('stops watching when a newer run starts', async () => {
    jobsApi.getJob.mockResolvedValue(job('active'))
    const { run, stop } = useJob({ pollMs: 5 })

    const first = run(async () => job('active'))
    stop()

    expect(await first).toBeNull()
  })
})
