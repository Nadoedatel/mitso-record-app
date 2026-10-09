import { inject, type ComputedRef, type InjectionKey } from 'vue'

/**
 * What a FormField tells the control inside it: the id to put on the input (so the label's `for` matches),
 * which element describes it (error or hint) and whether it is invalid.
 * Controls (Input, Select, ...) read it, so `<FormField label="Email"><Input /></FormField>` needs no ids by hand.
 */
export interface FieldContext {
  id: string
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
}

export const FIELD_CONTEXT_KEY: InjectionKey<FieldContext> = Symbol('form-field')

/** null when the control is used outside a FormField */
export function useFieldContext(): FieldContext | null {
  return inject(FIELD_CONTEXT_KEY, null)
}
