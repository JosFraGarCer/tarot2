import { computed, shallowRef, type ComputedRef, type ShallowRef } from 'vue'

type VisibleIdsGetter = () => Array<number | string | null | undefined>

function normalizeId(input: number | string | null | undefined): number | null {
  if (input == null) return null
  const num = typeof input === 'number' ? input : Number(input)
  if (!Number.isFinite(num)) return null
  return Math.trunc(num)
}

export interface UseTableSelectionReturn {
  /** Reactive Set with the selected ids */
  selectedIds: ShallowRef<Set<number>>
  /** Selected ids exposed as an array (useful for templates/props) */
  selectedList: ComputedRef<number[]>
  /** Replace the current selection with the provided ids */
  setSelected: (ids: Iterable<number | string>) => void
  /** Toggle a single id on/off */
  toggleOne: (id: number | string, value: boolean) => void
  /** Toggle all visible ids. If force is provided, true selects all and false clears visible. */
  toggleAll: (force?: boolean) => void
  /** Check if a specific id is currently selected */
  isSelected: (id: number | string) => boolean
  /** Computed flag indicating if all visible ids are selected */
  isAllSelected: ComputedRef<boolean>
  /** Computed flag indicating a partial (indeterminate) selection */
  isIndeterminate: ComputedRef<boolean>
  /** Clear every selected id */
  clear: () => void
}

export function useTableSelection(getVisibleIds: VisibleIdsGetter): UseTableSelectionReturn {
  const selectedIds = shallowRef<Set<number>>(new Set())

  const visibleIds = computed<number[]>(() => {
    const raw = getVisibleIds?.() ?? []
    const normalized: number[] = []
    for (const entry of raw) {
      const id = normalizeId(entry)
      if (id !== null) normalized.push(id)
    }
    return normalized
  })

  const selectedList = computed<number[]>(() => Array.from(selectedIds.value.values()))

  function setSelected(ids: Iterable<number | string>) {
    const next = new Set<number>()
    for (const entry of ids) {
      const id = normalizeId(entry)
      if (id !== null) next.add(id)
    }
    selectedIds.value = next
  }

  function toggleOne(id: number | string, value: boolean) {
    const normalized = normalizeId(id)
    if (normalized === null) return
    const next = new Set(selectedIds.value)
    if (value) next.add(normalized)
    else next.delete(normalized)
    selectedIds.value = next
  }

  const isAllSelected = computed<boolean>(() => {
    const visible = visibleIds.value
    if (visible.length === 0) return false
    for (const id of visible) {
      if (!selectedIds.value.has(id)) return false
    }
    return true
  })

  const isIndeterminate = computed<boolean>(() => {
    const visible = visibleIds.value
    if (visible.length === 0) return false
    let hasAny = false
    for (const id of visible) {
      if (selectedIds.value.has(id)) {
        hasAny = true
        break
      }
    }
    return hasAny && !isAllSelected.value
  })

  function toggleAll(force?: boolean) {
    const target = typeof force === 'boolean' ? force : !isAllSelected.value
    const visible = visibleIds.value
    if (visible.length === 0) return
    const next = new Set(selectedIds.value)
    if (target) {
      for (const id of visible) next.add(id)
    } else {
      for (const id of visible) next.delete(id)
    }
    selectedIds.value = next
  }

  function isSelected(id: number | string): boolean {
    const normalized = normalizeId(id)
    if (normalized === null) return false
    return selectedIds.value.has(normalized)
  }

  function clear() {
    if (selectedIds.value.size > 0) {
      selectedIds.value = new Set()
    }
  }

  return {
    selectedIds,
    selectedList,
    setSelected,
    toggleOne,
    toggleAll,
    isSelected,
    isAllSelected,
    isIndeterminate,
    clear,
  }
}
