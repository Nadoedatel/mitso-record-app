import { inject, type InjectionKey } from 'vue'

/** What a Dropdown gives its items: a way to close the menu after a choice */
export interface DropdownContext {
  /** Closes the menu; with `returnFocus` the focus goes back to the trigger button */
  close: (returnFocus?: boolean) => void
}

export const DROPDOWN_CONTEXT_KEY: InjectionKey<DropdownContext> = Symbol('dropdown')

/** null when the item is used outside a Dropdown */
export function useDropdownContext(): DropdownContext | null {
  return inject(DROPDOWN_CONTEXT_KEY, null)
}
