<template>
  <component
    :is="icons[name]"
    class="icon"
    :size="size"
    :stroke-width="strokeWidth"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label"
    :role="label ? 'img' : undefined"
  />
</template>

<script setup lang="ts">
import { icons, type IconName } from './icons'

/**
 * Icon: decorative by default (hidden from screen readers). Pass `label` when the icon alone carries meaning.
 *
 * @example
 * <Icon name="search" />
 * <Icon name="trash" :size="18" label="Удалить" />
 */
withDefaults(
  defineProps<{
    name: IconName
    /** Size in px */
    size?: number
    strokeWidth?: number
    /** Accessible name; leave empty for a decorative icon */
    label?: string
  }>(),
  { size: 20, strokeWidth: 1.75, label: undefined },
)
</script>

<style scoped>
.icon {
  flex-shrink: 0;
}
</style>
