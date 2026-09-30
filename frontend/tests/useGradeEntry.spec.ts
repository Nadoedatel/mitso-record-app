import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { GradeType } from '~/entities/grade'

const gradesApi = vi.hoisted(() => ({
  fetchStudentsByGroupAndSubject: vi.fn(),
  createBatchGrades: vi.fn(),
}))
vi.mock('~/features/grades/api/gradesApi', () => ({ gradesApi }))

import { useGradeEntry } from '~/features/grades/model/useGradeEntry'

const flush = async () => {
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
}

function setup() {
  const subjectId = ref<number | null>(7)
  const groupId = ref<number | null>(3)
  const entry = useGradeEntry(subjectId, groupId)
  return { subjectId, groupId, entry }
}

describe('useGradeEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    gradesApi.fetchStudentsByGroupAndSubject.mockResolvedValue([{ id: 1 }, { id: 2 }])
    gradesApi.createBatchGrades.mockResolvedValue({ total: 1, succeeded: 1, failed: 0, errors: [] })
  })

  it('loads students for the selected subject and group', async () => {
    const { entry } = setup()
    await flush()
    expect(gradesApi.fetchStudentsByGroupAndSubject).toHaveBeenCalledWith(3, 7)
    expect(entry.students.value).toHaveLength(2)
  })

  it('ignores a slow response for a previous group (latest wins)', async () => {
    let resolveOld: (v: unknown[]) => void = () => {}
    gradesApi.fetchStudentsByGroupAndSubject
      .mockImplementationOnce(() => new Promise((r) => { resolveOld = r }))
      .mockResolvedValueOnce([{ id: 99 }])

    const { groupId, entry } = setup()
    groupId.value = 4
    await flush()
    resolveOld([{ id: 1 }])
    await flush()

    expect(entry.students.value).toEqual([{ id: 99 }])
  })

  it('saves only valid grades for the current type', async () => {
    const { entry } = setup()
    await flush()
    entry.gradeType.value = GradeType.EXAM
    entry.inputs.value = { 1: 8, 2: 11 } // 11 is out of range for an exam

    expect(entry.filledCount.value).toBe(1)
    await entry.save()

    const sent = gradesApi.createBatchGrades.mock.calls[0][0]
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ studentId: 1, subjectId: 7, gradeType: 'EXAM', gradeValue: 8 })
  })

  it('accepts 0 (не зачёт) and "1" (зачёт) from the select for CREDIT', async () => {
    const { entry } = setup()
    await flush()
    entry.gradeType.value = GradeType.CREDIT
    await nextTick()
    entry.inputs.value = { 1: '1', 2: '0' }

    await entry.save()

    const sent = gradesApi.createBatchGrades.mock.calls[0][0]
    expect(sent.map((g: { gradeValue: number }) => g.gradeValue).sort()).toEqual([0, 1])
  })

  it('clears inputs when the grade type changes (values are not comparable)', async () => {
    const { entry } = setup()
    await flush()
    entry.inputs.value = { 1: 9 }
    entry.gradeType.value = GradeType.CREDIT
    await nextTick()
    expect(entry.inputs.value).toEqual({})
  })

  it('reports partial failures from the batch endpoint', async () => {
    gradesApi.createBatchGrades.mockResolvedValue({
      total: 2, succeeded: 1, failed: 1, errors: [{ reason: 'Not your subject' }],
    })
    const { entry } = setup()
    await flush()
    entry.inputs.value = { 1: 5, 2: 6 }

    await entry.save()

    expect(entry.saveError.value).toContain('Не сохранено 1 из 2')
    expect(entry.saveSuccess.value).toContain('1')
  })

  it('does not call the API when nothing is filled', async () => {
    const { entry } = setup()
    await flush()
    await entry.save()
    expect(gradesApi.createBatchGrades).not.toHaveBeenCalled()
    expect(entry.saveError.value).toBe('Нет оценок для сохранения')
  })
})
