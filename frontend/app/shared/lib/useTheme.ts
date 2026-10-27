import { computed, ref } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'
/** Visual style on top of light/dark: the default blue one or the Japanese retro poster */
export type DesignName = 'default' | 'retro'

/** Same key as the inline script in nuxt.config.ts (it applies the theme before the first paint) */
const STORAGE_KEY = 'mitso:theme'
const DESIGN_KEY = 'mitso:design'

const mode = ref<ThemeMode>('system')
const design = ref<DesignName>('default')
const systemDark = ref(false)
let initialized = false

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function readStoredDesign(): DesignName {
  try {
    return localStorage.getItem(DESIGN_KEY) === 'retro' ? 'retro' : 'default'
  } catch {
    return 'default'
  }
}

const resolved = computed<ResolvedTheme>(() =>
  mode.value === 'system' ? (systemDark.value ? 'dark' : 'light') : mode.value,
)

function apply() {
  document.documentElement.setAttribute('data-theme', resolved.value)
  document.documentElement.setAttribute('data-design', design.value)
}

/**
 * Light/dark theme plus the visual design (`data-design` on <html>). `mode` is the user's choice (system follows the OS), `resolved` is what is applied.
 * The choice is only a preference stored in this browser; it grants nothing. Call `init()` once on the client.
 */
export function useTheme() {
  function init() {
    if (initialized || typeof window === 'undefined') return
    initialized = true
    mode.value = readStoredMode()
    design.value = readStoredDesign()
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = query.matches
    query.addEventListener('change', (event) => {
      systemDark.value = event.matches
      apply()
    })
    apply()
  }

  function setMode(next: ThemeMode) {
    mode.value = next
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked: the choice lasts until the page is closed
    }
    apply()
  }

  function setDesign(next: DesignName) {
    design.value = next
    try {
      if (next === 'default') localStorage.removeItem(DESIGN_KEY)
      else localStorage.setItem(DESIGN_KEY, next)
    } catch {
      // Storage blocked: the choice lasts until the page is closed
    }
    apply()
  }

  /** Flip between light and dark based on what is shown now (the system option is chosen via setMode) */
  function toggle() {
    setMode(resolved.value === 'dark' ? 'light' : 'dark')
  }

  return { mode, resolved, design, init, setMode, setDesign, toggle }
}
