import { ref } from 'vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
}

interface ConfirmState extends Required<ConfirmOptions> {
  open: boolean
  resolve: ((value: boolean) => void) | null
}

const state = ref<ConfirmState>({
  open: false,
  title: 'Подтверждение',
  message: '',
  confirmText: 'Удалить',
  resolve: null,
})

/**
 * Promise-based replacement of window.confirm. Rendered by <ConfirmDialog /> in app.vue.
 * @example if (!(await confirm({ message: 'Удалить студента?' }))) return
 */
export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    // A second call while open cancels the first one
    state.value.resolve?.(false)
    return new Promise<boolean>((resolve) => {
      state.value = {
        open: true,
        title: options.title ?? 'Подтверждение',
        message: options.message,
        confirmText: options.confirmText ?? 'Удалить',
        resolve,
      }
    })
  }

  function settle(result: boolean) {
    state.value.resolve?.(result)
    state.value = { ...state.value, open: false, resolve: null }
  }

  return { state, confirm, settle }
}
