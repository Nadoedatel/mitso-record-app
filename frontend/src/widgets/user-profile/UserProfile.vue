<script setup lang="ts">
import {computed, ref} from 'vue';
import type {IGrade} from "@/entities/grade/model/types.ts";

const props = defineProps({
  users: {
    type: Object,
    required: true
  }
});

// Реактивная переменная для фильтра оценок
const gradeFilter = ref<'all' | 'exam' | 'test'>('all');

// Функция для установки фильтра
function setGradeFilter(filter: 'all' | 'exam' | 'test') {
  gradeFilter.value = filter;
}

// Отфильтрованные оценки
const filteredGrades = computed(() => {
  if (!props.users.grades) return [];

  if (gradeFilter.value === 'all') {
    return props.users.grades;
  }

  return props.users.grades.filter((grade: IGrade) => grade.type === gradeFilter.value);
});

// Определяем роль пользователя на основе структуры данных
const userRole = computed(() => {
  return props.users.grades || props.users.faculty || props.users.speciality ? 'student' : 'teacher';
});

// Полное имя пользователя
const fullName = computed(() => {
  const { last_name, name, middle_name } = props.users;
  return [last_name, name, middle_name].filter(Boolean).join(' ');
});

// Инициалы для аватара
const getInitials = computed(() => {
  const { last_name, name, middle_name } = props.users;
  const first = name?.[0] || '';
  const last = last_name?.[0] || '';
  return (first + last).toUpperCase();
});

// Статистика по оценкам (для студентов)
const totalSubjects = computed(() => {
  return new Set(filteredGrades.value.map((grade: any) => grade.subject_name)).size;
});

const averageGrade = computed(() => {
  if (!filteredGrades.value.length) return 0;
  const examGrades = filteredGrades.value.filter((grade: any) => grade.type === 'exam');
  if (examGrades.length === 0) return 0;

  const sum = examGrades.reduce((acc: number, grade: any) => acc + grade.grade_value, 0);
  return (sum / examGrades.length).toFixed(1);
});

// Статистика по предметам (для преподавателей)
const totalHours = computed(() => {
  if (!props.users.subjects?.length) return 0;
  return props.users.subjects.reduce((acc: number, subject: any) => acc + (subject.hours_per_week || 0), 0);
});

// Проверка наличия дополнительной информации
const hasAdditionalInfo = computed(() => {
  return props.users.student_id || props.users.teacher_id || props.users.group ||
      props.users.position || props.users.employment_date ||
      props.users.email || props.users.phone;
});

// Проверка наличия любых данных
const hasAnyData = computed(() => {
  return (props.users.grades && props.users.grades.length > 0) ||
      (props.users.subjects && props.users.subjects.length > 0) ||
      hasAdditionalInfo.value;
});

function formatGradeValue(grade: IGrade): string {
  if (grade.type === 'exam') {
    return grade.grade_value.toString();
  } else {
    return grade.grade_value === 1 ? 'Зачет' : 'Незачет';
  }
}

// Вспомогательные функции
function getGradeClass(grade: IGrade): string {
  if (grade.type === 'exam') {
    const numericGrade = Number(grade.grade_value);
    if (numericGrade >= 8) return 'excellent';
    if (numericGrade >= 6) return 'good';
    if (numericGrade >= 4) return 'satisfactory';
    return 'unsatisfactory';
  } else {
    return grade.grade_value === 1 ? 'excellent' : 'unsatisfactory';
  }
}

const getGradeType = (type: string) => {
  const types: { [key: string]: string } = {
    'exam': 'Экзамен',
    'test': 'Зачет',
  };
  return types[type] || type;
};

