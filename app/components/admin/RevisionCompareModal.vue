<!-- app/components/admin/RevisionCompareModal.vue -->
<template>
  <UModal v-model:open="open" :title="$t('admin.revisionsHistory.comparisonTitle','Revision comparison')">
    <template #body>
      <div class="space-y-3">
        <div class="text-sm text-gray-600 dark:text-gray-300">
          <span v-if="summary.total>0">{{ $t('admin.revisionsHistory.changesSummary','{n} fields changed').replace('{n}', String(summary.total)) }}</span>
          <span v-else>{{ $t('admin.revisionsHistory.noDiff','No differences found') }}</span>
          <span v-if="summary.total>0" class="ml-2 text-xs text-gray-500">
            +{{ summary.added.length }} / ~{{ summary.changed.length }} / -{{ summary.removed.length }}
          </span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <UCard>
            <template #header>{{ $t('admin.revisionsHistory.left','Revision A') }} (#{{ revA?.id }})</template>
            <pre class="text-xs overflow-auto max-h-[70vh]" v-html="jsonHtmlA"></pre>
          </UCard>
          <UCard>
            <template #header>{{ $t('admin.revisionsHistory.right','Revision B') }} (#{{ revB?.id }})</template>
            <pre class="text-xs overflow-auto max-h-[70vh]" v-html="jsonHtmlB"></pre>
          </UCard>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <UButton variant="soft" @click="open=false">{{ $t('common.close','Close') }}</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{ revA: any | null; revB: any | null }>()
const open = defineModel<boolean>('open')

const snapshotA = computed(() => props.revA?.next_snapshot ?? {})
const snapshotB = computed(() => props.revB?.next_snapshot ?? {})

function toPaths(obj:any, base:string[] = [], out: Record<string, any> = {}) {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => toPaths(v, [...base, String(i)], out))
    } else {
      for (const [k, v] of Object.entries(obj)) toPaths(v, [...base, k], out)
    }
  } else {
    out['/' + base.join('/')] = obj
  }
  return out
}

const mapA = computed(() => toPaths(snapshotA.value))
const mapB = computed(() => toPaths(snapshotB.value))

const diff = computed(() => {
  const added: string[] = []
  const removed: string[] = []
  const changed: string[] = []
  const allKeys = new Set<string>([...Object.keys(mapA.value), ...Object.keys(mapB.value)])
  for (const k of allKeys) {
    const a = mapA.value[k]
    const b = mapB.value[k]
    if (a === undefined && b !== undefined) added.push(k)
    else if (a !== undefined && b === undefined) removed.push(k)
    else if (JSON.stringify(a) !== JSON.stringify(b)) changed.push(k)
  }
  return { added, removed, changed }
})

const summary = computed(() => ({
  added: diff.value.added,
  removed: diff.value.removed,
  changed: diff.value.changed,
  total: diff.value.added.length + diff.value.removed.length + diff.value.changed.length
}))

function escapeHtml(s:string) { return s.replace(/[&<> "]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] as string)) }
function wrapKeys(jsonStr:string, which: 'A'|'B') {
  let html = escapeHtml(jsonStr)
  const setAdd = new Set(diff.value.added.map(p => p.split('/').filter(Boolean).pop() || ''))
  const setRem = new Set(diff.value.removed.map(p => p.split('/').filter(Boolean).pop() || ''))
  const setChg = new Set(diff.value.changed.map(p => p.split('/').filter(Boolean).pop() || ''))
  // For A, added keys are not present; removed keys exist only in A. For B, vice versa.
  const addCls = 'bg-green-100 dark:bg-green-900/30'
  const remCls = 'bg-red-100 dark:bg-red-900/30 line-through'
  const chgCls = 'bg-yellow-100 dark:bg-yellow-900/30'
  function mark(keys:Set<string>, cls:string) {
    for (const key of keys) {
      if (!key) continue
      const rx = new RegExp(`("${key}"\\s*:)`, 'g')
      html = html.replace(rx, `<span class="${cls}">$1</span>`)
    }
  }
  if (which === 'A') {
    mark(setRem, remCls)
    mark(setChg, chgCls)
  } else {
    mark(setAdd, addCls)
    mark(setChg, chgCls)
  }
  return html
}

const jsonHtmlA = computed(() => wrapKeys(JSON.stringify(snapshotA.value, null, 2), 'A'))
const jsonHtmlB = computed(() => wrapKeys(JSON.stringify(snapshotB.value, null, 2), 'B'))
</script>
