<!-- app/components/admin/EntityViewer.vue -->
<template>
  <UCard class="space-y-4">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ $t('features.admin.entityViewer.title', 'Entity snapshot') }}
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ $t('features.admin.entityViewer.subtitle', 'Preview of the current entity data.') }}
          </p>
        </div>
        <div v-if="languageCode" class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <UBadge variant="soft" color="primary">{{ String(languageCode).toUpperCase() }}</UBadge>
          <span>{{ $t('ui.fields.language', 'Language') }}</span>
        </div>
      </div>
    </template>

    <div v-if="isEmpty" class="py-10 text-center text-gray-500 dark:text-gray-400 text-sm">
      {{ $t('features.admin.entityViewer.empty', 'No data available for this entity.') }}
    </div>
    <div v-else>
      <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <template v-for="(value, key) in flatEntity" :key="key">
          <div
            class="rounded border p-3 text-sm transition-colors"
            :class="highlightClass(key)"
          >
            <dt class="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <span class="truncate" :title="key">{{ key }}</span>
              <UBadge
                v-if="diffMap[key]"
                size="xs"
                :color="badgeColor(diffMap[key])"
                variant="soft"
              >{{ badgeLabel(diffMap[key]) }}</UBadge>
            </dt>
            <dd class="mt-1 text-gray-600 dark:text-gray-300 break-words whitespace-pre-wrap text-xs">
              {{ formatValue(value) }}
            </dd>
          </div>
        </template>
      </dl>

      <details class="mt-4">
        <summary class="cursor-pointer text-sm text-primary-600 dark:text-primary-400">
          {{ $t('features.admin.entityViewer.viewJson', 'View raw JSON') }}
        </summary>
        <pre class="mt-2 text-xs bg-gray-100 dark:bg-gray-900 rounded p-3 overflow-auto max-h-96">{{ formattedJson }}</pre>
      </details>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface DiffEntry {
  op: 'add' | 'remove' | 'replace'
  path: string
  [key: string]: unknown
}

const props = defineProps<{
  entity: Record<string, unknown> | null | undefined
  highlightDiff?: DiffEntry[] | null
  languageCode?: string | null
}>()

const normalizedEntity = computed(() => props.entity ?? {})
const isEmpty = computed(() => Object.keys(normalizedEntity.value).length === 0)

const flatEntity = computed<Record<string, unknown>>(() => flattenEntity(normalizedEntity.value))

const diffMap = computed<Record<string, DiffEntry['op']>>(() => {
  const entries = Array.isArray(props.highlightDiff) ? props.highlightDiff : []
  const map: Record<string, DiffEntry['op']> = {}
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue
    const op = entry.op
    const path = typeof entry.path === 'string' ? entry.path : ''
    if (!op || !path) continue
    const normalizedPath = normalizePath(path)
    map[normalizedPath] = op
  }
  return map
})

const formattedJson = computed(() => {
  try {
    return JSON.stringify(normalizedEntity.value, null, 2)
  } catch {
    return String(normalizedEntity.value)
  }
})

function normalizePath(path: string) {
  const trimmed = path.replace(/^\//, '')
  return trimmed.replace(/\//g, '.')
}

function highlightClass(key: string) {
  const op = diffMap.value[key]
  if (op === 'add') return 'border-green-300/70 dark:border-green-600/60 bg-green-50/60 dark:bg-green-950/20'
  if (op === 'remove') return 'border-red-300/70 dark:border-red-600/60 bg-red-50/60 dark:bg-red-950/20'
  if (op === 'replace') return 'border-amber-300/70 dark:border-amber-600/60 bg-amber-50/60 dark:bg-amber-950/20'
  return 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950'
}

function badgeColor(op: DiffEntry['op']) {
  if (op === 'add') return 'green'
  if (op === 'remove') return 'red'
  return 'amber'
}

function badgeLabel(op: DiffEntry['op']) {
  if (op === 'add') return '+'
  if (op === 'remove') return '-'
  return '~'
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function flattenEntity(input: unknown, prefix = '', target: Record<string, unknown> = {}) {
  if (input === null || input === undefined) {
    if (prefix) target[prefix] = input
    return target
  }

  if (input instanceof Date) {
    if (prefix) target[prefix] = input
    return target
  }

  if (typeof input !== 'object') {
    if (prefix) target[prefix] = input
    else target['value'] = input
    return target
  }

  if (Array.isArray(input)) {
    if (input.length === 0 && prefix) target[prefix] = []
    input.forEach((value, index) => {
      const nextKey = prefix ? `${prefix}.${index}` : String(index)
      flattenEntity(value, nextKey, target)
    })
    return target
  }

  const entries = Object.entries(input as Record<string, unknown>)
  if (entries.length === 0 && prefix) {
    target[prefix] = {}
    return target
  }

  for (const [key, value] of entries) {
    const nextKey = prefix ? `${prefix}.${key}` : key
    flattenEntity(value, nextKey, target)
  }

  return target
}
</script>
