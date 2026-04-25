import { ref } from 'vue'
import { useToast } from '~/shared/lib/useToast'
import { teachersApi } from '~/features/teachers/api/teachersApi'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import type { Teacher } from '~/entities/teacher'
import type { Subject } from '~/entities/subject'

export function useTeachersAdmin() {
  const toast = useToast()
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
      toast.error('Ошибка загрузки преподавателей: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
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
        toast.success('Преподаватель обновлён')
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
        toast.success('Преподаватель создан')
      }
      closeModal()
      await searchItems()
    } catch (err: unknown) {
      toast.error('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('Вы уверены, что хотите удалить преподавателя?')) return
    try {
      await teachersApi.deleteTeacher(id)
      toast.success('Преподаватель удалён')
      await searchItems()
    } catch (err: unknown) {
      toast.error('Ошибка удаления: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    }
  }

  // Subject management
  const showSubjectsModal = ref(false)
  const subjectsLoading = ref(false)
  const managingTeacher = ref<Teacher | null>(null)
  const allSubjects = ref<Subject[]>([])
  const selectedSubjectIds = ref<Set<number>>(new Set())

  async function openSubjectsModal(teacher: Teacher) {
    managingTeacher.value = teacher
    showSubjectsModal.value = true
    subjectsLoading.value = true
    try {
      const [subjectsResult, assigned] = await Promise.all([
        subjectsApi.fetchSubjects({ limit: 100 }),
        teachersApi.getTeacherSubjects(teacher.id),
      ])
      allSubjects.value = subjectsResult.data
      selectedSubjectIds.value = new Set(assigned.map((s: Subject) => s.id))
    } catch (err: unknown) {
      toast.error('Ошибка загрузки предметов: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    } finally {
      subjectsLoading.value = false
    }
  }

  function closeSubjectsModal() {
    showSubjectsModal.value = false
    managingTeacher.value = null
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
    if (!managingTeacher.value) return
    try {
      await teachersApi.assignSubjects(managingTeacher.value.id, [...selectedSubjectIds.value])
      toast.success('Предметы сохранены')
      closeSubjectsModal()
    } catch (err: unknown) {
      toast.error('Ошибка сохранения: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
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
    showSubjectsModal,
    subjectsLoading,
    managingTeacher,
    allSubjects,
    selectedSubjectIds,
    openSubjectsModal,
    closeSubjectsModal,
    toggleSubject,
    saveSubjects,
  }
}
