import { ref } from 'vue'
import { useToast } from '~/shared/lib/useToast'
import {
  fetchSpecializations,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
} from '~/features/specializations/api/specializationsApi'
import { fetchFaculties } from '~/features/faculties/api/facultiesApi'
import type { Specialization } from '~/entities/specialization'
import type { Faculty } from '~/entities/faculty'

export function useSpecializationsAdmin() {
  const toast = useToast()
  const specializations = ref<Specialization[]>([])
  const loading = ref(false)
  const search = ref('')
  const faculties = ref<Faculty[]>([])
  const showModal = ref(false)
  const editingItem = ref<Specialization | null>(null)

  const form = ref<{
    name: string
    code: string
    facultyId: number | undefined
  }>({
    name: '',
    code: '',
    facultyId: undefined,
  })

  async function searchItems() {
    loading.value = true
    try {
      specializations.value = await fetchSpecializations({ search: search.value })
    } catch (err: unknown) {
      toast.error('Ошибка загрузки специализаций: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    } finally {
      loading.value = false
    }
  }

  async function loadLookups() {
    faculties.value = await fetchFaculties()
  }

  function openModal(spec?: Specialization) {
    if (spec) {
      editingItem.value = spec
      form.value = { name: spec.name, code: spec.code || '', facultyId: spec.facultyId }
    } else {
      editingItem.value = null
      form.value = { name: '', code: '', facultyId: undefined }
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
        await updateSpecialization(editingItem.value.id, {
          name: form.value.name,
          code: form.value.code,
          facultyId: form.value.facultyId,
        })
        toast.success('Специализация обновлена')
      } else {
        await createSpecialization({
          name: form.value.name,
          code: form.value.code,
          facultyId: form.value.facultyId!,
        })
        toast.success('Специализация создана')
      }
      closeModal()
      await searchItems()
    } catch (err: unknown) {
      toast.error('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('Вы уверены, что хотите удалить специализацию?')) return
    try {
      await deleteSpecialization(id)
      toast.success('Специализация удалена')
      await searchItems()
    } catch (err: unknown) {
      toast.error('Ошибка удаления: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  return {
    specializations,
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
