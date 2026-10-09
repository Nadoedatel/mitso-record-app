<template>
  <div v-if="lines > 1" class="skeleton-lines" aria-hidden="true">
    <span
      v-for="line in lines"
      :key="line"
      class="skeleton"
      :style="{ width: line === lines ? '60%' : '100%', height }"
    />
  </div>
  <span v-else class="skeleton" :style="{ width, height, borderRadius: radius }" aria-hidden="true" />
</template>

<script setup lang="ts">
/**
 * Skeleton: grey placeholder shaped like the content that is loading.
 * Hidden from screen readers; put an `aria-busy` / status text on the container that waits for data.
 *
 * @example
 * <Skeleton width="40%" height="1rem" />
 * <Skeleton :lines="3" />
 */
withDefaults(
  defineProps<{
    width?: string
    height?: string
    radius?: string
    /** More than 1 draws a paragraph of lines, the last one shorter */
    lines?: number
  }>(),
  { width: '100%', height: '1rem', radius: 'var(--radius-sm)', lines: 1 },
)
</script>

<style scoped lang="scss">
@use 'shared/styles/mixins' as *;

.skeleton {
  display: block;
  background: linear-gradient(
    90deg,
    var(--color-bg-muted) 25%,
    var(--color-bg-subtle) 37%,
    var(--color-bg-muted) 63%
  );
  background-size: 400% 100%;
  border-radius: var(--radius-sm);
  animation: skeleton-shimmer 1.4s ease infinite;

  @include reduced-motion {
    animation: none;
  }
}

.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0 50%;
  }
}
</style>
