<template>
  <div class="admin-page">
    <div class="container">
      <header class="header">
        <h1>Панель администратора</h1>
        <button @click="logout" class="logout-button">Выйти</button>
      </header>

      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content">
        <!-- Students Tab -->
        <div v-if="activeTab === 'students'" class="section">
          <div class="section-header">
            <div class="search-filters">
              <input
                v-model="studentsSearch"
                type="text"
                placeholder="Поиск по имени..."
                class="search-input"
                @input="searchStudents"
              />
              <select v-model="studentsGroupFilter" class="filter-select" @change="searchStudents">
                <option value="">Все группы</option>
                <option v-for="group in groups" :key="group.id" :value="group.name">
                  {{ group.name }}
                </option>
              </select>
            </div>
            <button @click="openStudentModal()" class="add-button">+ Добавить студента</button>
          </div>

          <div v-if="loadingStudents" class="loading">Загрузка...</div>
          <div v-else-if="students.length === 0" class="empty">Студенты не найдены</div>
          <div v-else class="table-container">
            <table>
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
                  <td class="actions">
                    <button @click="openStudentModal(student)" class="edit-btn">Редактировать</button>
                    <button @click="deleteStudent(student.id)" class="delete-btn">Удалить</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Teachers Tab -->
        <div v-if="activeTab === 'teachers'" class="section">
          <div class="section-header">
            <input
              v-model="teachersSearch"
              type="text"
              placeholder="Поиск по имени..."
              class="search-input"
              @input="searchTeachers"
            />
            <button @click="openTeacherModal()" class="add-button">+ Добавить преподавателя</button>
          </div>

          <div v-if="loadingTeachers" class="loading">Загрузка...</div>
          <div v-else-if="teachers.length === 0" class="empty">Преподаватели не найдены</div>
          <div v-else class="table-container">
            <table>
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
                  <td class="actions">
                    <button @click="openTeacherModal(teacher)" class="edit-btn">Редактировать</button>
                    <button @click="deleteTeacher(teacher.id)" class="delete-btn">Удалить</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Subjects Tab -->
        <div v-if="activeTab === 'subjects'" class="section">
          <div class="section-header">
            <input
              v-model="subjectsSearch"
              type="text"
              placeholder="Поиск по названию..."
              class="search-input"
              @input="searchSubjects"
            />
            <button @click="openSubjectModal()" class="add-button">+ Добавить дисциплину</button>
          </div>

          <div v-if="loadingSubjects" class="loading">Загрузка...</div>
          <div v-else-if="subjects.length === 0" class="empty">Дисциплины не найдены</div>
          <div v-else class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Код</th>
                  <th>Кредиты</th>
                  <th>Семестр</th>
                  <th>Преподаватель</th>
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
                    {{
                      subject.teacher
                        ? `${subject.teacher.lastName} ${subject.teacher.firstName.charAt(0)}.`
                        : '-'
                    }}
                  </td>
                  <td class="actions">
                    <button @click="openSubjectModal(subject)" class="edit-btn">Редактировать</button>
                    <button @click="deleteSubject(subject.id)" class="delete-btn">Удалить</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Groups Tab -->
        <div v-if="activeTab === 'groups'" class="section">
          <div class="section-header">
            <input
              v-model="groupsSearch"
              type="text"
              placeholder="Поиск по названию..."
              class="search-input"
              @input="searchGroups"
            />
            <button @click="openGroupModal()" class="add-button">+ Добавить группу</button>
          </div>

          <div v-if="loadingGroups" class="loading">Загрузка...</div>
          <div v-else-if="groups.length === 0" class="empty">Группы не найдены</div>
          <div v-else class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Курс</th>
                  <th>Факультет</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="group in groups" :key="group.id">
                  <td>{{ group.name }}</td>
                  <td>{{ group.course }}</td>
                  <td>-</td>
                  <td class="actions">
                    <button @click="openGroupModal(group)" class="edit-btn">Редактировать</button>
                    <button @click="deleteGroup(group.id)" class="delete-btn">Удалить</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Faculties Tab -->
        <div v-if="activeTab === 'faculties'" class="section">
          <div class="section-header">
            <input
              v-model="facultiesSearch"
              type="text"
              placeholder="Поиск по названию..."
              class="search-input"
              @input="searchFaculties"
            />
            <button @click="openFacultyModal()" class="add-button">+ Добавить факультет</button>
          </div>

          <div v-if="loadingFaculties" class="loading">Загрузка...</div>
          <div v-else-if="faculties.length === 0" class="empty">Факультеты не найдены</div>
          <div v-else class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Специализации</th>
                  <th>Группы</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="faculty in faculties" :key="faculty.id">
                  <td>{{ faculty.name }}</td>
                  <td>{{ faculty._count?.specializations || 0 }}</td>
                  <td>{{ faculty._count?.groups || 0 }}</td>
                  <td class="actions">
                    <button @click="openFacultyModal(faculty)" class="edit-btn">Редактировать</button>
                    <button @click="deleteFacultyItem(faculty.id)" class="delete-btn">Удалить</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Specializations Tab -->
        <div v-if="activeTab === 'specializations'" class="section">
          <div class="section-header">
            <input
              v-model="specializationsSearch"
              type="text"
              placeholder="Поиск по названию..."
              class="search-input"
              @input="searchSpecializations"
            />
            <button @click="openSpecializationModal()" class="add-button">+ Добавить специализацию</button>
          </div>

          <div v-if="loadingSpecializations" class="loading">Загрузка...</div>
          <div v-else-if="specializations.length === 0" class="empty">Специализации не найдены</div>
          <div v-else class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Код</th>
                  <th>Факультет</th>
                  <th>Студентов</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="spec in specializations" :key="spec.id">
                  <td>{{ spec.name }}</td>
                  <td>{{ spec.code || '-' }}</td>
                  <td>{{ spec.faculty?.name || '-' }}</td>
                  <td>{{ spec._count?.students || 0 }}</td>
                  <td class="actions">
                    <button @click="openSpecializationModal(spec)" class="edit-btn">Редактировать</button>
                    <button @click="deleteSpecializationItem(spec.id)" class="delete-btn">Удалить</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Student Modal -->
    <div v-if="showStudentModal" class="modal-overlay" @click.self="closeStudentModal">
      <div class="modal">
        <h2>{{ editingStudent ? 'Редактировать студента' : 'Добавить студента' }}</h2>
        <form @submit.prevent="saveStudent" class="form">
          <div class="form-row">
            <div class="form-field">
              <label>Фамилия *</label>
              <input v-model="studentForm.lastName" required type="text" />
            </div>
            <div class="form-field">
              <label>Имя *</label>
              <input v-model="studentForm.firstName" required type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Отчество</label>
              <input v-model="studentForm.middleName" type="text" />
            </div>
            <div class="form-field">
              <label>Email *</label>
              <input v-model="studentForm.email" required type="email" />
            </div>
          </div>
          <div class="form-row" v-if="!editingStudent">
            <div class="form-field">
              <label>Пароль *</label>
              <input v-model="studentForm.password" required type="password" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Группа</label>
              <select v-model.number="studentForm.groupId">
                <option :value="undefined">Не выбрана</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
            </div>
            <div class="form-field">
              <label>Курс *</label>
              <input v-model.number="studentForm.course" required type="number" min="1" max="6" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Специализация</label>
              <select v-model.number="studentForm.specializationId">
                <option :value="undefined">Не выбрана</option>
                <option v-for="spec in specializations" :key="spec.id" :value="spec.id">
                  {{ spec.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Номер зачётки *</label>
              <input v-model="studentForm.studentId" required type="text" />
            </div>
            <div class="form-field">
              <label>Год поступления *</label>
              <input
                v-model.number="studentForm.enrollmentYear"
                required
                type="number"
                min="2000"
                max="2030"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Телефон</label>
              <input v-model="studentForm.phone" type="tel" />
            </div>
            <div class="form-field">
              <label>Дата рождения</label>
              <input v-model="studentForm.birthDate" type="date" />
            </div>
          </div>
          <div class="form-field">
            <label>Адрес</label>
            <input v-model="studentForm.address" type="text" />
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeStudentModal" class="cancel-btn">Отмена</button>
            <button type="submit" class="submit-btn">
              {{ editingStudent ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Teacher Modal -->
    <div v-if="showTeacherModal" class="modal-overlay" @click.self="closeTeacherModal">
      <div class="modal">
        <h2>{{ editingTeacher ? 'Редактировать преподавателя' : 'Добавить преподавателя' }}</h2>
        <form @submit.prevent="saveTeacher" class="form">
          <div class="form-row">
            <div class="form-field">
              <label>Фамилия *</label>
              <input v-model="teacherForm.lastName" required type="text" />
            </div>
            <div class="form-field">
              <label>Имя *</label>
              <input v-model="teacherForm.firstName" required type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Отчество</label>
              <input v-model="teacherForm.middleName" type="text" />
            </div>
            <div class="form-field">
              <label>Email *</label>
              <input v-model="teacherForm.email" required type="email" />
            </div>
          </div>
          <div class="form-row" v-if="!editingTeacher">
            <div class="form-field">
              <label>Пароль *</label>
              <input v-model="teacherForm.password" required type="password" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Кафедра *</label>
              <input v-model="teacherForm.department" required type="text" />
            </div>
            <div class="form-field">
              <label>Должность *</label>
              <input v-model="teacherForm.position" required type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Учёная степень</label>
              <input v-model="teacherForm.academicDegree" type="text" />
            </div>
            <div class="form-field">
              <label>Телефон</label>
              <input v-model="teacherForm.phone" type="tel" />
            </div>
          </div>
          <div class="form-field">
            <label>Номер кабинета</label>
            <input v-model="teacherForm.officeNumber" type="text" />
          </div>

          <div class="form-field">
            <label>Дисциплины</label>
            <div class="multiselect-container">
              <label v-for="subject in subjects" :key="subject.id" class="checkbox-label">
                <input
                  type="checkbox"
                  :value="subject.id"
                  v-model="teacherForm.selectedSubjectIds"
                />
                {{ subject.name }} ({{ subject.code }})
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeTeacherModal" class="cancel-btn">Отмена</button>
            <button type="submit" class="submit-btn">
              {{ editingTeacher ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Subject Modal -->
    <div v-if="showSubjectModal" class="modal-overlay" @click.self="closeSubjectModal">
      <div class="modal">
        <h2>{{ editingSubject ? 'Редактировать дисциплину' : 'Добавить дисциплину' }}</h2>
        <form @submit.prevent="saveSubject" class="form">
          <div class="form-row">
            <div class="form-field">
              <label>Название *</label>
              <input v-model="subjectForm.name" required type="text" />
            </div>
            <div class="form-field">
              <label>Код *</label>
              <input v-model="subjectForm.code" required type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Кредиты *</label>
              <input v-model.number="subjectForm.credits" required type="number" min="1" max="10" />
            </div>
            <div class="form-field">
              <label>Семестр *</label>
              <input v-model.number="subjectForm.semester" required type="number" min="1" max="12" />
            </div>
          </div>
          <div class="form-field">
            <label>Преподаватели</label>
            <div class="multiselect-container">
              <label v-for="teacher in allTeachers" :key="teacher.id" class="checkbox-label">
                <input
                  type="checkbox"
                  :value="teacher.id"
                  v-model="subjectForm.selectedTeacherIds"
                />
                {{ teacher.lastName }} {{ teacher.firstName }} {{ teacher.middleName }}
              </label>
            </div>
          </div>
          <div class="form-field">
            <label>Описание</label>
            <textarea v-model="subjectForm.description" rows="3"></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeSubjectModal" class="cancel-btn">Отмена</button>
            <button type="submit" class="submit-btn">
              {{ editingSubject ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Group Modal -->
    <div v-if="showGroupModal" class="modal-overlay" @click.self="closeGroupModal">
      <div class="modal">
        <h2>{{ editingGroup ? 'Редактировать группу' : 'Добавить группу' }}</h2>
        <form @submit.prevent="saveGroup" class="form">
          <div class="form-field">
            <label>Название *</label>
            <input v-model="groupForm.name" required type="text" placeholder="Например: ИС-201" />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Курс *</label>
              <input v-model.number="groupForm.course" required type="number" min="1" max="6" />
            </div>
            <div class="form-field">
              <label>Факультет</label>
              <select v-model.number="groupForm.facultyId">
                <option :value="undefined">Не выбран</option>
                <option v-for="faculty in faculties" :key="faculty.id" :value="faculty.id">
                  {{ faculty.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeGroupModal" class="cancel-btn">Отмена</button>
            <button type="submit" class="submit-btn">
              {{ editingGroup ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Faculty Modal -->
    <div v-if="showFacultyModal" class="modal-overlay" @click.self="closeFacultyModal">
      <div class="modal">
        <h2>{{ editingFaculty ? 'Редактировать факультет' : 'Добавить факультет' }}</h2>
        <form @submit.prevent="saveFaculty" class="form">
          <div class="form-field">
            <label>Название *</label>
            <input v-model="facultyForm.name" required type="text" placeholder="Например: Факультет информационных технологий" />
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeFacultyModal" class="cancel-btn">Отмена</button>
            <button type="submit" class="submit-btn">
              {{ editingFaculty ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Specialization Modal -->
    <div v-if="showSpecializationModal" class="modal-overlay" @click.self="closeSpecializationModal">
      <div class="modal">
        <h2>{{ editingSpecialization ? 'Редактировать специализацию' : 'Добавить специализацию' }}</h2>
        <form @submit.prevent="saveSpecialization" class="form">
          <div class="form-field">
            <label>Название *</label>
            <input v-model="specializationForm.name" required type="text" placeholder="Например: Информационные системы и технологии" />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Код</label>
              <input v-model="specializationForm.code" type="text" placeholder="Например: 1-40 05 01" />
            </div>
            <div class="form-field">
              <label>Факультет *</label>
              <select v-model.number="specializationForm.facultyId" required>
                <option :value="undefined">Выберите факультет</option>
                <option v-for="faculty in faculties" :key="faculty.id" :value="faculty.id">
                  {{ faculty.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeSpecializationModal" class="cancel-btn">Отмена</button>
            <button type="submit" class="submit-btn">
              {{ editingSpecialization ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

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

const router = useRouter()

const tabs = [
  { id: 'students', label: 'Студенты' },
  { id: 'teachers', label: 'Преподаватели' },
  { id: 'subjects', label: 'Дисциплины' },
  { id: 'groups', label: 'Группы' },
  { id: 'faculties', label: 'Факультеты' },
  { id: 'specializations', label: 'Специализации' },
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
      // Update student - only send fields that backend accepts
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
      // First, register the user
      const httpClient = useHttpClient()
      const registerResponse = await httpClient.post<{ user: { id: number }; accessToken: string }>(
        '/auth/register',
        {
          email: studentForm.value.email,
          password: studentForm.value.password,
          role: 'STUDENT',
        }
      )

      // Then create the student with the userId
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

async function openTeacherModal(teacher?: Teacher) {
  if (teacher) {
    editingTeacher.value = teacher
    teacherForm.value = {
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      middleName: teacher.middleName,
      email: teacher.user?.email || '',
      password: '',
      department: teacher.department,
      position: teacher.position,
      academicDegree: teacher.academicDegree,
      phone: teacher.phone,
      officeNumber: teacher.officeNumber,
      selectedSubjectIds: [],
    }

    // Load teacher's subjects
    try {
      const teacherSubjects = await teachersApi.getTeacherSubjects(teacher.id)
      teacherForm.value.selectedSubjectIds = teacherSubjects.map((s: any) => s.id)
    } catch (error) {
      console.error('Failed to load teacher subjects:', error)
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
    let teacherId: number

    if (editingTeacher.value) {
      const updateData: any = {
        firstName: teacherForm.value.firstName,
        lastName: teacherForm.value.lastName,
        middleName: teacherForm.value.middleName,
        department: teacherForm.value.department,
        position: teacherForm.value.position,
        academicDegree: teacherForm.value.academicDegree,
        phone: teacherForm.value.phone,
        officeNumber: teacherForm.value.officeNumber,
      }
      await teachersApi.updateTeacher(editingTeacher.value.id, updateData)
      teacherId = editingTeacher.value.id
      alert('Преподаватель обновлён')
    } else {
      // First, register the user
      const httpClient = useHttpClient()
      const registerResponse = await httpClient.post<{ user: { id: number }; accessToken: string }>(
        '/auth/register',
        {
          email: teacherForm.value.email,
          password: teacherForm.value.password,
          role: 'TEACHER',
        }
      )

      // Then create the teacher with the userId
      const createData = {
        userId: registerResponse.user.id,
        firstName: teacherForm.value.firstName,
        lastName: teacherForm.value.lastName,
        middleName: teacherForm.value.middleName,
        department: teacherForm.value.department,
        position: teacherForm.value.position,
        academicDegree: teacherForm.value.academicDegree,
        phone: teacherForm.value.phone,
        officeNumber: teacherForm.value.officeNumber,
      }
      const createdTeacher = await teachersApi.createTeacher(createData as any)
      teacherId = createdTeacher.id
      alert('Преподаватель создан')
    }

    // Assign subjects to teacher
    if (teacherForm.value.selectedSubjectIds.length > 0) {
      await teachersApi.assignSubjects(teacherId, teacherForm.value.selectedSubjectIds)
    }

    closeTeacherModal()
    await searchTeachers()
  } catch (error: any) {
    alert('Ошибка: ' + (error.message || 'Неизвестная ошибка'))
  }
}

async function deleteTeacher(id: number) {
  if (!confirm('Вы уверены, что хотите удалить преподавателя?')) return

  try {
    await teachersApi.deleteTeacher(id)
    alert('Преподаватель удалён')
    await searchTeachers()
  } catch (error: any) {
    alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'))
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

async function openSubjectModal(subject?: Subject) {
  if (subject) {
    editingSubject.value = subject
    subjectForm.value = {
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      semester: subject.semester,
      description: subject.description,
      teacherId: subject.teacherId,
      selectedTeacherIds: [],
    }

    // Load subject's teachers
    try {
      const subjectTeachers = await subjectsApi.getSubjectTeachers(subject.id)
      subjectForm.value.selectedTeacherIds = subjectTeachers.map((t: any) => t.id)
    } catch (error) {
      console.error('Failed to load subject teachers:', error)
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
    let subjectId: number

    if (editingSubject.value) {
      await subjectsApi.updateSubject(editingSubject.value.id, subjectForm.value)
      subjectId = editingSubject.value.id
      alert('Дисциплина обновлена')
    } else {
      const createdSubject = await subjectsApi.createSubject(subjectForm.value)
      subjectId = createdSubject.id
      alert('Дисциплина создана')
    }

    // Assign teachers to subject
    if (subjectForm.value.selectedTeacherIds.length > 0) {
      await subjectsApi.assignTeachers(subjectId, subjectForm.value.selectedTeacherIds)
    }

    closeSubjectModal()
    await searchSubjects()
  } catch (error: any) {
    alert('Ошибка: ' + (error.message || 'Неизвестная ошибка'))
  }
}

async function deleteSubject(id: number) {
  if (!confirm('Вы уверены, что хотите удалить дисциплину?')) return

  try {
    await subjectsApi.deleteSubject(id)
    alert('Дисциплина удалена')
    await searchSubjects()
  } catch (error: any) {
    alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'))
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
      await updateGroup(editingGroup.value.id, groupForm.value)
      alert('Группа обновлена')
    } else {
      await createGroup(groupForm.value)
      alert('Группа создана')
    }
    closeGroupModal()
    await searchGroups()
  } catch (error: any) {
    alert('Ошибка: ' + (error.message || 'Неизвестная ошибка'))
  }
}

async function deleteGroup(id: number) {
  if (!confirm('Вы уверены, что хотите удалить группу?')) return

  try {
    await deleteGroupApi(id)
    alert('Группа удалена')
    await searchGroups()
  } catch (error: any) {
    alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'))
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
      await updateFaculty(editingFaculty.value.id, facultyForm.value)
      alert('Факультет обновлён')
    } else {
      await createFaculty(facultyForm.value)
      alert('Факультет создан')
    }
    closeFacultyModal()
    await searchFaculties()
    await searchGroups()
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

function openSpecializationModal(specialization?: any) {
  if (specialization) {
    editingSpecialization.value = specialization
    specializationForm.value = {
      name: specialization.name,
      code: specialization.code,
      facultyId: specialization.facultyId,
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
      await updateSpecialization(editingSpecialization.value.id, specializationForm.value)
      alert('Специализация обновлена')
    } else {
      await createSpecialization(specializationForm.value)
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

async function loadAllTeachers() {
  try {
    const result = await teachersApi.fetchTeachers({ limit: 1000 })
    allTeachers.value = result.data
  } catch (error) {
    console.error('Failed to load teachers for dropdown:', error)
  }
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
  await loadAllTeachers()
  await searchSubjects()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  color: #333;
  margin: 0;
}

.logout-button {
  padding: 10px 20px;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.logout-button:hover {
  background: #c53030;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.tab {
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.tab:hover {
  color: #333;
}

.tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.search-filters {
  display: flex;
  gap: 10px;
  flex: 1;
  max-width: 600px;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.add-button {
  padding: 10px 20px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.add-button:hover {
  background: #3da011;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

td {
  color: #666;
  font-size: 14px;
}

tbody tr:hover {
  background: #f8f9fa;
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.edit-btn {
  background: #1890ff;
  color: white;
}

.edit-btn:hover {
  background: #096dd9;
}

.delete-btn {
  background: #ff4d4f;
  color: white;
}

.delete-btn:hover {
  background: #cf1322;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 20px 0;
  font-size: 22px;
  color: #333;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-field label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-field input,
.form-field select,
.form-field textarea {
  padding: 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #1890ff;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn,
.submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.cancel-btn {
  background: #f0f0f0;
  color: #333;
}

.cancel-btn:hover {
  background: #d9d9d9;
}

.submit-btn {
  background: #1890ff;
  color: white;
}

.submit-btn:hover {
  background: #096dd9;
}

.multiselect-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 10px;
  background: #f8f9fa;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.checkbox-label:hover {
  background: #e9ecef;
  border-radius: 4px;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-filters {
    flex-direction: column;
    max-width: none;
  }
}
</style>
