<template>
  <div class="admin-page">
    <Container maxWidth="full">
      <Header title="Панель администратора">
        <template #actions>
          <Button variant="danger" @click="logout">Выйти</Button>
        </template>
      </Header>

      <Tabs
        :tabs="tabs"
        v-model="activeTab"
      />

      <div class="tab-content">
        <!-- Students Tab -->
        <Section v-if="activeTab === 'students'">
          <div class="section-header">
            <div class="search-filters">
              <SearchInput
                v-model="studentsSearch"
                placeholder="Поиск по имени..."
                @update:modelValue="searchStudents"
              />
              <Select
                v-model="studentsGroupFilter"
                placeholder="Все группы"
                :options="[
                  { value: '', label: 'Все группы' },
                  ...groups.map(g => ({ value: g.name, label: g.name }))
                ]"
                @update:modelValue="searchStudents"
              />
            </div>
            <Button variant="success" @click="openStudentModal()">+ Добавить студента</Button>
          </div>

          <LoadingState v-if="loadingStudents" message="Загрузка студентов..." />
          <EmptyState v-else-if="students.length === 0" message="Студенты не найдены" />
          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Группа</th>
                  <th>Email</th>
                  <th>Зачётная книжка</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in students" :key="student.id">
                  <td>{{ student.lastName }} {{ student.firstName }} {{ student.middleName }}</td>
                  <td>{{ student.group?.name || '-' }}</td>
                  <td>{{ student.user?.email || '-' }}</td>
                  <td>{{ student.studentId }}</td>
                  <td>
                    <div class="actions">
                      <Button size="sm" variant="primary" @click="openStudentModal(student)">Редактировать</Button>
                      <Button size="sm" variant="danger" @click="deleteStudent(student.id)">Удалить</Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <!-- Teachers Tab -->
        <Section v-if="activeTab === 'teachers'">
          <div class="section-header">
            <SearchInput
              v-model="teachersSearch"
              placeholder="Поиск по имени..."
              @update:modelValue="searchTeachers"
            />
            <Button variant="success" @click="openTeacherModal()">+ Добавить преподавателя</Button>
          </div>

          <LoadingState v-if="loadingTeachers" message="Загрузка преподавателей..." />
          <EmptyState v-else-if="teachers.length === 0" message="Преподаватели не найдены" />
          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Кафедра</th>
                  <th>Должность</th>
                  <th>Email</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="teacher in teachers" :key="teacher.id">
                  <td>{{ teacher.lastName }} {{ teacher.firstName }} {{ teacher.middleName }}</td>
                  <td>{{ teacher.department }}</td>
                  <td>{{ teacher.position }}</td>
                  <td>{{ teacher.user?.email || '-' }}</td>
                  <td>
                    <div class="actions">
                      <Button size="sm" variant="primary" @click="openTeacherModal(teacher)">Редактировать</Button>
                      <Button size="sm" variant="danger" @click="deleteTeacherItem(teacher.id)">Удалить</Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <!-- Subjects Tab -->
        <Section v-if="activeTab === 'subjects'">
          <div class="section-header">
            <SearchInput
              v-model="subjectsSearch"
              placeholder="Поиск по названию..."
              @update:modelValue="searchSubjects"
            />
            <Button variant="success" @click="openSubjectModal()">+ Добавить дисциплину</Button>
          </div>

          <LoadingState v-if="loadingSubjects" message="Загрузка дисциплин..." />
          <EmptyState v-else-if="subjects.length === 0" message="Дисциплины не найдены" />
          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Код</th>
                  <th>Кредиты</th>
                  <th>Семестр</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="subject in subjects" :key="subject.id">
                  <td>{{ subject.name }}</td>
                  <td>{{ subject.code }}</td>
                  <td>{{ subject.credits }}</td>
                  <td>{{ subject.semester }}</td>
                  <td>
                    <div class="actions">
                      <Button size="sm" variant="primary" @click="openSubjectModal(subject)">Редактировать</Button>
                      <Button size="sm" variant="danger" @click="deleteSubjectItem(subject.id)">Удалить</Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <!-- Groups Tab -->
        <Section v-if="activeTab === 'groups'">
          <div class="section-header">
            <SearchInput
              v-model="groupsSearch"
              placeholder="Поиск по группе..."
              @update:modelValue="searchGroups"
            />
            <Button variant="success" @click="openGroupModal()">+ Добавить группу</Button>
          </div>

          <LoadingState v-if="loadingGroups" message="Загрузка групп..." />
          <EmptyState v-else-if="groups.length === 0" message="Группы не найдены" />
          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Курс</th>
                  <th>Факультет</th>
                  <th>Студентов</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="group in groups" :key="group.id">
                  <td>{{ group.name }}</td>
                  <td>{{ group.course }}</td>
                  <td>{{ group.faculty?.name || '-' }}</td>
                  <td>{{ group.studentCount ?? '-' }}</td>
                  <td>
                    <div class="actions">
                      <Button size="sm" variant="primary" @click="openGroupModal(group)">Редактировать</Button>
                      <Button size="sm" variant="danger" @click="deleteGroupItem(group.id)">Удалить</Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <!-- Faculties Tab -->
        <Section v-if="activeTab === 'faculties'">
          <div class="section-header">
            <SearchInput
              v-model="facultiesSearch"
              placeholder="Поиск по факультету..."
              @update:modelValue="searchFaculties"
            />
            <Button variant="success" @click="openFacultyModal()">+ Добавить факультет</Button>
          </div>

          <LoadingState v-if="loadingFaculties" message="Загрузка факультетов..." />
          <EmptyState v-else-if="faculties.length === 0" message="Факультеты не найдены" />
          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Специализаций</th>
                  <th>Групп</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="faculty in faculties" :key="faculty.id">
                  <td>{{ faculty.name }}</td>
                  <td>{{ faculty._count?.specializations ?? '-' }}</td>
                  <td>{{ faculty._count?.groups ?? '-' }}</td>
                  <td>
                    <div class="actions">
                      <Button size="sm" variant="primary" @click="openFacultyModal(faculty)">Редактировать</Button>
                      <Button size="sm" variant="danger" @click="deleteFacultyItem(faculty.id)">Удалить</Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <!-- Specializations Tab -->
        <Section v-if="activeTab === 'specializations'">
          <div class="section-header">
            <SearchInput
              v-model="specializationsSearch"
              placeholder="Поиск по специализации..."
              @update:modelValue="searchSpecializations"
            />
            <Button variant="success" @click="openSpecializationModal()">+ Добавить специализацию</Button>
          </div>

          <LoadingState v-if="loadingSpecializations" message="Загрузка специализаций..." />
          <EmptyState v-else-if="specializations.length === 0" message="Специализации не найдены" />
          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Код</th>
                  <th>Факультет</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="spec in specializations" :key="spec.id">
                  <td>{{ spec.name }}</td>
                  <td>{{ spec.code || '-' }}</td>
                  <td>{{ spec.faculty?.name || '-' }}</td>
                  <td>
                    <div class="actions">
                      <Button size="sm" variant="primary" @click="openSpecializationModal(spec)">Редактировать</Button>
                      <Button size="sm" variant="danger" @click="deleteSpecializationItem(spec.id)">Удалить</Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

      </div>
    </Container>

    <!-- Student Modal -->
    <Modal v-model="showStudentModal" size="lg" @close="closeStudentModal">
      <ModalHeader :title="editingStudent ? 'Редактировать студента' : 'Добавить студента'" @close="closeStudentModal" />

      <Form @submit.prevent="saveStudent">
        <FormRow>
          <FormField label="Фамилия" required>
            <Input v-model="studentForm.lastName" required />
          </FormField>
          <FormField label="Имя" required>
            <Input v-model="studentForm.firstName" required />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Отчество">
            <Input v-model="studentForm.middleName" />
          </FormField>
          <FormField label="Email" required>
            <Input v-model="studentForm.email" type="email" required />
          </FormField>
        </FormRow>

        <FormRow v-if="!editingStudent">
          <FormField label="Пароль" required>
            <Input v-model="studentForm.password" type="password" required />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Группа">
            <Select
              v-model="studentForm.groupId"
              :options="[
                { value: undefined, label: 'Не выбрана' },
                ...groups.map(g => ({ value: g.id, label: g.name }))
              ]"
            />
          </FormField>
          <FormField label="Курс" required>
            <NumberInput v-model="studentForm.course" :min="1" :max="6" required />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Специализация">
            <Select
              v-model="studentForm.specializationId"
              :options="[
                { value: undefined, label: 'Не выбрана' },
                ...specializations.map(s => ({ value: s.id, label: s.name }))
              ]"
            />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Номер зачётки" required>
            <Input v-model="studentForm.studentId" required />
          </FormField>
          <FormField label="Год поступления" required>
            <NumberInput v-model="studentForm.enrollmentYear" :min="2000" :max="2030" required />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Телефон">
            <Input v-model="studentForm.phone" type="tel" />
          </FormField>
          <FormField label="Дата рождения">
            <Input v-model="studentForm.birthDate" type="date" />
          </FormField>
        </FormRow>

        <FormField label="Адрес">
          <Input v-model="studentForm.address" />
        </FormField>

        <ModalActions>
          <Button variant="secondary" @click="closeStudentModal">Отмена</Button>
          <Button variant="primary" type="submit">
            {{ editingStudent ? 'Сохранить' : 'Создать' }}
          </Button>
        </ModalActions>
      </Form>
    </Modal>

    <!-- Teacher Modal -->
    <Modal v-model="showTeacherModal" size="lg" @close="closeTeacherModal">
      <ModalHeader :title="editingTeacher ? 'Редактировать преподавателя' : 'Добавить преподавателя'" @close="closeTeacherModal" />

      <Form @submit.prevent="saveTeacher">
        <FormRow>
          <FormField label="Фамилия" required>
            <Input v-model="teacherForm.lastName" required />
          </FormField>
          <FormField label="Имя" required>
            <Input v-model="teacherForm.firstName" required />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Отчество">
            <Input v-model="teacherForm.middleName" />
          </FormField>
          <FormField label="Email" required>
            <Input v-model="teacherForm.email" type="email" required />
          </FormField>
        </FormRow>

        <FormRow v-if="!editingTeacher">
          <FormField label="Пароль" required>
            <Input v-model="teacherForm.password" type="password" required />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Кафедра" required>
            <Input v-model="teacherForm.department" required />
          </FormField>
          <FormField label="Должность" required>
            <Input v-model="teacherForm.position" required />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Учёная степень">
            <Input v-model="teacherForm.academicDegree" />
          </FormField>
          <FormField label="Телефон">
            <Input v-model="teacherForm.phone" type="tel" />
          </FormField>
        </FormRow>

        <FormField label="Номер кабинета">
          <Input v-model="teacherForm.officeNumber" />
        </FormField>

        <ModalActions>
          <Button variant="secondary" @click="closeTeacherModal">Отмена</Button>
          <Button variant="primary" type="submit">
            {{ editingTeacher ? 'Сохранить' : 'Создать' }}
          </Button>
        </ModalActions>
      </Form>
    </Modal>

    <!-- Subject Modal -->
    <Modal v-model="showSubjectModal" size="lg" @close="closeSubjectModal">
      <ModalHeader :title="editingSubject ? 'Редактировать дисциплину' : 'Добавить дисциплину'" @close="closeSubjectModal" />

      <Form @submit.prevent="saveSubject">
        <FormRow>
          <FormField label="Название" required>
            <Input v-model="subjectForm.name" required />
          </FormField>
          <FormField label="Код" required>
            <Input v-model="subjectForm.code" required />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Кредиты" required>
            <NumberInput v-model="subjectForm.credits" :min="1" :max="10" required />
          </FormField>
          <FormField label="Семестр" required>
            <NumberInput v-model="subjectForm.semester" :min="1" :max="12" required />
          </FormField>
        </FormRow>

        <FormField label="Описание">
          <Input v-model="subjectForm.description" />
        </FormField>

        <FormField label="Преподаватель">
          <Select
            v-model="subjectForm.teacherId"
            :options="[
              { value: undefined, label: 'Не выбран' },
              ...allTeachers.map(t => ({ value: t.id, label: `${t.lastName} ${t.firstName}` }))
            ]"
          />
        </FormField>

        <ModalActions>
          <Button variant="secondary" @click="closeSubjectModal">Отмена</Button>
          <Button variant="primary" type="submit">
            {{ editingSubject ? 'Сохранить' : 'Создать' }}
          </Button>
        </ModalActions>
      </Form>
    </Modal>

    <!-- Group Modal -->
    <Modal v-model="showGroupModal" size="md" @close="closeGroupModal">
      <ModalHeader :title="editingGroup ? 'Редактировать группу' : 'Добавить группу'" @close="closeGroupModal" />

      <Form @submit.prevent="saveGroup">
        <FormRow>
          <FormField label="Название" required>
            <Input v-model="groupForm.name" required />
          </FormField>
          <FormField label="Курс" required>
            <NumberInput v-model="groupForm.course" :min="1" :max="6" required />
          </FormField>
        </FormRow>

        <FormField label="Факультет">
          <Select
            v-model="groupForm.facultyId"
            :options="[
              { value: undefined, label: 'Не выбран' },
              ...faculties.map(f => ({ value: f.id, label: f.name }))
            ]"
          />
        </FormField>

        <ModalActions>
          <Button variant="secondary" @click="closeGroupModal">Отмена</Button>
          <Button variant="primary" type="submit">
            {{ editingGroup ? 'Сохранить' : 'Создать' }}
          </Button>
        </ModalActions>
      </Form>
    </Modal>

    <!-- Faculty Modal -->
    <Modal v-model="showFacultyModal" size="sm" @close="closeFacultyModal">
      <ModalHeader :title="editingFaculty ? 'Редактировать факультет' : 'Добавить факультет'" @close="closeFacultyModal" />

      <Form @submit.prevent="saveFaculty">
        <FormField label="Название" required>
          <Input v-model="facultyForm.name" required />
        </FormField>

        <ModalActions>
          <Button variant="secondary" @click="closeFacultyModal">Отмена</Button>
          <Button variant="primary" type="submit">
            {{ editingFaculty ? 'Сохранить' : 'Создать' }}
          </Button>
        </ModalActions>
      </Form>
    </Modal>

    <!-- Specialization Modal -->
    <Modal v-model="showSpecializationModal" size="md" @close="closeSpecializationModal">
      <ModalHeader :title="editingSpecialization ? 'Редактировать специализацию' : 'Добавить специализацию'" @close="closeSpecializationModal" />

      <Form @submit.prevent="saveSpecialization">
        <FormRow>
          <FormField label="Название" required>
            <Input v-model="specializationForm.name" required />
          </FormField>
          <FormField label="Код">
            <Input v-model="specializationForm.code" />
          </FormField>
        </FormRow>

        <FormField label="Факультет" required>
          <Select
            v-model="specializationForm.facultyId"
            :options="[
              { value: undefined, label: 'Не выбран' },
              ...faculties.map(f => ({ value: f.id, label: f.name }))
            ]"
          />
        </FormField>

        <ModalActions>
          <Button variant="secondary" @click="closeSpecializationModal">Отмена</Button>
          <Button variant="primary" type="submit">
            {{ editingSpecialization ? 'Сохранить' : 'Создать' }}
          </Button>
        </ModalActions>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
