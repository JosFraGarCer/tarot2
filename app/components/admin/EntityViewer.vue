<!-- app/components/admin/EntityViewer.vue -->
<template>
  <UCard class="space-y-4">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {{ $t('features.admin.entityViewer.title', 'Entity snapshot') }}
          </h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            {{ $t('features.admin.entityViewer.subtitle', 'Preview of the current entity data.') }}
          </p>
        </div>
        <div v-if="languageCode" class="flex items-center gap-2 text-xs">
          <UBadge variant="soft" color="primary">
            <UIcon name="i-heroicons-language" class="mr-1" />
            {{ String(languageCode).toUpperCase() }}
          </UBadge>
        </div>
      </div>
    </template>

    <div v-if="isEmpty" class="py-10 text-center">
      <UIcon name="i-heroicons-inbox" class="h-10 w-10 text-neutral-300 mx-auto mb-2" />
      <p class="text-neutral-500 dark:text-neutral-400 text-sm">{{ $t('features.admin.entityViewer.empty', 'No data available for this entity.') }}</p>
    </div>
    <div v-else>
      <dl class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <template v-for="(value, key) in flatEntity" :key="key">
          <div
            class="rounded-lg border p-3 text-sm transition-colors"
            :class="highlightClass(key)"
          >
            <dt class="font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-2">
              <span class="truncate" :title="key">{{ key }}</span>
              <UBadge
                v-if="diffMap[key]"
                size="xs"
                :color="badgeColor(diffMap[key])"
                variant="soft"
              >{{ badgeLabel(diffMap[key]) }}</UBadge>
            </dt>
            <dd class="mt-1 text-neutral-600 dark:text-neutral-300 break-words whitespace-pre-wrap text-xs">
              {{ formatValue(value) }}
            </dd>
          </div>
        </template>
      </dl>

      <details class="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <summary class="cursor-pointer text-sm text-primary-600 dark:text-primary-400 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg transition-colors flex items-center gap-2">
          <UIcon name="i-heroicons-code-bracket" />
          {{ $t('features.admin.entityViewer.viewJson', 'View raw JSON') }}
        </summary>
        <pre class="mt-2 text-xs bg-neutral-100 dark:bg-neutral-900 rounded p-3 overflow-auto max-h-96 mx-2 mb-2">{{ formattedJson }}</pre>
      </details>
    </div>
  </UCard>
</template>

<script setup lang="ts">

interface DiffEntry {
  op: 'add' | 'remove' | 'replace'
  path: string
  [key: string]: any
}

const props = defineProps<{
  entity: Record<string, any> | null | undefined
  highlightDiff?: DiffEntry[] | null
  languageCode?: string | null
}>()

const normalizedEntity = computed(() => props.entity ?? {})
const isEmpty = computed(() => Object.keys(normalizedEntity.value).length === 0)

const flatEntity = computed<Record<string, any>>(() => flattenEntity(normalizedEntity.value))

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

function formatValue(value: any) {
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

function flattenEntity(input: any, prefix = '', target: Record<string, any> = {}) {
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

  const entries = Object.entries(input)
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
