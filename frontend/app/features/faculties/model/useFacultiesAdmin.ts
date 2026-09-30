import { ref } from 'vue'
import { useToast } from '~/shared/lib/useToast'
import { useConfirm } from '~/shared/lib/useConfirm'
import { fetchFaculties, createFaculty, updateFaculty, deleteFaculty } from '~/features/faculties/api/facultiesApi'
import type { Faculty } from '~/entities/faculty'

export function useFacultiesAdmin() {
  const toast = useToast()
  const { confirm } = useConfirm()
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
      toast.error('Ошибка загрузки факультетов: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
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
        toast.success('Факультет обновлён')
      } else {
        await createFaculty({ name: form.value.name })
        toast.success('Факультет создан')
      }
      closeModal()
      await searchItems()
    } catch (err: unknown) {
      toast.error('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  async function deleteItem(id: number) {
    if (!(await confirm({ message: 'Вы уверены, что хотите удалить факультет?' }))) return
    try {
      await deleteFaculty(id)
      toast.success('Факультет удалён')
      await searchItems()
    } catch (err: unknown) {
      toast.error('Ошибка удаления: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
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