// Due to file length, continuing with imports and logic from original
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useHttpClient } from '~/shared/api/httpClient'
import { studentsApi } from '~/features/students/api/studentsApi'
import { teachersApi } from '~/features/teachers/api/teachersApi'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import { fetchGroups, createGroup, updateGroup, deleteGroup as deleteGroupApi } from '~/features/groups/api/groupsApi'
import { fetchFaculties, createFaculty, updateFaculty, deleteFaculty } from '~/features/faculties/api/facultiesApi'
import { fetchSpecializations, createSpecialization, updateSpecialization, deleteSpecialization } from '~/features/specializations/api/specializationsApi'
import type { Student } from '~/entities/student'
import type { Teacher } from '~/entities/teacher'
import type { Subject } from '~/entities/subject'
import type { Group } from '~/entities/group'
import {
  Container,
  Header,
  Button,
  Tabs,
  Section,
  SearchInput,
  Select,
  Modal,
  ModalHeader,
  ModalActions,
  Form,
  FormField,
  FormRow,
  Input,
  NumberInput,
  Checkbox,
  LoadingState,
  EmptyState,
} from '~/shared/ui'

definePageMeta({
  middleware: 'admin',
})

const router = useRouter()

const tabs = [
  { key: 'students', label: 'Студенты' },
  { key: 'teachers', label: 'Преподаватели' },
  { key: 'subjects', label: 'Дисциплины' },
  { key: 'groups', label: 'Группы' },
  { key: 'faculties', label: 'Факультеты' },
  { key: 'specializations', label: 'Специализации' },
]

