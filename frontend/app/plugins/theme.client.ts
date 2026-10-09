import { useTheme } from '~/shared/lib/useTheme'

/** Keeps the store in step with the theme the inline head script already applied */
export default defineNuxtPlugin(() => {
  useTheme().init()
})
