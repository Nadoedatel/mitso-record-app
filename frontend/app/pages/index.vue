<template>
  <LoadingState />
</template>

<script setup lang="ts">
import { LoadingState } from '~/shared/ui'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { getHomeRoute } from '~/entities/user'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
await navigateTo(getHomeRoute(authStore.user?.role), { replace: true })
</script>