const getSubjectType = (type: string) => {
  const types: { [key: string]: string } = {
    'lecture': 'Лекция',
    'seminar': 'Семинар',
    'lab': 'Лабораторная работа',
    'practice': 'Практика'
  };
  return types[type] || type;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<template>
  <div class="user-profile">
    <!-- Profile Header -->
    <div class="profile-header" :class="userRole === 'teacher' ? 'profile-header__teacher' : 'profile-profile-header'">
      <div class="avatar-section">
        <div class="avatar">
          {{ getInitials }}
        </div>
        <div class="user-badge">
          {{ userRole === 'student' ? 'Студент' : 'Преподаватель' }}
        </div>
      </div>

      <div class="profile-info">
        <h1 class="user-name">
          {{ fullName }}
        </h1>
        <div class="user-meta">
          <!-- Для студентов -->
          <div v-if="users.faculty" class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 14L12 20M12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14ZM12 14V20M12 20H7M12 20H17"
                    stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>{{ users.faculty }}</span>
          </div>

          <div v-if="users.speciality" class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>{{ users.speciality }}</span>
          </div>

          <div v-if="users.enrollment_date" class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z"
                    stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>Поступил: {{ formatDate(users.enrollment_date) }}</span>
          </div>

          <!-- Для преподавателей -->
          <div v-if="users.department" class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21L21 21M19 21H14M5 21L3 21M5 21H10M9 6.5H15M9 10.5H15M9 14.5H15"
                    stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>{{ users.department }}</span>
          </div>

          <div v-if="users.academic_degree" class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                    stroke="currentColor" stroke-width="2"/>
              <path d="M19.4 15C19.2669 15.3017 19.1338 15.6034 19.0007 15.9051C18.5299 16.9255 18.0589 17.9458 17.5881 18.9662C17.281 19.6298 16.974 20.2933 16.6669 20.9569C16.295 21.7631 15.4461 22.2609 14.524 22.2609H9.47598C8.55392 22.2609 7.70498 21.7631 7.33308 20.9569C7.02606 20.2933 6.71904 19.6298 6.41192 18.9662C5.94108 17.9458 5.47015 16.9255 4.99931 15.9051C4.86619 15.6034 4.73308 15.3017 4.59996 15C4.73308 14.6983 4.86619 14.3966 4.99931 14.0949C5.47015 13.0745 5.94108 12.0542 6.41192 11.0338C6.71904 10.3702 7.02606 9.70672 7.33308 9.04312C7.70498 8.23694 8.55392 7.73914 9.47598 7.73914H14.524C15.4461 7.73914 16.295 8.23694 16.6669 9.04312C16.974 9.70672 17.281 10.3702 17.5881 11.0338C18.0589 12.0542 18.5299 13.0745 19.0007 14.0949C19.1338 14.3966 19.2669 14.6983 19.4 15Z"
                    stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>{{ users.academic_degree }}</span>
          </div>

          <div v-if="users.work_experience" class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>Стаж: {{ users.work_experience }} лет</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Grades Section (for students) -->
    <div v-if="users.grades && users.grades.length > 0" class="grades-section">
      <div class="section-header">
        <div class="section-title-row">
          <h2>Успеваемость</h2>
          <div class="grades-stats">
            <div class="stat-item">
              <span class="stat-value">{{ totalSubjects }}</span>
              <span class="stat-label">предметов</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ averageGrade }}</span>
              <span class="stat-label">средний балл</span>
            </div>
          </div>
        </div>

        <!-- Фильтры -->
        <div class="grades-filters">
          <div class="filter-buttons">
            <button
                @click="setGradeFilter('all')"
                class="filter-btn"
                :class="{ active: gradeFilter === 'all' }"
            >
              Все оценки
            </button>
            <button
                @click="setGradeFilter('exam')"
                class="filter-btn"
                :class="{ active: gradeFilter === 'exam' }"
            >
              Экзамены
            </button>
            <button
                @click="setGradeFilter('test')"
                class="filter-btn"
                :class="{ active: gradeFilter === 'test' }"
            >
              Зачеты
            </button>
          </div>
        </div>
      </div>

      <div class="grades-grid">
        <div
            v-for="(grade, index) in filteredGrades"
            :key="index"
            class="grade-card"
            :class="getGradeClass(grade)"
        >
          <div class="grade-header">
            <h3 class="subject-name">{{ grade.subject_name }}</h3>
            <div class="grade-badge" :class="getGradeClass(grade)">
              {{ formatGradeValue(grade) }}
            </div>
          </div>

          <div class="grade-details">
            <div class="detail-item">
              <span class="detail-label">Тип:</span>
              <span class="detail-value">{{ getGradeType(grade.type) }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Часы:</span>
              <span class="detail-value">{{ grade.subject_hours }} ч.</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Преподаватель:</span>
              <span class="detail-value">{{ grade.teacher_name }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Дата:</span>
              <span class="detail-value">{{ formatDate(grade.grade_date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Сообщение если нет оценок по фильтру -->
      <div v-if="filteredGrades.length === 0" class="empty-grades">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <h3>Нет оценок по выбранному фильтру</h3>
        <p>Попробуйте выбрать другой тип оценок</p>
      </div>
    </div>

    <!-- Subjects Section (for teachers) -->
    <div v-if="users.subjects && users.subjects.length > 0" class="subjects-section">
      <div class="section-header">
        <h2>Преподаваемые дисциплины</h2>
        <div class="subjects-stats">
          <div class="stat-item">
            <span class="stat-value">{{ users.subjects.length }}</span>
            <span class="stat-label">дисциплин</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ totalHours }}</span>
            <span class="stat-label">часов в неделю</span>
          </div>
        </div>
      </div>

      <div class="subjects-grid">
        <div v-for="(subject, index) in users.subjects" :key="index" class="subject-card">
          <div class="subject-header">
            <h3 class="subject-name">{{ subject.name }}</h3>
            <div class="subject-hours">
              {{ subject.hours_per_week }} ч/нед
            </div>
          </div>

          <div class="subject-details">
            <div class="detail-item">
              <span class="detail-label">Тип:</span>
              <span class="detail-value">{{ getSubjectType(subject.type) }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Курс:</span>
              <span class="detail-value">{{ subject.course }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Семестр:</span>
              <span class="detail-value">{{ subject.semester }}</span>
            </div>

            <div v-if="subject.groups && subject.groups.length > 0" class="detail-item">
              <span class="detail-label">Группы:</span>
              <span class="detail-value">{{ subject.groups.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Info Section -->
    <div v-if="hasAdditionalInfo" class="additional-info">
      <h2>Дополнительная информация</h2>
      <div class="info-grid">
        <!-- Для студентов -->
        <div v-if="users.student_id" class="info-item">
          <span class="info-label">ID студента:</span>
          <span class="info-value">{{ users.student_id }}</span>
        </div>

        <div v-if="users.group" class="info-item">
          <span class="info-label">Группа:</span>
          <span class="info-value">{{ users.group }}</span>
        </div>

        <!-- Для преподавателей -->
        <div v-if="users.teacher_id" class="info-item">
          <span class="info-label">ID преподавателя:</span>
          <span class="info-value">{{ users.teacher_id }}</span>
        </div>

        <div v-if="users.position" class="info-item">
          <span class="info-label">Должность:</span>
          <span class="info-value">{{ users.position }}</span>
        </div>

        <div v-if="users.employment_date" class="info-item">
          <span class="info-label">Дата приема:</span>
          <span class="info-value">{{ formatDate(users.employment_date) }}</span>
        </div>

        <div v-if="users.email" class="info-item">
          <span class="info-label">Email:</span>
          <span class="info-value">{{ users.email }}</span>
        </div>

        <div v-if="users.phone" class="info-item">
          <span class="info-label">Телефон:</span>
          <span class="info-value">{{ users.phone }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!hasAnyData" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor" stroke-width="2"/>
        </svg>
      </div>
      <h3>Информация отсутствует</h3>
      <p>Дополнительные данные не найдены</p>
    </div>
  </div>
</template>

<style scoped>
/* Filter Btn */

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.grades-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-wrap: wrap;
  gap: 16px;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.filter-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.empty-grades {
  text-align: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: #9ca3af;
}

.empty-grades h3 {
  color: #374151;
  margin-bottom: 8px;
  font-size: 1.125rem;
}

.empty-grades p {
  color: #6b7280;
  margin: 0;
}

.user-profile {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* Profile Header */
.profile-header {
  display: flex;
  align-items: center;
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  gap: 24px;
}

.profile-header__teacher {
  flex-direction: column;
  text-align: center;
  padding: 24px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.user-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-badge {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.profile-info {
  flex: 1;
}

.user-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Grades Section */
.grades-section,
.subjects-section {
  padding: 32px;
  border-bottom: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.grades-stats,
.subjects-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.grades-grid,
.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.grade-card,
.subject-card {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.grade-card:hover,
.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.grade-card.excellent {
  border-left: 4px solid #10b981;
}

.grade-card.good {
  border-left: 4px solid #3b82f6;
}

.grade-card.satisfactory {
  border-left: 4px solid #f59e0b;
}

.grade-card.unsatisfactory {
  border-left: 4px solid #ef4444;
}

.subject-card {
  border-left: 4px solid #8b5cf6;
}

.grade-header,
.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.subject-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
}

.grade-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.875rem;
  min-width: 40px;
  text-align: center;
}

.grade-badge.excellent {
  background: #dcfce7;
  color: #166534;
}

.grade-badge.good {
  background: #dbeafe;
  color: #1e40af;
}

.grade-badge.satisfactory {
  background: #fef3c7;
  color: #92400e;
}

.grade-badge.unsatisfactory {
  background: #fee2e2;
  color: #991b1b;
}

.subject-hours {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  background: #f3f4f6;
  color: #4b5563;
}

.grade-details,
.subject-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

/* Additional Info Section */
.additional-info {
  padding: 32px;
}

.additional-info h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-label {
  font-weight: 500;
  color: #6b7280;
}

.info-value {
  font-weight: 600;
  color: #1f2937;
}

/* Empty State */
.empty-state {
  padding: 60px 32px;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #4b5563;
}

.empty-state p {
  margin: 0;
  opacity: 0.7;
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }

  .user-name {
    font-size: 1.5rem;
  }

  .user-meta {
    justify-content: center;
  }

  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .grades-stats,
  .subjects-stats {
    width: 100%;
    justify-content: space-around;
  }

  .grades-grid,
  .subjects-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .profile-header,
  .grades-section,
  .subjects-section,
  .additional-info {
    padding: 20px;
  }

  .grade-header,
  .subject-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .grade-badge,
  .subject-hours {
    align-self: flex-start;
  }
}
</style>