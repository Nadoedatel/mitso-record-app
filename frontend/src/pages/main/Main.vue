<script setup lang="ts">
import {ref} from "vue";
import Search from "@/widgets/search/Search.vue";

const modalIsStudent = ref<boolean | null>(null);
const isStudent = ref<boolean>(false);

const setStudent = (value: boolean) => {
  isStudent.value = value;
  modalIsStudent.value = value;
  localStorage.setItem('isStudent', value.toString());
};

const closeModal = () => {
  modalIsStudent.value = null;
};

function handleChangeUser() {
  modalIsStudent.value = null;
}
</script>

<template>
  <div v-if="modalIsStudent === null" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h2>Кто ты?</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>

      <div class="modal-content">
        <p>Пожалуйста выбирите свою роль для продолжения:</p>

        <div class="role-buttons">
          <button
              class="role-button student-button"
              @click="setStudent(true)"
          >
            <div class="button-icon">🎓</div>
            <div class="button-text">
              <div class="button-title">Студент</div>
            </div>
          </button>

          <button
              class="role-button teacher-button"
              @click="setStudent(false)"
          >
            <div class="button-icon">👨‍🏫</div>
            <div class="button-text">
              <div class="button-title">Преподователь</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
  <Search :isUser="isStudent" @change-user="handleChangeUser"/>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-content {
  padding: 24px;
}

.modal-content p {
  margin: 0 0 20px 0;
  color: #6b7280;
  text-align: center;
}

.role-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.role-button:hover {
  border-color: #3b82f6;
  background: #f8fafc;
  transform: translateY(-1px);
}

.role-button:active {
  transform: translateY(0);
}

.button-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.button-text {
  flex: 1;
}

.button-title {
  font-weight: 600;
  color: #1f2937;
}

.student-button:hover {
  border-color: #10b981;
}

.teacher-button:hover {
  border-color: #f59e0b;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность */
@media (max-width: 480px) {
  .modal-container {
    margin: 20px;
    width: calc(100% - 40px);
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-content {
    padding: 20px;
  }
}
</style>