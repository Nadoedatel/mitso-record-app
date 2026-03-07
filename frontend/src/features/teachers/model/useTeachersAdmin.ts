import { ref } from 'vue'
import { teachersApi } from '~/features/teachers/api/teachersApi'
import type { Teacher } from '~/entities/teacher'

export function useTeachersAdmin() {
  const teachers = ref<Teacher[]>([])
  const loading = ref(false)
  const search = ref('')
  const showModal = ref(false)
  const editingItem = ref<Teacher | null>(null)

  const form = ref<{
    firstName: string
    lastName: string
    middleName: string
    email: string
    password: string
    department: string
    position: string
    academicDegree: string
    phone: string
    officeNumber: string
  }>({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    department: '',
    position: '',
    academicDegree: '',
    phone: '',
    officeNumber: '',
  })

  async function searchItems() {
    loading.value = true
    try {
      const result = await teachersApi.fetchTeachers({ search: search.value, limit: 100 })
      teachers.value = result.data
    } catch (err: unknown) {
      alert('Ошибка загрузки преподавателей: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    } finally {
      loading.value = false
    }
  }

  function openModal(teacher?: Teacher) {
    if (teacher) {
      editingItem.value = teacher
      form.value = {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        middleName: teacher.middleName || '',
        email: teacher.user?.email || '',
        password: '',
        department: teacher.department,
        position: teacher.position,
        academicDegree: teacher.academicDegree || '',
        phone: teacher.phone || '',
        officeNumber: teacher.officeNumber || '',
      }
    } else {
      editingItem.value = null
      form.value = {
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        password: '',
        department: '',
        position: '',
        academicDegree: '',
        phone: '',
        officeNumber: '',
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
        await teachersApi.updateTeacher(editingItem.value.id, {
          firstName: form.value.firstName,
          lastName: form.value.lastName,
          middleName: form.value.middleName,
          department: form.value.department,
          position: form.value.position,
          academicDegree: form.value.academicDegree,
          phone: form.value.phone,
          officeNumber: form.value.officeNumber,
        })
        alert('Преподаватель обновлён')
      } else {
        await teachersApi.createTeacher({
          firstName: form.value.firstName,
          lastName: form.value.lastName,
          middleName: form.value.middleName,
          email: form.value.email,
          password: form.value.password,
          department: form.value.department,
          position: form.value.position,
          academicDegree: form.value.academicDegree,
          phone: form.value.phone,
          officeNumber: form.value.officeNumber,
        })
        alert('Преподаватель создан')
      }
      closeModal()
      await searchItems()
    } catch (err: unknown) {
      alert('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('Вы уверены, что хотите удалить преподавателя?')) return
    try {
      await teachersApi.deleteTeacher(id)
      alert('Преподаватель удалён')
      await searchItems()
    } catch (err: unknown) {
      alert('Ошибка удаления: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  return {
    teachers,
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
