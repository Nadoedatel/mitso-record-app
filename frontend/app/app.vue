<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ToastContainer />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { ToastContainer, ConfirmDialog } from '~/shared/ui'
</script>
