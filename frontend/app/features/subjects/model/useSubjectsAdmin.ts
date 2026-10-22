import { ref } from 'vue'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import { teachersApi } from '~/features/teachers/api/teachersApi'
import { useToast } from '~/shared/lib/useToast'
import { useConfirm } from '~/shared/lib/useConfirm'
import { usePagedList } from '~/shared/lib/usePagedList'
import type { Subject } from '~/entities/subject'
import type { Teacher } from '~/entities/teacher'

export function useSubjectsAdmin() {
  const toast = useToast()
  const { confirm } = useConfirm()

  const list = usePagedList<Subject>((query, signal) => subjectsApi.fetchSubjects(query, signal))
  const { items: subjects, loading, search, page, totalPages, changePage } = list
  const allTeachers = ref<Teacher[]>([])
  const showModal = ref(false)
  const editingItem = ref<Subject | null>(null)

  const form = ref<{
    name: string
    code: string
    credits: number
    semester: number
    description: string
    teacherId: number | undefined
  }>({
    name: '',
    code: '',
    credits: 1,
    semester: 1,
    description: '',
    teacherId: undefined,
  })

  /** Search changed: back to the first page */
  function searchItems() {
    return list.load({ resetPage: true })
  }

  async function loadLookups() {
    const result = await teachersApi.fetchTeachers({ limit: 200 })
    allTeachers.value = result.data
  }

  /** The form has one teacher select: it shows the first teacher of the subject */
  function currentTeacherId(subject: Subject): number | undefined {
    return subject.teacherSubjects?.[0]?.teacher.id
  }

  function openModal(subject?: Subject) {
    if (subject) {
      editingItem.value = subject
      form.value = {
        name: subject.name,
        code: subject.code,
        credits: subject.credits,
        semester: subject.semester,
        description: subject.description || '',
        teacherId: currentTeacherId(subject),
      }
    } else {
      editingItem.value = null
      form.value = {
        name: '',
        code: '',
        credits: 1,
        semester: 1,
        description: '',
        teacherId: undefined,
      }
    }
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    editingItem.value = null
  }

  async function save() {
    try {
      // <select> emits strings, the API wants a number
      const teacherId = form.value.teacherId ? Number(form.value.teacherId) : undefined
      if (editingItem.value) {
        const subject = editingItem.value
        await subjectsApi.updateSubject(subject.id, {
          name: form.value.name,
          code: form.value.code,
          credits: form.value.credits,
          semester: form.value.semester,
          description: form.value.description,
        })
        // Teachers are set by a separate call and it replaces them all: only when the select was changed
        if (teacherId && teacherId !== currentTeacherId(subject)) {
          await subjectsApi.assignTeachers(subject.id, [teacherId])
        }
        toast.success('Дисциплина обновлена')
      } else {
        const created = await subjectsApi.createSubject({
          name: form.value.name,
          code: form.value.code,
          credits: form.value.credits,
          semester: form.value.semester,
          description: form.value.description,
        })
        if (teacherId) await subjectsApi.assignTeachers(created.id, [teacherId])
        toast.success('Дисциплина создана')
      }
      closeModal()
      await list.load()
    } catch (err: unknown) {
      toast.error('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  async function deleteItem(id: number) {
    if (!(await confirm({ message: 'Вы уверены, что хотите удалить дисциплину?' }))) return
    try {
      await subjectsApi.deleteSubject(id)
      toast.success('Дисциплина удалена')
      await list.load()
    } catch (err: unknown) {
      toast.error('Ошибка удаления: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  return {
    subjects,
    loading,
    search,
    page,
    totalPages,
    changePage,
    allTeachers,
    showModal,
    editingItem,
    form,
    searchItems,
    loadLookups,
    openModal,
    closeModal,
    save,
    deleteItem,
  }
}
