import { computed, reactive, ref, toRaw } from 'vue'

export interface UseFormStateOptions<T extends Record<string, any>> {
  /**
   * Initial form value. Can be a plain object or a factory that returns one.
   */
  initialValue?: T | (() => T)
}

export interface ReplaceOptions {
  markDirty?: boolean
  updateInitial?: boolean
}

export interface PatchOptions {
  markDirty?: boolean
}

export interface ResetOptions<T extends Record<string, any>> {
  to?: T
  updateInitial?: boolean
}

export interface MarkCleanOptions {
  updateInitial?: boolean
}

export interface FormStateControls<T extends Record<string, any>> {
  values: T
  dirty: ReturnType<typeof ref<boolean>>
  isDirty: ReturnType<typeof computed<boolean>>
  replace: (next: T, options?: ReplaceOptions) => void
  reset: (options?: ResetOptions<T>) => void
  patch: (partial: Partial<T>, options?: PatchOptions) => void
  set: <K extends keyof T>(key: K, value: T[K], options?: PatchOptions) => void
  markDirty: () => void
  markClean: (options?: MarkCleanOptions) => void
  toObject: () => T
}

function resolveInitial<T extends Record<string, any>>(initial?: T | (() => T)): T {
  if (typeof initial === 'function') {
    return (initial as () => T)()
  }
  return (initial ?? {}) as T
}

function clone<T>(value: T): T {
  const raw = toRaw(value as any)
  const structuredCloneFn = (globalThis as any)?.structuredClone as (<K>(val: K) => K) | undefined
  if (structuredCloneFn) {
    try {
      return structuredCloneFn(raw)
    } catch {
      // fall back to manual deep clone
    }
  }

  if (raw === null || typeof raw !== 'object') {
    return raw
  }

  if (Array.isArray(raw)) {
    return raw.map(item => clone(item)) as unknown as T
  }

  const out: Record<string, any> = {}
  for (const key of Object.keys(raw)) {
    out[key] = clone((raw as Record<string, any>)[key])
  }
  return out as T
}

function assignInto<T extends Record<string, any>>(target: T, source: T) {
  for (const key of Object.keys(target)) {
    if (!(key in source)) {
      delete (target as any)[key]
    }
  }
  Object.assign(target, source)
}

export function useFormState<T extends Record<string, any>>(options: UseFormStateOptions<T> = {}): FormStateControls<T> {
  const initialResolved = clone(resolveInitial(options.initialValue))
  const initialSnapshot = ref<T>(clone(initialResolved))

  const values = reactive<T>(clone(initialSnapshot.value))
  const dirty = ref(false)

  function replace(next: T, replaceOptions: ReplaceOptions = {}) {
    const normalized = clone(next)
    assignInto(values, normalized)
    if (replaceOptions.updateInitial) {
      initialSnapshot.value = clone(normalized)
    }
    dirty.value = replaceOptions.markDirty ?? false
  }

  function reset(resetOptions: ResetOptions<T> = {}) {
    if (resetOptions.to) {
      replace(resetOptions.to, {
        markDirty: false,
        updateInitial: resetOptions.updateInitial ?? true,
      })
      return
    }
    replace(initialSnapshot.value, { markDirty: false })
  }

  function patch(partial: Partial<T>, patchOptions: PatchOptions = {}) {
    Object.assign(values, partial)
    dirty.value = patchOptions.markDirty ?? true
  }

  function set<K extends keyof T>(key: K, value: T[K], patchOptions: PatchOptions = {}) {
    (values as T)[key] = value
    dirty.value = patchOptions.markDirty ?? true
  }

  function markDirty() {
    dirty.value = true
  }

  function markClean(options: MarkCleanOptions = {}) {
    if (options.updateInitial) {
      initialSnapshot.value = clone(values)
    }
    dirty.value = false
  }

  function toObject(): T {
    return clone(values)
  }

  return {
    values,
    dirty,
    isDirty: computed(() => dirty.value),
    replace,
    reset,
    patch,
    set,
    markDirty,
    markClean,
    toObject,
  }
}
