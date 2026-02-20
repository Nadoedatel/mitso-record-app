<script setup lang="ts">
import {UserProfile} from "@/widgets/user-profile";
import type {IStudent} from "@/entities/student/model/types.ts";

defineProps<{
  infoStudent: IStudent;
}>();

const emit = defineEmits<{
  reset: []
}>()

function handleReset() {
  emit("reset")
}
</script>

<template>
  <div>
    <!-- Student Info Section -->
    <div v-if="infoStudent" class="student-section">
      <div class="section-header">
        <h2 class="section-title">Найденный студент</h2>
        <div class="section-actions">
          <button @click="handleReset" class="action-button secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2"/>
            </svg>
            Сбросить
          </button>
        </div>
      </div>

      <user-profile :users="infoStudent" />
    </div>
  </div>
</template>

<style scoped>
/* Student Section */
.student-section {
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