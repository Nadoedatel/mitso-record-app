import { ref } from 'vue'
import { useToast } from '~/shared/lib/useToast'
import {
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  fetchGroupSubjects,
  setGroupSubjects,
} from '~/features/groups/api/groupsApi'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import { fetchFaculties } from '~/features/faculties/api/facultiesApi'
import type { Group } from '~/entities/group'
import type { Faculty } from '~/entities/faculty'
import type { Subject } from '~/entities/subject'

export function useGroupsAdmin() {
  const toast = useToast()
  const groups = ref<Group[]>([])
  const loading = ref(false)
  const search = ref('')
  const faculties = ref<Faculty[]>([])
  const showModal = ref(false)
  const editingItem = ref<Group | null>(null)

  // Subjects modal state
  const showSubjectsModal = ref(false)
  const subjectsLoading = ref(false)
  const managingGroup = ref<Group | null>(null)
  const allSubjects = ref<Subject[]>([])
  const selectedSubjectIds = ref<Set<number>>(new Set())

  const form = ref<{
    name: string
    course: number
    facultyId: number | undefined
  }>({
    name: '',
    course: 1,
    facultyId: undefined,
  })

  async function searchItems() {
    loading.value = true
    try {
      groups.value = await fetchGroups({ search: search.value })
    } catch (err: unknown) {
      toast.error('Ошибка загрузки групп: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    } finally {
      loading.value = false
    }
  }

  async function loadLookups() {
    faculties.value = await fetchFaculties()
  }

  function openModal(group?: Group) {
    if (group) {
      editingItem.value = group
      form.value = { name: group.name, course: group.course, facultyId: group.facultyId }
    } else {
      editingItem.value = null
      form.value = { name: '', course: 1, facultyId: undefined }
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
        await updateGroup(editingItem.value.id, {
          name: form.value.name,
          course: form.value.course,
          facultyId: form.value.facultyId,
        })
        toast.success('Группа обновлена')
      } else {
        await createGroup({
          name: form.value.name,
          course: form.value.course,
          facultyId: form.value.facultyId,
        })
        toast.success('Группа создана')
      }
      closeModal()
      await searchItems()
    } catch (err: unknown) {
      toast.error('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('Вы уверены, что хотите удалить группу?')) return
    try {
      await deleteGroup(id)
      toast.success('Группа удалена')
      await searchItems()
    } catch (err: unknown) {
      toast.error('Ошибка удаления: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  async function openSubjectsModal(group: Group) {
    managingGroup.value = group
    showSubjectsModal.value = true
    subjectsLoading.value = true
    try {
      const [groupSubjects, subjectsResult] = await Promise.all([
        fetchGroupSubjects(group.id),
        subjectsApi.fetchSubjects({ limit: 100 }),
      ])
      allSubjects.value = subjectsResult.data
      selectedSubjectIds.value = new Set(groupSubjects.map((s) => s.id))
    } catch (err: unknown) {
      toast.error('Ошибка загрузки дисциплин: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    } finally {
      subjectsLoading.value = false
    }
  }

  function closeSubjectsModal() {
    showSubjectsModal.value = false
    managingGroup.value = null
    allSubjects.value = []
    selectedSubjectIds.value = new Set()
  }

  function toggleSubject(subjectId: number) {
    const next = new Set(selectedSubjectIds.value)
    if (next.has(subjectId)) {
      next.delete(subjectId)
    } else {
      next.add(subjectId)
    }
    selectedSubjectIds.value = next
  }

  async function saveSubjects() {
    if (!managingGroup.value) return
    try {
      await setGroupSubjects(managingGroup.value.id, [...selectedSubjectIds.value])
      toast.success('Дисциплины группы обновлены')
      closeSubjectsModal()
    } catch (err: unknown) {
      toast.error('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  return {
    groups,
    loading,
    search,
    faculties,
    showModal,
    editingItem,
    form,
    showSubjectsModal,
    subjectsLoading,
    managingGroup,
    allSubjects,
    selectedSubjectIds,
    searchItems,
    loadLookups,
    openModal,
    closeModal,
    save,
    deleteItem,
    openSubjectsModal,
    closeSubjectsModal,
    toggleSubject,
    saveSubjects,
  }
}
