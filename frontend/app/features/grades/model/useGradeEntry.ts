import { ref, computed, watch, onBeforeUnmount, getCurrentInstance, type Ref } from 'vue'
import { gradesApi, type GradeBatchDto } from '~/features/grades/api/gradesApi'
import {
  GradeType,
  isPassFailType,
  isValidGradeValue,
} from '~/entities/grade'
import type { Student } from '~/entities/student'

/** Raw input value: <select> gives strings, NumberInput gives number or '' */
type GradeInput = string | number | null

/**
 * Batch grade entry for one subject + group: one grade type and date for all students,
 * a value per student. Used by both the teacher page and the subject grades page.
 */
export function useGradeEntry(subjectId: Ref<number | null>, groupId: Ref<number | null>) {
  const students = ref<Student[]>([])
  const inputs = ref<Record<number, GradeInput>>({})
  const gradeType = ref<GradeType>(GradeType.EXAM)
  const examDate = ref(new Date().toISOString().split('T')[0])

  const loading = ref(false)
  const saving = ref(false)
  const loadError = ref('')
  const saveError = ref('')
  const saveSuccess = ref('')

  const passFail = computed(() => isPassFailType(gradeType.value))

  /** Parse an input into a valid number for the current type, or null if empty/invalid */
  function parseInput(value: GradeInput | undefined): number | null {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    return isValidGradeValue(gradeType.value, num) ? num : null
  }

  const filledCount = computed(
    () => Object.values(inputs.value).filter((v) => parseInput(v) !== null).length,
  )

  let successTimer: ReturnType<typeof setTimeout> | undefined
  // Guards against a slow response for a previous group overwriting the current one
  let loadToken = 0

  async function loadStudents() {
    const token = ++loadToken
    students.value = []
    inputs.value = {}
    loadError.value = ''
    if (!subjectId.value || !groupId.value) {
      loading.value = false
      return
    }

    loading.value = true
    try {
      const result = await gradesApi.fetchStudentsByGroupAndSubject(groupId.value, subjectId.value)
      if (token === loadToken) students.value = result
    } catch (err: unknown) {
      if (token === loadToken) {
        loadError.value = err instanceof Error ? err.message : 'Ошибка загрузки студентов'
      }
    } finally {
      if (token === loadToken) loading.value = false
    }
  }

  async function save() {
    if (!subjectId.value) return

    const grades: GradeBatchDto[] = []
    for (const [studentId, raw] of Object.entries(inputs.value)) {
      const value = parseInput(raw)
      if (value === null) continue
      grades.push({
        studentId: Number(studentId),
        subjectId: subjectId.value,
        gradeType: gradeType.value,
        gradeValue: value,
        examDate: examDate.value || undefined,
      })
    }

    if (grades.length === 0) {
      saveError.value = 'Нет оценок для сохранения'
      return
    }

    saving.value = true
    saveError.value = ''
    saveSuccess.value = ''
    try {
      const result = await gradesApi.createBatchGrades(grades)
      if (result.failed > 0) {
        saveError.value = `Не сохранено ${result.failed} из ${result.total}: ${result.errors[0]?.reason ?? 'ошибка'}`
      }
      if (result.succeeded > 0) {
        saveSuccess.value = `Сохранено оценок: ${result.succeeded}`
        clearTimeout(successTimer)
        successTimer = setTimeout(() => { saveSuccess.value = '' }, 3000)
      }
      await loadStudents()
    } catch (err: unknown) {
      saveError.value = err instanceof Error ? err.message : 'Ошибка сохранения оценок'
    } finally {
      saving.value = false
    }
  }

  function clearInputs() {
    inputs.value = {}
    saveError.value = ''
  }

  // Values of different types are not comparable (1-10 vs зачёт/не зачёт)
  watch(gradeType, clearInputs)
  watch([subjectId, groupId], () => {
    saveError.value = ''
    saveSuccess.value = ''
    loadStudents()
  }, { immediate: true })

  if (getCurrentInstance()) onBeforeUnmount(() => clearTimeout(successTimer))

  return {
    students,
    inputs,
    gradeType,
    examDate,
    passFail,
    loading,
    saving,
    loadError,
    saveError,
    saveSuccess,
    filledCount,
    save,
    clearInputs,
  }
}
