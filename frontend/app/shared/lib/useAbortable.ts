import { getCurrentInstance, onBeforeUnmount } from 'vue'

/**
 * Cancel-previous helper for "latest request wins":
 * each `next()` aborts the previous request and returns a fresh signal.
 * The pending request is also aborted when the component unmounts.
 */
export function useAbortable() {
  let controller: AbortController | null = null

  function next(): AbortSignal {
    controller?.abort()
    controller = new AbortController()
    return controller.signal
  }

  function isAbort(err: unknown): boolean {
    return err instanceof DOMException && err.name === 'AbortError'
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(() => controller?.abort())
  }

  return { next, isAbort }
}