const activeTab = ref('students')

// Students
const students = ref<Student[]>([])
const loadingStudents = ref(false)
const studentsSearch = ref('')
const studentsGroupFilter = ref('')
const showStudentModal = ref(false)
const editingStudent = ref<Student | null>(null)
const studentForm = ref<any>({
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

// Teachers
const teachers = ref<Teacher[]>([])
const allTeachers = ref<Teacher[]>([])
const loadingTeachers = ref(false)
const teachersSearch = ref('')
const showTeacherModal = ref(false)
const editingTeacher = ref<Teacher | null>(null)
const teacherForm = ref<any>({
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
  selectedSubjectIds: [],
})

// Subjects
const subjects = ref<Subject[]>([])
const loadingSubjects = ref(false)
const subjectsSearch = ref('')
const showSubjectModal = ref(false)
const editingSubject = ref<Subject | null>(null)
const subjectForm = ref<any>({
  name: '',
  code: '',
  credits: 1,
  semester: 1,
  description: '',
  teacherId: undefined,
  selectedTeacherIds: [],
})

// Groups
const groups = ref<Group[]>([])
const loadingGroups = ref(false)
const groupsSearch = ref('')
const showGroupModal = ref(false)
const editingGroup = ref<Group | null>(null)
const groupForm = ref<any>({
  name: '',
  course: 1,
  facultyId: undefined,
})

// Faculties
const faculties = ref<any[]>([])
const loadingFaculties = ref(false)
const facultiesSearch = ref('')
const showFacultyModal = ref(false)
const editingFaculty = ref<any>(null)
const facultyForm = ref<any>({
  name: '',
})

// Specializations
const specializations = ref<any[]>([])
const loadingSpecializations = ref(false)
const specializationsSearch = ref('')
const showSpecializationModal = ref(false)
const editingSpecialization = ref<any>(null)
const specializationForm = ref<any>({
  name: '',
  code: '',
  facultyId: undefined,
})

// Students methods
async function searchStudents() {
  loadingStudents.value = true
  try {
    const result = await studentsApi.fetchStudents({
      search: studentsSearch.value,
      limit: 100,
    })
    students.value = result.data

    if (studentsGroupFilter.value) {
      students.value = students.value.filter((s: Student) => s.group?.name === studentsGroupFilter.value)
    }
  } catch (error: any) {
    alert('Ошибка загрузки студентов: ' + (error.message || 'Неизвестная ошибка'))
  } finally {
    loadingStudents.value = false
  }
}

function openStudentModal(student?: Student) {
  if (student) {
    editingStudent.value = student
    studentForm.value = {
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      email: student.user?.email || '',
      password: '',
      groupId: student.groupId,
      course: student.course,
      specializationId: student.specializationId,
      studentId: student.studentId,
      enrollmentYear: student.enrollmentYear,
      phone: student.phone,
      address: student.address,
      birthDate: student.birthDate,
    }
  } else {
    editingStudent.value = null
    studentForm.value = {
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
  showStudentModal.value = true
}

function closeStudentModal() {
  showStudentModal.value = false
  editingStudent.value = null
}

async function saveStudent() {
  try {
    if (editingStudent.value) {
      const updateData = {
        firstName: studentForm.value.firstName,
        lastName: studentForm.value.lastName,
        middleName: studentForm.value.middleName,
        groupId: studentForm.value.groupId,
        course: studentForm.value.course,
        specializationId: studentForm.value.specializationId,
        studentId: studentForm.value.studentId,
        enrollmentYear: studentForm.value.enrollmentYear,
        phone: studentForm.value.phone,
        address: studentForm.value.address,
        birthDate: studentForm.value.birthDate,
      }
      await studentsApi.updateStudent(editingStudent.value.id, updateData as any)
      alert('Студент обновлён')
    } else {
      const httpClient = useHttpClient()
      const registerResponse = await httpClient.post<{ user: { id: number }; accessToken: string }>(
        '/auth/register',
        {
          email: studentForm.value.email,
          password: studentForm.value.password,
          role: 'STUDENT',
        }
      )

      const createData = {
        userId: registerResponse.user.id,
        firstName: studentForm.value.firstName,
        lastName: studentForm.value.lastName,
        middleName: studentForm.value.middleName,
        studentId: studentForm.value.studentId,
        groupId: studentForm.value.groupId,
        course: studentForm.value.course,
        specializationId: studentForm.value.specializationId,
        enrollmentYear: studentForm.value.enrollmentYear,
        phone: studentForm.value.phone,
        address: studentForm.value.address,
        birthDate: studentForm.value.birthDate ? new Date(studentForm.value.birthDate).toISOString() : undefined,
      }
      await studentsApi.createStudent(createData as any)
      alert('Студент создан')
    }
    closeStudentModal()
    await searchStudents()
  } catch (error: any) {
    alert('Ошибка: ' + (error.message || 'Неизвестная ошибка'))
  }
}

async function deleteStudent(id: number) {
  if (!confirm('Вы уверены, что хотите удалить студента?')) return

  try {
    await studentsApi.deleteStudent(id)
    alert('Студент удалён')
    await searchStudents()
  } catch (error: any) {
    alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'))
  }
}

// Teachers methods
async function searchTeachers() {
  loadingTeachers.value = true
  try {
    const result = await teachersApi.fetchTeachers({
      search: teachersSearch.value,
      limit: 100,
    })
    teachers.value = result.data
  } catch (error: any) {
    alert('Ошибка загрузки преподавателей: ' + (error.message || 'Неизвестная ошибка'))
  } finally {
    loadingTeachers.value = false
  }
}

// Subjects methods
async function searchSubjects() {
  loadingSubjects.value = true
  try {
    const result = await subjectsApi.fetchSubjects({
      search: subjectsSearch.value,
      limit: 100,
    })
    subjects.value = result.data
  } catch (error: any) {
    alert('Ошибка загрузки дисциплин: ' + (error.message || 'Неизвестная ошибка'))
  } finally {
    loadingSubjects.value = false
  }
}

// Groups methods
async function searchGroups() {
  loadingGroups.value = true
  try {
    const result = await fetchGroups({ search: groupsSearch.value })
    groups.value = result
  } catch (error: any) {
    alert('Ошибка загрузки групп: ' + (error.message || 'Неизвестная ошибка'))
  } finally {
    loadingGroups.value = false
  }
}

// Faculties methods
async function searchFaculties() {
  loadingFaculties.value = true
  try {
    faculties.value = await fetchFaculties({ search: facultiesSearch.value })
  } catch (error: any) {
    alert('Ошибка загрузки факультетов: ' + (error.message || 'Неизвестная ошибка'))
  } finally {
    loadingFaculties.value = false
  }
}

// Specializations methods
async function searchSpecializations() {
  loadingSpecializations.value = true
  try {
    specializations.value = await fetchSpecializations({ search: specializationsSearch.value })
  } catch (error: any) {
    alert('Ошибка загрузки специализаций: ' + (error.message || 'Неизвестная ошибка'))
  } finally {
    loadingSpecializations.value = false
  }
}

// Teachers CRUD
function openTeacherModal(teacher?: Teacher) {
  if (teacher) {
    editingTeacher.value = teacher
    teacherForm.value = {
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
      selectedSubjectIds: [],
    }
  } else {
    editingTeacher.value = null
    teacherForm.value = {
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
      selectedSubjectIds: [],
    }
  }
  showTeacherModal.value = true
}

function closeTeacherModal() {
  showTeacherModal.value = false
  editingTeacher.value = null
}

async function saveTeacher() {
  try {
    if (editingTeacher.value) {
      await teachersApi.updateTeacher(editingTeacher.value.id, {
        firstName: teacherForm.value.firstName,
        lastName: teacherForm.value.lastName,
        middleName: teacherForm.value.middleName,
        department: teacherForm.value.department,
        position: teacherForm.value.position,
        academicDegree: teacherForm.value.academicDegree,
        phone: teacherForm.value.phone,
        officeNumber: teacherForm.value.officeNumber,
      })
      alert('Преподаватель обновлён')
    } else {
      await teachersApi.createTeacher({
        firstName: teacherForm.value.firstName,
        lastName: teacherForm.value.lastName,
        middleName: teacherForm.value.middleName,
        email: teacherForm.value.email,
        password: teacherForm.value.password,
        department: teacherForm.value.department,
        position: teacherForm.value.position,
        academicDegree: teacherForm.value.academicDegree,
        phone: teacherForm.value.phone,
        officeNumber: teacherForm.value.officeNumber,
      })
      alert('Преподаватель создан')
    }
    closeTeacherModal()
    await searchTeachers()
  } catch (error: any) {
    alert('Ошибка: ' + (error.message || 'Неизвестная ошибка'))
  }
}

async function deleteTeacherItem(id: number) {
  if (!confirm('Вы уверены, что хотите удалить преподавателя?')) return
  try {
    await teachersApi.deleteTeacher(id)
    alert('Преподаватель удалён')
    await searchTeachers()
  } catch (error: any) {
    alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'))
  }
}

// Subjects CRUD
function openSubjectModal(subject?: Subject) {
  if (subject) {
    editingSubject.value = subject
    subjectForm.value = {
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      semester: subject.semester,
      description: subject.description || '',
      teacherId: subject.teacherId,
      selectedTeacherIds: [],
    }
  } else {
    editingSubject.value = null
    subjectForm.value = {
      name: '',
      code: '',
      credits: 1,
      semester: 1,
      description: '',
      teacherId: undefined,
      selectedTeacherIds: [],
    }
  }
  showSubjectModal.value = true
}

function closeSubjectModal() {
  showSubjectModal.value = false
  editingSubject.value = null
}

async function saveSubject() {
  try {
    if (editingSubject.value) {
      await subjectsApi.updateSubject(editingSubject.value.id, {
        name: subjectForm.value.name,
        code: subjectForm.value.code,
        credits: subjectForm.value.credits,
        semester: subjectForm.value.semester,
        description: subjectForm.value.description,
        teacherId: subjectForm.value.teacherId,
      })
      alert('Дисциплина обновлена')
    } else {
      await subjectsApi.createSubject({
        name: subjectForm.value.name,
        code: subjectForm.value.code,
        credits: subjectForm.value.credits,
        semester: subjectForm.value.semester,
        description: subjectForm.value.description,
        teacherId: subjectForm.value.teacherId,
      })
      alert('Дисциплина создана')
    }
    closeSubjectModal()
    await searchSubjects()
  } catch (error: any) {
    alert('Ошибка: ' + (error.message || 'Неизвестная ошибка'))
  }
}

async function deleteSubjectItem(id: number) {
  if (!confirm('Вы уверены, что хотите удалить дисциплину?')) return
  try {
    await subjectsApi.deleteSubject(id)
    alert('Дисциплина удалена')
    await searchSubjects()
  } catch (error: any) {
    alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'))
  }
}

// Groups CRUD
function openGroupModal(group?: Group) {
  if (group) {
    editingGroup.value = group
    groupForm.value = {
      name: group.name,
      course: group.course,
      facultyId: group.facultyId,
    }
  } else {
    editingGroup.value = null
    groupForm.value = {
      name: '',
      course: 1,
      facultyId: undefined,
    }
  }
  showGroupModal.value = true
}

function closeGroupModal() {
  showGroupModal.value = false
  editingGroup.value = null
}

async function saveGroup() {
  try {
    if (editingGroup.value) {
      await updateGroup(editingGroup.value.id, {
        name: groupForm.value.name,
        course: groupForm.value.course,
        facultyId: groupForm.value.facultyId,
      })
      alert('Группа обновлена')
    } else {
      await createGroup({
        name: groupForm.value.name,
        course: groupForm.value.course,
        facultyId: groupForm.value.facultyId,
      })
      alert('Группа создана')
    }
    closeGroupModal()
    await searchGroups()
  } catch (error: any) {
    alert('Ошибка: ' + (error.message || 'Неизвестная ошибка'))
  }
}

async function deleteGroupItem(id: number) {
  if (!confirm('Вы уверены, что хотите удалить группу?')) return
  try {
    await deleteGroupApi(id)
    alert('Группа удалена')
    await searchGroups()
  } catch (error: any) {
    alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'))
  }
}

// Faculties CRUD
function openFacultyModal(faculty?: any) {
  if (faculty) {
    editingFaculty.value = faculty
    facultyForm.value = { name: faculty.name }
  } else {
    editingFaculty.value = null
    facultyForm.value = { name: '' }
  }
  showFacultyModal.value = true
}

function closeFacultyModal() {
  showFacultyModal.value = false
  editingFaculty.value = null
}

async function saveFaculty() {
  try {
    if (editingFaculty.value) {
      await updateFaculty(editingFaculty.value.id, { name: facultyForm.value.name })
      alert('Факультет обновлён')
    } else {
      await createFaculty({ name: facultyForm.value.name })
      alert('Факультет создан')
    }
    closeFacultyModal()
    await searchFaculties()
  } catch (error: any) {
    alert('Ошибка: ' + (error.message || 'Неизвестная ошибка'))
  }
}

async function deleteFacultyItem(id: number) {
  if (!confirm('Вы уверены, что хотите удалить факультет?')) return
  try {
    await deleteFaculty(id)
    alert('Факультет удалён')
    await searchFaculties()
  } catch (error: any) {
    alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'))
  }
}

// Specializations CRUD
function openSpecializationModal(spec?: any) {
  if (spec) {
    editingSpecialization.value = spec
    specializationForm.value = {
      name: spec.name,
      code: spec.code || '',
      facultyId: spec.facultyId,
    }
  } else {
    editingSpecialization.value = null
    specializationForm.value = {
      name: '',
      code: '',
      facultyId: undefined,
    }
  }
  showSpecializationModal.value = true
}

function closeSpecializationModal() {
  showSpecializationModal.value = false
  editingSpecialization.value = null
}

async function saveSpecialization() {
  try {
    if (editingSpecialization.value) {
      await updateSpecialization(editingSpecialization.value.id, {
        name: specializationForm.value.name,
        code: specializationForm.value.code,
        facultyId: specializationForm.value.facultyId,
      })
      alert('Специализация обновлена')
    } else {
      await createSpecialization({
        name: specializationForm.value.name,
        code: specializationForm.value.code,
        facultyId: specializationForm.value.facultyId,
      })
      alert('Специализация создана')
    }
    closeSpecializationModal()
    await searchSpecializations()
  } catch (error: any) {
    alert('Ошибка: ' + (error.message || 'Неизвестная ошибка'))
  }
}

async function deleteSpecializationItem(id: number) {
  if (!confirm('Вы уверены, что хотите удалить специализацию?')) return
  try {
    await deleteSpecialization(id)
    alert('Специализация удалена')
    await searchSpecializations()
  } catch (error: any) {
    alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'))
  }
}

async function logout() {
  const httpClient = useHttpClient()
  httpClient.clearAuth()
  router.push('/login')
}

// Watch for tab changes and load data
watch(activeTab, async (newTab) => {
  if (newTab === 'students') {
    await searchStudents()
  } else if (newTab === 'teachers') {
    await searchTeachers()
  } else if (newTab === 'subjects') {
    await searchSubjects()
  } else if (newTab === 'groups') {
    await searchGroups()
  } else if (newTab === 'faculties') {
    await searchFaculties()
  } else if (newTab === 'specializations') {
    await searchSpecializations()
  }
})

onMounted(async () => {
  await searchStudents()
  await searchGroups()
  await searchFaculties()
  await searchSpecializations()
  const teachersResult = await teachersApi.fetchTeachers({ limit: 200 })
  allTeachers.value = teachersResult.data
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: var(--color-background);
  padding: var(--spacing-5);
}

.tab-content {
  margin-top: var(--spacing-5);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-5);
  gap: var(--spacing-4);
}

.search-filters {
  display: flex;
  gap: var(--spacing-3);
  flex: 1;
  max-width: 600px;
}

.table-wrapper {
  overflow-x: auto;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: var(--color-surface-secondary);
}

.data-table th,
.data-table td {
  padding: var(--spacing-3);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
}

.data-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.data-table td {
  color: var(--color-text-secondary);
}

.data-table tbody tr:hover {
  background: var(--color-surface-hover);
}

.actions {
  display: flex;
  gap: var(--spacing-2);
}
</style>
