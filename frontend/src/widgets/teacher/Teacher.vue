<script setup lang="ts">
import {onMounted, ref} from "vue";
import {UserProfile} from "@/widgets/user-profile";
import {getGroup} from "@/features/fetchGroup.ts";
import {postGradeStudent} from "@/features/fetchGradeForStudent.ts";
import {getStudentByGroup} from "@/features/fetchStudentByGroup.ts";
import type {ITeacher} from "@/entities/teacher/model/types.ts";
import type {IStudent} from "@/entities/student/model/types.ts";
import {getSubjects} from "@/features/fetchSubjects.ts";

const isExam = ref<boolean | null>(null);
const groups = ref<string[]>([]);
const studentsDate = ref<IStudent[]>([]);
const selectedGroup = ref<string>('');
const studentGrades = ref<{[key: number]: number | string}>({});
const subjects = ref<any[]>([]);
const selectedSubject = ref<any>(null);

const setExam = (value: boolean) => {
  isExam.value = value;
  handleGetGroups()
};

async function handleGetGroups() {
  goBackToGroups()

  groups.value = await getGroup();
  console.log("Group data", groups.value);
}


function handleStudentByGroup(groupId: string) {
  selectedGroup.value = groupId;
  getStudentByGroup(groupId, studentsDate, groups, studentGrades, isExam)
}

function setStudentGrade(studentId: number, grade: number | string) {
  studentGrades.value[studentId] = grade;
}

function handleExamGradeChange(studentId: number, event: Event) {
  const target = event.target as HTMLSelectElement;
  if (target) {
    setStudentGrade(studentId, parseInt(target.value));
  }
}

function handleTestGradeChange(studentId: number, event: Event) {
  const target = event.target as HTMLSelectElement;
  if (target) {
    setStudentGrade(studentId, target.value);
  }
}

function goBackToGroups() {
  studentsDate.value = [];
  selectedGroup.value = '';
}

const props = defineProps<{
  infoTeacher: ITeacher;
}>()

function handlePostGrade(studentId: number, studentName: string) {
  if (!selectedSubject.value) {
    alert('Выберите дисциплину');
    return;
  }
  postGradeStudent(
      studentId,
      studentName,
      studentGrades,
      isExam,
      props.infoTeacher,
      selectedSubject.value
  );
}

const emit = defineEmits<{
  reset: []
}>()

function handleReset() {
  emit("reset")
}

onMounted(async () => {
  subjects.value = await getSubjects();
})
</script>

<template>
  <div>
    <!-- Teacher Info Section -->
    <div v-if="infoTeacher" class="teacher-section">
      <div class="section-header">
        <h2 class="section-title">Найденный преподаватель</h2>
        <div class="section-actions">
          <button @click="handleReset" class="action-button secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2"/>
            </svg>
            Сбросить
          </button>
          <button v-if="isExam !== null" @click="handleGetGroups" class="action-button primary">
            Получить группы
          </button>
        </div>
      </div>

      <div class="container-date__info">
        <!-- Teacher Profile -->
        <div class="teacher-profile-section">
          <user-profile :users="infoTeacher" />

          <!-- Type Selection Modal -->
          <div v-if="isExam === null" class="type-selection-modal">
            <div class="modal-content">
              <h3>Выберите тип оценки</h3>
              <div class="type-buttons">
                <button @click="setExam(true)" class="type-button exam">
                  <div class="type-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </div>
                  <span>Экзамен</span>
                  <small>Оценка от 0 до 10</small>
                </button>
                <button @click="setExam(false)" class="type-button test">
                  <div class="type-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10M7 12H17M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </div>
                  <span>Зачет</span>
                  <small>Зачет/Незачет</small>
                </button>
              </div>
            </div>
          </div>

          <!-- Current Type Badge -->
          <div v-else class="current-type-badge">
            <div class="badge" :class="isExam ? 'exam' : 'test'">
              <span>{{ isExam ? 'Экзамен' : 'Зачет' }}</span>
              <button @click="isExam = null" class="change-type-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Groups and Students Section -->
        <div class="content-section">
          <!-- Groups List -->
          <div v-if="groups && groups.length > 0 && studentsDate.length === 0" class="groups-container">
            <div class="section-header">
              <h3 class="section-subtitle">Выберите группу</h3>
              <span class="groups-count">{{ groups.length }} групп</span>
            </div>
            <div class="groups-grid">
              <div
                  v-for="group in groups"
                  :key="group"
                  class="group-card"
                  @click="handleStudentByGroup(group)"
              >
                <div class="group-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21V19C17 17.3431 15.6569 16 14 16H10C8.34315 16 7 17.3431 7 19V21" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
                <span class="group-name">{{ group }}</span>
                <div class="group-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Students List -->
          <div v-if="studentsDate && studentsDate.length > 0" class="students-container">
            <div class="students-header">
              <div>
                <h3 class="section-subtitle">Студенты группы {{ selectedGroup }}</h3>
                <p class="students-count">{{ studentsDate.length }} студентов</p>
              </div>
              <div class="subject-selector">
                <div>
                  <select v-model="selectedSubject" class="subject-select">
                    <option :value="null">Выберите дисциплину</option>
                    <option
                        v-for="subject in subjects"
                        :key="subject.id"
                        :value="subject"
                    >
                      {{ subject.name }} ({{ subject.hours }} ч.)
                    </option>
                  </select>
                </div>
                <button @click="goBackToGroups" class="back-button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Назад к группам
                </button>
              </div>
            </div>

            <div class="students-list">
              <div v-for="student in studentsDate" :key="student.id" class="student-card">
                <div class="student-info">
                  <div class="student-name">
                    {{ student.last_name || '' }} {{ student.name || '' }} {{ student.middle_name || '' }}
                  </div>
                  <div class="student-details">
                    <span class="faculty">{{ student.faculty || '' }}</span>
                    <span class="speciality">{{ student.speciality || '' }}</span>
                  </div>
                </div>

                <div class="grade-section">
                  <div class="grade-selector">
                    <label>Оценка:</label>
                    <select
                        v-if="isExam"
                        :value="studentGrades[student.id]"
                        @change="handleExamGradeChange(student.id, $event)"
                        class="grade-select"
                    >
                      <option v-for="n in 11" :key="n" :value="n-1">{{ n-1 }}</option>
                    </select>
                    <select
                        v-else
                        :value="studentGrades[student.id]"
                        @change="handleTestGradeChange(student.id, $event)"
                        class="grade-select"
                    >
                      <option value="зачет">Зачет</option>
                      <option value="незачет">Незачет</option>
                    </select>
                  </div>

                  <button
                      @click="handlePostGrade(student.id, student.name)"
                      class="add-grade-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Добавить оценку
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="(!groups || groups.length === 0) && studentsDate.length === 0 && isExam !== null" class="empty-state">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                      stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <h3>Нажмите "Получить группы"</h3>
            <p>Для отображения списка доступных групп</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Discipline */
