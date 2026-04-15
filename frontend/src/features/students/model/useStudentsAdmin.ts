import { ref } from 'vue'
import { studentsApi } from '~/features/students/api/studentsApi'
import { fetchGroups } from '~/features/groups/api/groupsApi'
import { fetchSpecializations } from '~/features/specializations/api/specializationsApi'
import { useHttpClient } from '~/shared/api/httpClient'
import type { Student } from '~/entities/student'
import type { Group } from '~/entities/group'
import type { Specialization } from '~/entities/specialization'

export function useStudentsAdmin() {
  const httpClient = useHttpClient()

  const students = ref<Student[]>([])
  const loading = ref(false)
  const search = ref('')
  const groupFilter = ref('')
  const groups = ref<Group[]>([])
  const specializations = ref<Specialization[]>([])
  const showModal = ref(false)
  const editingItem = ref<Student | null>(null)

  const form = ref<{
    firstName: string
    lastName: string
    middleName: string
    email: string
    password: string
    groupId: number | undefined
    course: number
    specializationId: number | undefined
    studentId: string
    enrollmentYear: number
    phone: string
    address: string
    birthDate: string
  }>({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    groupId: undefined,
    course: 1,
    specializationId: undefined,
    studentId: '',
    enrollmentYear: new Date().getFullYear(),
    phone: '',
    address: '',
    birthDate: '',
  })

  async function searchItems() {
    loading.value = true
    try {
      const result = await studentsApi.fetchStudents({ search: search.value, limit: 100 })
      students.value = groupFilter.value
        ? result.data.filter((s: Student) => s.group?.name === groupFilter.value)
        : result.data
    } catch (err: unknown) {
      alert('Ошибка загрузки студентов: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    } finally {
      loading.value = false
    }
  }

  async function loadLookups() {
    const [groupsResult, specsResult] = await Promise.all([
      fetchGroups(),
      fetchSpecializations(),
    ])
    groups.value = groupsResult
    specializations.value = specsResult
  }

  function openModal(student?: Student) {
    if (student) {
      editingItem.value = student
      form.value = {
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName || '',
        email: student.user?.email || '',
        password: '',
        groupId: student.groupId,
        course: student.course,
        specializationId: student.specializationId,
        studentId: student.studentId,
        enrollmentYear: student.enrollmentYear,
        phone: student.phone || '',
        address: student.address || '',
        birthDate: student.birthDate ? student.birthDate.substring(0, 10) : '',
      }
    } else {
      editingItem.value = null
      form.value = {
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        password: '',
        groupId: undefined,
        course: 1,
        specializationId: undefined,
        studentId: '',
        enrollmentYear: new Date().getFullYear(),
        phone: '',
        address: '',
        birthDate: '',
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
        await studentsApi.updateStudent(editingItem.value.id, {
          firstName: form.value.firstName,
          lastName: form.value.lastName,
          middleName: form.value.middleName,
          groupId: form.value.groupId,
          course: form.value.course,
          specializationId: form.value.specializationId,
          studentId: form.value.studentId,
          enrollmentYear: form.value.enrollmentYear,
          phone: form.value.phone,
          address: form.value.address,
          birthDate: form.value.birthDate || undefined,
        })
        alert('Студент обновлён')
      } else {
        const registerResponse = await httpClient.post<{ user: { id: number }; accessToken: string }>(
          '/auth/register',
          { email: form.value.email, password: form.value.password, role: 'STUDENT' }
        )
        await studentsApi.createStudent({
          userId: registerResponse.user.id,
          firstName: form.value.firstName,
          lastName: form.value.lastName,
          middleName: form.value.middleName,
          studentId: form.value.studentId,
          groupId: form.value.groupId,
          course: form.value.course,
          specializationId: form.value.specializationId,
          enrollmentYear: form.value.enrollmentYear,
          phone: form.value.phone,
          address: form.value.address,
          birthDate: form.value.birthDate ? new Date(form.value.birthDate).toISOString() : undefined,
        })
        alert('Студент создан')
      }
      closeModal()
      await searchItems()
    } catch (err: unknown) {
      alert('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('Вы уверены, что хотите удалить студента?')) return
    try {
      await studentsApi.deleteStudent(id)
      alert('Студент удалён')
      await searchItems()
    } catch (err: unknown) {
      alert('Ошибка удаления: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  return {
    students,
    loading,
    search,
    groupFilter,
    groups,
    specializations,
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
