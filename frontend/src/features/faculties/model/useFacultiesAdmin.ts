import { ref } from 'vue'
import { fetchFaculties, createFaculty, updateFaculty, deleteFaculty } from '~/features/faculties/api/facultiesApi'
import type { Faculty } from '~/entities/faculty'

export function useFacultiesAdmin() {
  const faculties = ref<Faculty[]>([])
  const loading = ref(false)
  const search = ref('')
  const showModal = ref(false)
  const editingItem = ref<Faculty | null>(null)

  const form = ref<{ name: string }>({ name: '' })

  async function searchItems() {
    loading.value = true
    try {
      faculties.value = await fetchFaculties({ search: search.value })
    } catch (err: unknown) {
      alert('Ошибка загрузки факультетов: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    } finally {
      loading.value = false
    }
  }

  function openModal(faculty?: Faculty) {
    if (faculty) {
      editingItem.value = faculty
      form.value = { name: faculty.name }
    } else {
      editingItem.value = null
      form.value = { name: '' }
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
        await updateFaculty(editingItem.value.id, { name: form.value.name })
        alert('Факультет обновлён')
      } else {
        await createFaculty({ name: form.value.name })
        alert('Факультет создан')
      }
      closeModal()
      await searchItems()
    } catch (err: unknown) {
      alert('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('Вы уверены, что хотите удалить факультет?')) return
    try {
      await deleteFaculty(id)
      alert('Факультет удалён')
      await searchItems()
    } catch (err: unknown) {
      alert('Ошибка удаления: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  return {
    faculties,
    loading,
    search,
    showModal,
    editingItem,
    form,
    searchItems,
    openModal,
    closeModal,
    save,
    deleteItem,
  }
}
