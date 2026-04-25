import { ref } from 'vue'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import { teachersApi } from '~/features/teachers/api/teachersApi'
import { useToast } from '~/shared/lib/useToast'
import type { Subject } from '~/entities/subject'
import type { Teacher } from '~/entities/teacher'

export function useSubjectsAdmin() {
  const toast = useToast()
  const subjects = ref<Subject[]>([])
  const loading = ref(false)
  const search = ref('')
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

  async function searchItems() {
    loading.value = true
    try {
      const result = await subjectsApi.fetchSubjects({ search: search.value, limit: 100 })
      subjects.value = result.data
    } catch (err: unknown) {
      toast.error('Ошибка загрузки дисциплин: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    } finally {
      loading.value = false
    }
  }

  async function loadLookups() {
    const result = await teachersApi.fetchTeachers({ limit: 200 })
    allTeachers.value = result.data
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
        teacherId: subject.teacherId,
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
      if (editingItem.value) {
        await subjectsApi.updateSubject(editingItem.value.id, {
          name: form.value.name,
          code: form.value.code,
          credits: form.value.credits,
          semester: form.value.semester,
          description: form.value.description,
          teacherId: form.value.teacherId,
        })
        toast.success('Дисциплина обновлена')
      } else {
        await subjectsApi.createSubject({
          name: form.value.name,
          code: form.value.code,
          credits: form.value.credits,
          semester: form.value.semester,
          description: form.value.description,
          teacherId: form.value.teacherId,
        })
        toast.success('Дисциплина создана')
      }
      closeModal()
      await searchItems()
    } catch (err: unknown) {
      toast.error('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('Вы уверены, что хотите удалить дисциплину?')) return
    try {
      await subjectsApi.deleteSubject(id)
      toast.success('Дисциплина удалена')
      await searchItems()
    } catch (err: unknown) {
      toast.error('Ошибка удаления: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  return {
    subjects,
    loading,
    search,
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
