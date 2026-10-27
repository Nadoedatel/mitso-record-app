<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <RetroDecor />
  <ToastContainer />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { RetroDecor, ToastContainer, ConfirmDialog } from '~/shared/ui'
</script>
