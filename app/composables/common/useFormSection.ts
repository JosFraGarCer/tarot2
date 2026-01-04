// app/composables/common/useFormSection.ts
import { computed, reactive, ref, toRaw, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from 'vue'

export interface UseFormSectionSaveResult {
  success: boolean
  message?: string | null
}

export type UseFormSectionSaveHandler<T> = (state: T) => Promise<UseFormSectionSaveResult | undefined> | UseFormSectionSaveResult | undefined
export type UseFormSectionValidator<T> = (state: T) => Promise<void> | void

export interface UseFormSectionOptions<T> {
  /** Optional validation hook executed before saving. */
  validator?: UseFormSectionValidator<T>
  /** Default save handler. Can be overridden per-call. */
  onSave?: UseFormSectionSaveHandler<T>
}

export interface UseFormSectionReturn<T> {
  state: T
  dirty: ComputedRef<boolean>
  loading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  reset: () => void
  patch: (values: Partial<T>) => void
  save: (handler?: UseFormSectionSaveHandler<T>) => Promise<UseFormSectionSaveResult>
}

function cloneDeep<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // ignore and fallback
    }
  }
  return JSON.parse(JSON.stringify(value)) as T
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function assignState<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>) {
  for (const key of Object.keys(target)) {
    if (!(key in source)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete target[key as keyof T]
    }
  }
  for (const key of Object.keys(source)) {
    const incoming = source[key]
    if (Array.isArray(incoming)) {
      ;(target as Record<string, unknown>)[key] = incoming.slice()
    } else if (isPlainObject(incoming)) {
      ;(target as Record<string, unknown>)[key] = cloneDeep(incoming)
    } else {
      ;(target as Record<string, unknown>)[key] = incoming
    }
  }
}

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    for (let index = 0; index < a.length; index += 1) {
      if (!isDeepEqual(a[index], b[index])) return false
    }
    return true
  }
  if (typeof a === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)
    if (aKeys.length !== bKeys.length) return false
    for (const key of aKeys) {
      if (!isDeepEqual(aObj[key], bObj[key])) return false
    }
    return true
  }
  return a === b
}

function normalizeResult(result: UseFormSectionSaveResult | undefined): UseFormSectionSaveResult {
  if (!result) return { success: true }
  if (typeof result.success === 'boolean') return result
  return { success: true }
}

export function useFormSection<T extends Record<string, unknown>>(
  initialValue: MaybeRefOrGetter<T>,
  options: UseFormSectionOptions<T> = {},
): UseFormSectionReturn<T> {
  const snapshot = ref(cloneDeep(toValue(initialValue)))
  const state = reactive(cloneDeep(snapshot.value)) as T

  const loadingState = ref(false)
  const errorMessage = ref<string | null>(null)

  const dirty = computed(() => !isDeepEqual(state, snapshot.value))
  const loading = computed(() => loadingState.value)
  const error = computed(() => errorMessage.value)

  function reset() {
    assignState(state as Record<string, unknown>, cloneDeep(snapshot.value))
    errorMessage.value = null
  }

  function patch(values: Partial<T>) {
    if (!values) return
    assignState(state as Record<string, unknown>, { ...(state as Record<string, unknown>), ...values })
  }

  async function save(handler?: UseFormSectionSaveHandler<T>): Promise<UseFormSectionSaveResult> {
    const saveHandler = handler ?? options.onSave
    if (!saveHandler) {
      return { success: false, message: 'No save handler provided' }
    }
    if (loadingState.value) {
      return { success: false, message: 'Save already in progress' }
    }

    loadingState.value = true
    errorMessage.value = null

    try {
      if (options.validator) {
        await options.validator(state)
      }
      const payload = cloneDeep(toRaw(state)) as T
      const result = normalizeResult(await saveHandler(payload))
      if (!result.success) {
        errorMessage.value = result.message ?? 'Save failed'
        return result
      }
      snapshot.value = cloneDeep(payload)
      assignState(state as Record<string, unknown>, cloneDeep(snapshot.value))
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed'
      errorMessage.value = message
      return { success: false, message }
    } finally {
      loadingState.value = false
    }
  }

  watch(
    () => cloneDeep(toValue(initialValue)),
    (next) => {
      if (!isDeepEqual(next, snapshot.value)) {
        snapshot.value = cloneDeep(next)
        if (!dirty.value) {
          assignState(state as Record<string, unknown>, cloneDeep(snapshot.value))
        }
      }
    },
    { deep: true },
  )

  return {
    state,
    dirty,
    loading,
    error,
    reset,
    patch,
    save,
  }
}
