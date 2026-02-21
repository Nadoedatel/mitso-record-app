<template>
  <div class="teacher-page">
    <div class="container">
      <header class="header">
        <div>
          <h1 v-if="authStore.user?.teacher">
            {{ authStore.user.teacher.lastName }} {{ authStore.user.teacher.firstName }}
          </h1>
          <p v-if="authStore.user?.teacher" class="subtitle">
            {{ authStore.user.teacher.position }} • {{ authStore.user.teacher.department }}
          </p>
        </div>
        <button @click="logout" class="logout-button">Выйти</button>
      </header>

      <div v-if="loading" class="loading">Загрузка...</div>

      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="content">
        <!-- Teacher Info Card -->
        <div v-if="authStore.user?.teacher" class="info-card">
          <h2>Информация о преподавателе</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">ФИО:</span>
              <span class="value">
                {{ authStore.user.teacher.lastName }}
                {{ authStore.user.teacher.firstName }}
                {{ authStore.user.teacher.middleName }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Кафедра:</span>
              <span class="value">{{ authStore.user.teacher.department }}</span>
            </div>
            <div class="info-item">
              <span class="label">Должность:</span>
              <span class="value">{{ authStore.user.teacher.position }}</span>
            </div>
            <div v-if="authStore.user.teacher.academicDegree" class="info-item">
              <span class="label">Учёная степень:</span>
              <span class="value">{{ authStore.user.teacher.academicDegree }}</span>
            </div>
            <div v-if="authStore.user.teacher.phone" class="info-item">
              <span class="label">Телефон:</span>
              <span class="value">{{ authStore.user.teacher.phone }}</span>
            </div>
            <div v-if="authStore.user.teacher.officeNumber" class="info-item">
              <span class="label">Кабинет:</span>
              <span class="value">{{ authStore.user.teacher.officeNumber }}</span>
            </div>
          </div>
        </div>

        <!-- Subjects Section -->
        <div class="subjects-section">
          <h2>Мои предметы</h2>

          <div v-if="subjects.length === 0" class="empty">
            У вас пока нет назначенных предметов
          </div>

          <div v-else class="subjects-grid">
            <div v-for="subject in subjects" :key="subject.id" class="subject-card">
              <div class="subject-header">
                <h3>{{ subject.name }}</h3>
                <span class="subject-code">{{ subject.code }}</span>
              </div>
              <div class="subject-details">
                <div class="detail-item">
                  <span class="icon">📚</span>
                  <span>{{ subject.credits }} кредитов</span>
                </div>
                <div class="detail-item">
                  <span class="icon">📅</span>
                  <span>Семестр {{ subject.semester }}</span>
                </div>
              </div>
              <p v-if="subject.description" class="subject-description">
                {{ subject.description }}
              </p>
              <button @click="viewSubjectDetails(subject)" class="view-button">
                Управление оценками
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import type { Subject } from '~/entities/subject'

const authStore = useAuthStore()
const router = useRouter()

const subjects = ref<Subject[]>([])
const loading = ref(false)
const error = ref('')

async function fetchSubjects() {
  if (!authStore.user?.teacher?.id) {
    error.value = 'Профиль преподавателя не найден'
    return
  }

  loading.value = true
  error.value = ''

  try {
    subjects.value = await subjectsApi.fetchSubjects({
      teacherId: authStore.user.teacher.id,
    })
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки предметов'
  } finally {
    loading.value = false
  }
}

function viewSubjectDetails(subject: Subject) {
  // TODO: Implement grade management page
  alert(`Управление оценками для предмета "${subject.name}" будет реализовано в следующей версии`)
}

async function logout() {
  await authStore.logout()
  router.push('/')
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/')
    return
  }

  loading.value = true

  try {
    // Fetch full profile with teacher data
    await authStore.fetchProfile()

    // Fetch subjects
    await fetchSubjects()
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.teacher-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.container {
  max-width: 1200px;
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

.subtitle {
  color: #666;
  margin-top: 5px;
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

.loading,
.error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.loading {
  color: #666;
}

.error {
  color: #e53e3e;
  background: #fff5f5;
  border-radius: 8px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.info-card,
.subjects-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-card h2,
.subjects-section h2 {
  margin: 0 0 20px 0;
  font-size: 22px;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item .label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.info-item .value {
  font-size: 16px;
  color: #333;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.subject-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
}

.subject-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.subject-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  flex: 1;
}

.subject-code {
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.subject-details {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.detail-item .icon {
  font-size: 16px;
}

.subject-description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin: 12px 0;
}

.view-button {
  width: 100%;
  padding: 10px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 12px;
}

.view-button:hover {
  background: #5568d3;
}
</style>
