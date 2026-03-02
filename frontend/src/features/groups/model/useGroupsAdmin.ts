import { ref } from 'vue'
import { fetchGroups, createGroup, updateGroup, deleteGroup } from '~/features/groups/api/groupsApi'
import { fetchFaculties } from '~/features/faculties/api/facultiesApi'
import type { Group } from '~/entities/group'
import type { Faculty } from '~/entities/faculty'

export function useGroupsAdmin() {
  const groups = ref<Group[]>([])
  const loading = ref(false)
  const search = ref('')
  const faculties = ref<Faculty[]>([])
  const showModal = ref(false)
  const editingItem = ref<Group | null>(null)

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
      alert('Ошибка загрузки групп: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
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
        alert('Группа обновлена')
      } else {
        await createGroup({
          name: form.value.name,
          course: form.value.course,
          facultyId: form.value.facultyId,
        })
        alert('Группа создана')
      }
      closeModal()
      await searchItems()
    } catch (err: unknown) {
      alert('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('Вы уверены, что хотите удалить группу?')) return
    try {
      await deleteGroup(id)
      alert('Группа удалена')
      await searchItems()
    } catch (err: unknown) {
      alert('Ошибка удаления: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
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
    searchItems,
    loadLookups,
    openModal,
    closeModal,
    save,
    deleteItem,
  }
}
