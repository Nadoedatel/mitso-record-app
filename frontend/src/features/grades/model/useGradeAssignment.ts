import { ref, computed } from 'vue'
import { gradesApi, type GradeBatchDto } from '~/features/grades/api/gradesApi'
import type { Group } from '~/entities/group'
import type { Student } from '~/entities/student'
import type { Subject } from '~/entities/subject'
import { GradeType } from '~/entities/grade'

export function useGradeAssignment(subjects: { value: Subject[] }) {
  const selectedSubjectId = ref<number | null>(null)
  const selectedGroup = ref<number | null>(null)
  const groups = ref<Group[]>([])
  const students = ref<Student[]>([])
  const groupsLoading = ref(false)
  const studentsLoading = ref(false)
  const isSaving = ref(false)
  const saveSuccess = ref(false)
  const saveError = ref('')

  const gradesForm = ref<Record<number, {
    gradeType: GradeType | ''
    gradeValue: number | null
    examDate: string
    notes: string
  }>>({})

  const hasValidGrades = computed(() =>
    Object.values(gradesForm.value).some(
      g => g.gradeType && g.gradeValue && g.gradeValue >= 1 && g.gradeValue <= 10
    )
  )

  const subjectOptions = computed(() =>
    subjects.value.map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))
  )

  const groupOptions = computed(() =>
    groups.value.map(g => ({
      value: g.id,
      label: `${g.name} (${g.studentCount || 0} студентов)`,
    }))
  )

  const gradeTypeOptions = [
    { value: 'EXAM', label: 'Экзамен' },
    { value: 'CREDIT', label: 'Зачёт' },
    { value: 'COURSEWORK', label: 'Курсовая' },
    { value: 'TEST', label: 'Контрольная' },
    { value: 'LAB', label: 'Лабораторная' },
  ]

  async function onSubjectChange() {
    selectedGroup.value = null
    students.value = []
    groups.value = []
    gradesForm.value = {}
    saveSuccess.value = false
    saveError.value = ''

    if (!selectedSubjectId.value) return

    groupsLoading.value = true
    try {
      groups.value = await gradesApi.fetchGroupsBySubject(selectedSubjectId.value)
    } catch (err: unknown) {
      saveError.value = err instanceof Error ? err.message : 'Ошибка загрузки групп'
    } finally {
      groupsLoading.value = false
    }
  }

  async function onGroupChange() {
    students.value = []
    gradesForm.value = {}
    saveSuccess.value = false
    saveError.value = ''

    if (!selectedGroup.value || !selectedSubjectId.value) return

    studentsLoading.value = true
    try {
      students.value = await gradesApi.fetchStudentsByGroupAndSubject(
        selectedGroup.value,
        selectedSubjectId.value
      )
      students.value.forEach((student: Student) => {
        gradesForm.value[student.id] = { gradeType: '', gradeValue: null, examDate: '', notes: '' }
      })
    } catch (err: unknown) {
      saveError.value = err instanceof Error ? err.message : 'Ошибка загрузки студентов'
    } finally {
      studentsLoading.value = false
    }
  }

  function clearGradesForm() {
    students.value.forEach((student: Student) => {
      gradesForm.value[student.id] = { gradeType: '', gradeValue: null, examDate: '', notes: '' }
    })
  }

  async function saveBatchGrades() {
    if (!selectedSubjectId.value) return

    saveSuccess.value = false
    saveError.value = ''
    isSaving.value = true

    try {
      const gradesToSave: GradeBatchDto[] = []

      Object.entries(gradesForm.value).forEach(([studentId, grade]) => {
        if (grade.gradeType && grade.gradeValue && grade.gradeValue >= 1 && grade.gradeValue <= 10) {
          gradesToSave.push({
            studentId: parseInt(studentId),
            subjectId: selectedSubjectId.value!,
            gradeType: grade.gradeType as GradeType,
            gradeValue: grade.gradeValue,
            examDate: grade.examDate || undefined,
            notes: grade.notes || undefined,
          })
        }
      })

      if (gradesToSave.length === 0) {
        saveError.value = 'Нет оценок для сохранения'
        return
      }

      await gradesApi.createBatchGrades(gradesToSave)
      saveSuccess.value = true

      if (selectedGroup.value && selectedSubjectId.value) {
        students.value = await gradesApi.fetchStudentsByGroupAndSubject(
          selectedGroup.value,
          selectedSubjectId.value
        )
        clearGradesForm()
      }

      setTimeout(() => { saveSuccess.value = false }, 3000)
    } catch (err: unknown) {
      saveError.value = err instanceof Error ? err.message : 'Ошибка при сохранении оценок'
    } finally {
      isSaving.value = false
    }
  }

  return {
    selectedSubjectId,
    selectedGroup,
    groups,
    students,
    gradesForm,
    groupsLoading,
    studentsLoading,
    isSaving,
    saveSuccess,
    saveError,
    hasValidGrades,
    subjectOptions,
    groupOptions,
    gradeTypeOptions,
    onSubjectChange,
    onGroupChange,
    clearGradesForm,
    saveBatchGrades,
  }
}