.subject-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.subject-select {
  max-width: 200px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.subject-select option {
  background: #2d3748;
  color: white;
}

.container-date__info {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 32px;
  align-items: start;
}

.teacher-profile-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
}

/* Type Selection Modal */
.type-selection-modal {
  margin-top: 20px;
}

.modal-content {
  text-align: center;
}

.modal-content h3 {
  color: white;
  margin-bottom: 20px;
  font-size: 1.25rem;
}

.type-buttons {
  display: grid;
  gap: 12px;
}

.type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.type-button.exam {
  border-color: #ff6b6b;
}

.type-button.test {
  border-color: #51cf66;
}

.type-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-button small {
  opacity: 0.8;
  font-size: 0.75rem;
}

/* Current Type Badge */
.current-type-badge {
  margin-top: 16px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.badge.exam {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
}

.badge.test {
  background: linear-gradient(135deg, #51cf66, #40c057);
  color: white;
}

.change-type-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.change-type-btn:hover {
  opacity: 1;
}

/* Content Section */
.content-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-height: 400px;
}

.section-subtitle {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.groups-count,
.students-count {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
}

/* Groups Grid */
.groups-grid {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.group-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.group-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.group-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.group-name {
  color: white;
  font-weight: 600;
  flex: 1;
}

.group-arrow {
  color: rgba(255, 255, 255, 0.6);
}

/* Students Section */
.students-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 8px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.students-list {
  display: grid;
  gap: 16px;
}

.student-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.student-card:hover {
  background: rgba(255, 255, 255, 0.15);
}

.student-info {
  color: white;
  flex: 1;
}

.student-name {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.student-details {
  display: flex;
  gap: 12px;
  font-size: 0.875rem;
}

.faculty,
.speciality {
  color: rgba(255, 255, 255, 0.8);
}

.grade-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.grade-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
}

.grade-select {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  min-width: 80px;
}

.grade-select option {
  background: #2d3748;
  color: white;
}

.add-grade-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.add-grade-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
}

.empty-state h3 {
  margin-bottom: 8px;
  font-size: 1.25rem;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.action-button.primary {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

/* Responsive */
@media (max-width: 968px) {
  .container-date__info {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .student-card {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .grade-section {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .students-header {
    flex-direction: column;
    gap: 12px;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

/* Стили такие же как у студенческого компонента */
.gradebook-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.search-input:focus + .input-decoration {
  width: 100%;
}

/* Teacher Section */
.teacher-section {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.section-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.action-button.secondary {
  background: transparent;
}

/* Features Section */
.features-section {
  max-width: 1200px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

.feature-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
}

.feature-card h3 {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.feature-card p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
}

/* Responsive Design */
@media (max-width: 768px) {

  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .gradebook-container {
    padding: 10px;
  }

}
</style>