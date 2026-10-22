<template>
  <div class="admin-page">
    <Container maxWidth="full">
      <Header :title="sectionTitle" />

      <StudentsSection v-if="section === 'students'" />
      <TeachersSection v-else-if="section === 'teachers'" />
      <SubjectsSection v-else-if="section === 'subjects'" />
      <GroupsSection v-else-if="section === 'groups'" />
      <FacultiesSection v-else-if="section === 'faculties'" />
      <SpecializationsSection v-else-if="section === 'specializations'" />
      <AuditSection v-else-if="section === 'audit'" />
    </Container>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Container, Header } from '~/shared/ui'
import {
  StudentsSection,
  TeachersSection,
  SubjectsSection,
  GroupsSection,
  FacultiesSection,
  SpecializationsSection,
  AuditSection,
} from '~/widgets/admin'
import { ADMIN_SECTIONS, parseAdminSection } from '~/widgets/app-shell'

definePageMeta({
  middleware: ['auth', 'admin'],
})

// The section lives in the URL (?tab=), picked from the side panel: it can be linked to and "back" returns to it
const route = useRoute()
const section = computed(() => parseAdminSection(route.query.tab))
const sectionTitle = computed(() => ADMIN_SECTIONS.find((item) => item.key === section.value)?.label ?? '')

// Same path, only the query changes: Nuxt keeps the scroll position, so a new section would open mid-table
watch(section, () => window.scrollTo({ top: 0 }))
</script>
