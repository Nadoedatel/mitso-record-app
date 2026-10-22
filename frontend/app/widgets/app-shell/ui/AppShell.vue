<template>
  <div :class="['app-shell', { 'app-shell-with-nav': user }]">
    <a class="app-shell-skip" href="#main" :inert="isNavOpen || undefined">К содержимому</a>

    <!-- Phone and tablet only: the side panel is hidden behind this button -->
    <header v-if="user" class="app-shell-topbar" :inert="isNavOpen || undefined">
      <button
        ref="menuButtonRef"
        type="button"
        class="app-shell-icon-button"
        aria-label="Открыть меню"
        aria-controls="app-sidebar"
        :aria-expanded="isNavOpen"
        @click="openNav"
      >
        <Icon name="menu" :size="22" />
      </button>
      <AppShellBrand :to="homeRoute" />
    </header>

    <Transition name="app-shell-fade">
      <div v-if="isNavOpen" class="app-shell-backdrop" aria-hidden="true" @click="closeNav(true)" />
    </Transition>

    <aside
      v-if="user"
      id="app-sidebar"
      ref="sidebarRef"
      :class="['app-shell-sidebar', { 'app-shell-sidebar-open': isNavOpen }]"
      aria-label="Основное меню"
      @keydown.esc="closeNav(true)"
      @click="handleSidebarClick"
    >
      <div class="app-shell-sidebar-head">
        <AppShellBrand :to="homeRoute" />
        <button type="button" class="app-shell-icon-button app-shell-close" aria-label="Закрыть меню" @click="closeNav(true)">
          <Icon name="x" :size="20" />
        </button>
      </div>

      <SideNav :items="navItems" class="app-shell-nav" />

      <UserMenu :user="user" class="app-shell-user" />
    </aside>

    <main id="main" class="app-shell-main" tabindex="-1" :inert="isNavOpen || undefined">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getHomeRoute } from '~/entities/user'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { Icon } from '~/shared/ui'
import { getNavItems } from '../model/navigation'
import AppShellBrand from './AppShellBrand.vue'
import SideNav from './SideNav.vue'
import UserMenu from './UserMenu.vue'

/**
 * Frame of every signed-in page: side panel with the role's sections and the user menu, content on the right.
 * From 1024px the panel is always there; below it slides in from the left by the menu button, and the rest
 * of the page is inert (no clicks, no Tab) until it closes. Without a user (dev showcase) only the content shows.
 */
const DESKTOP_QUERY = '(min-width: 1024px)'

const authStore = useAuthStore()
const route = useRoute()

const user = computed(() => authStore.user)
const navItems = computed(() => getNavItems(user.value?.role))
const homeRoute = computed(() => getHomeRoute(user.value?.role))

const isNavOpen = ref(false)
const menuButtonRef = ref<HTMLButtonElement | null>(null)
const sidebarRef = ref<HTMLElement | null>(null)

async function openNav() {
  isNavOpen.value = true
  await nextTick()
  // A selector list would return the first match in the DOM (the brand), so look for the current item first
  const panel = sidebarRef.value
  const target = panel?.querySelector<HTMLElement>('a[aria-current="page"]') ?? panel?.querySelector<HTMLElement>('a[href]')
  target?.focus()
}

function closeNav(returnFocus = false) {
  if (!isNavOpen.value) return
  isNavOpen.value = false
  if (returnFocus) menuButtonRef.value?.focus()
}

// A link was followed: the new page takes over, the panel goes away
watch(() => route.fullPath, () => closeNav())

// A link to the page already open changes no route, so the panel also closes on the click itself
function handleSidebarClick(event: MouseEvent) {
  if (event.target instanceof Element && event.target.closest('a[href]')) closeNav()
}

// The page behind the open panel does not scroll. Set on <html>: Modal owns the overflow of <body>
watch(isNavOpen, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
})

// Widened to the desktop layout while open: the panel is always visible there, nothing must stay inert
let desktopQuery: MediaQueryList | null = null
const handleDesktopChange = (event: MediaQueryListEvent) => {
  if (event.matches) closeNav()
}

onMounted(() => {
  desktopQuery = window.matchMedia(DESKTOP_QUERY)
  desktopQuery.addEventListener('change', handleDesktopChange)
})

onBeforeUnmount(() => {
  desktopQuery?.removeEventListener('change', handleDesktopChange)
  document.documentElement.style.overflow = ''
})
</script>

<style scoped lang="scss">
@use 'shared/styles/mixins' as *;

$sidebar-width: 256px;

.app-shell {
  min-height: 100dvh;
  background: var(--color-bg-page);
}

.app-shell-with-nav {
  @include respond-up(lg) {
    display: grid;
    grid-template-columns: $sidebar-width minmax(0, 1fr);
  }
}

.app-shell-skip {
  position: fixed;
  top: var(--spacing-2);
  left: var(--spacing-2);
  z-index: var(--z-tooltip);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-raised);
  color: var(--color-primary);
  box-shadow: var(--shadow-lg);
  transform: translateY(-200%);

  &:focus {
    transform: none;
    outline: none;
    box-shadow: var(--shadow-focus);
  }
}

.app-shell-topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  height: 56px;
  padding: 0 var(--spacing-3);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);

  @include respond-up(lg) {
    display: none;
  }
}

.app-shell-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-colors);

  &:hover {
    background-color: var(--color-bg-muted);
    color: var(--color-text-primary);
  }

  @include focus-ring;
}

.app-shell-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-fixed);
  background-color: var(--color-bg-overlay);

  @include respond-up(lg) {
    display: none;
  }
}

.app-shell-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  // Above the page, below modals: a modal opened from the user menu covers the panel
  z-index: calc(var(--z-fixed) + 1);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  width: min(288px, 85vw);
  padding: var(--spacing-3);
  overflow-y: auto;
  overscroll-behavior: contain;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  box-shadow: var(--shadow-xl);
  transform: translateX(-100%);
  // Hidden panel drops out of the Tab order and the accessibility tree, not only off screen
  visibility: hidden;
  transition: transform var(--transition-duration-base) var(--transition-timing-ease),
    visibility 0s linear var(--transition-duration-base);

  @include respond-up(lg) {
    position: sticky;
    top: 0;
    z-index: auto;
    width: auto;
    height: 100dvh;
    box-shadow: none;
    transform: none;
    visibility: visible;
    transition: none;
  }
}

.app-shell-sidebar-open {
  transform: none;
  visibility: visible;
  transition: transform var(--transition-duration-base) var(--transition-timing-ease);
}

.app-shell-sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  min-height: 40px;
}

.app-shell-close {
  @include respond-up(lg) {
    display: none;
  }
}

.app-shell-nav {
  flex: 1;
}

.app-shell-user {
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--color-border);
}

.app-shell-main {
  min-width: 0;
  padding: var(--spacing-4) 0 var(--spacing-8);
  outline: none;

  @include respond-up(md) {
    padding: var(--spacing-6) var(--spacing-2) var(--spacing-10);
  }
}

.app-shell-fade-enter-active,
.app-shell-fade-leave-active {
  transition: opacity var(--transition-duration-base) var(--transition-timing-ease);
}

.app-shell-fade-enter-from,
.app-shell-fade-leave-to {
  opacity: 0;
}

@include reduced-motion {
  .app-shell-sidebar,
  .app-shell-sidebar-open,
  .app-shell-fade-enter-active,
  .app-shell-fade-leave-active {
    transition: none;
  }
}
</style>
