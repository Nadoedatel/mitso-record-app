<template>
  <div class="user-menu">
    <Dropdown placement="top-start" block :label="`${displayName}, ${roleLabel}: меню пользователя`">
      <template #trigger>
        <span class="user-menu-avatar" aria-hidden="true">{{ initials }}</span>
        <span class="user-menu-text">
          <span class="user-menu-name">{{ displayName }}</span>
          <span class="user-menu-role">{{ roleLabel }}</span>
        </span>
        <Icon name="chevrons-up-down" :size="16" class="user-menu-chevron" />
      </template>

      <DropdownItem icon="key" @select="showPassword = true">Сменить пароль</DropdownItem>
      <DropdownItem v-if="isAdmin" icon="shield" @select="showTwoFactor = true">
        {{ user.twoFactorEnabled ? 'Двухфакторная защита: вкл' : 'Двухфакторная защита' }}
      </DropdownItem>

      <DropdownSeparator />

      <DropdownGroup label="Тема">
        <DropdownItem
          v-for="option in THEME_OPTIONS"
          :key="option.mode"
          :icon="option.icon"
          :checked="theme.mode.value === option.mode"
          @select="theme.setMode(option.mode)"
        >
          {{ option.label }}
        </DropdownItem>
      </DropdownGroup>

      <DropdownGroup label="Дизайн">
        <DropdownItem
          v-for="option in DESIGN_OPTIONS"
          :key="option.design"
          icon="palette"
          :checked="theme.design.value === option.design"
          @select="theme.setDesign(option.design)"
        >
          {{ option.label }}
        </DropdownItem>
      </DropdownGroup>

      <DropdownSeparator />

      <DropdownItem icon="log-out" variant="danger" @select="logout">Выйти</DropdownItem>
    </Dropdown>

    <ChangePasswordModal v-model="showPassword" />
    <TwoFactorModal v-if="isAdmin" v-model="showTwoFactor" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Role, getRoleLabel, type User } from '~/entities/user'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { formatFullName } from '~/shared/lib/formatName'
import { useTheme, type DesignName, type ThemeMode } from '~/shared/lib/useTheme'
import { Dropdown, DropdownGroup, DropdownItem, DropdownSeparator, Icon, type IconName } from '~/shared/ui'
import ChangePasswordModal from './ChangePasswordModal.vue'
import TwoFactorModal from './TwoFactorModal.vue'

/** Who is signed in, plus account actions: password, second factor (admin), theme, design, sign out */
const props = defineProps<{ user: User }>()

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: IconName }[] = [
  { mode: 'system', label: 'Как в системе', icon: 'monitor' },
  { mode: 'light', label: 'Светлая', icon: 'sun' },
  { mode: 'dark', label: 'Тёмная', icon: 'moon' },
]

const DESIGN_OPTIONS: { design: DesignName; label: string }[] = [
  { design: 'default', label: 'Классика' },
  { design: 'retro', label: '日本レトロ' },
]

const authStore = useAuthStore()
const router = useRouter()
const theme = useTheme()

const showPassword = ref(false)
const showTwoFactor = ref(false)

const isAdmin = computed(() => props.user.role === Role.ADMIN)
const roleLabel = computed(() => getRoleLabel(props.user.role))
// Student and teacher have a name in their profile; the admin account has only the email
const person = computed(() => props.user.student ?? props.user.teacher ?? null)
const displayName = computed(() => (person.value ? formatFullName(person.value) : props.user.email))
const initials = computed(() =>
  person.value
    ? `${person.value.lastName.charAt(0)}${person.value.firstName.charAt(0)}`
    : props.user.email.charAt(0).toUpperCase(),
)

async function logout() {
  await authStore.logout()
  await router.push('/login')
}
</script>

<style scoped lang="scss">
@use 'shared/styles/mixins' as *;

.user-menu {
  display: flex;
  flex-direction: column;
}

.user-menu-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.user-menu-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.user-menu-name {
  @include truncate;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.user-menu-role {
  @include truncate;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

.user-menu-chevron {
  color: var(--color-text-tertiary);
}
</style>
