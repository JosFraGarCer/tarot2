<!-- app/components/manage/EntityTableWrapper.vue -->
<!-- /app/components/manage/views/ManageEntityTable.vue -->
<template>
  <EntityTable
    :rows="tableRows"
    :loading="tableLoading"
    :columns="columns"
    :selected-ids="selectedIds"
    :crud="crudResource"
    @update:selected-ids="onUpdateSelected"
    @export-selected="(ids) => emit('export', ids)"
    @update-selected="(ids) => emit('batchUpdate', ids)"
  >
    <template #empty>
      <div class="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <UIcon name="i-heroicons-magnifying-glass-circle" class="h-14 w-14 text-neutral-300 dark:text-neutral-600" />
        <div class="space-y-2">
          <p class="text-lg font-semibold text-neutral-700 dark:text-neutral-200">{{ emptyTitle }}</p>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ emptySubtitle }}</p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <UButton color="primary" icon="i-heroicons-plus" @click="emit('create')">
            {{ emptyCreateLabel }}
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-heroicons-arrow-path"
            @click="emit('reset-filters')"
          >
            {{ emptyResetLabel }}
          </UButton>
        </div>
      </div>
    </template>
    <template #loading>
      <div class="space-y-2 py-6">
        <USkeleton v-for="n in 6" :key="`row-skeleton-${n}`" class="h-10 w-full rounded" />
      </div>
    </template>
    <template #actions="{ row }">
      <div class="flex items-center gap-1">
        <UButton
          icon="i-heroicons-pencil"
          color="primary"
          variant="soft"
          size="xs"
          :aria-label="t('ui.actions.quickEdit', 'Edición rápida')"
          @click="emit('edit', row.raw ?? row)"
        />
        <UButton
          icon="i-heroicons-arrows-pointing-out"
          color="primary"
          variant="ghost"
          size="xs"
          :aria-label="t('ui.actions.fullEdit', 'Edición completa')"
          @click="handleFullEdit(row)"
        />
        <UButton
          v-if="row.raw && canFeedback(row.raw)"
          icon="i-heroicons-exclamation-triangle"
          color="warning"
          variant="soft"
          size="xs"
          aria-label="Feedback"
          @click="emit('feedback', row.raw ?? row)"
        />
        <UButton
          v-if="row.raw && canTags(row.raw)"
          icon="i-heroicons-tag"
          color="neutral"
          variant="soft"
          size="xs"
          aria-label="Tags"
          @click="emit('tags', row.raw ?? row)"
        />
        <UButton
          icon="i-heroicons-trash"
          color="error"
          variant="soft"
          size="xs"
          aria-label="Delete"
          @click="emit('delete', row.raw ?? row)"
        />
      </div>
    </template>
  </EntityTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import EntityTable from '~/components/manage/view/EntityTable.vue'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'
import type { ManageCrud } from '@/types/manage'
import { useTableSelection } from '@/composables/common/useTableSelection'
import { useEntityCapabilities } from '~/composables/common/useEntityCapabilities'

const props = defineProps<{
  crud: ManageCrud
  label: string
  columns?: any[]
  noTags?: boolean
  entity?: string
}>()

const emit = defineEmits<{
  (e: 'edit', entity: any): void
  (e: 'full-edit', id: number): void
  (e: 'delete', entity: any): void
  (e: 'export', ids: number[]): void
  (e: 'batchUpdate', ids: number[]): void
  (e: 'create'): void
  (e: 'reset-filters'): void
  (e: 'feedback', entity: any): void
  (e: 'tags', entity: any): void
}>()

const selection = useTableSelection(() => props.crud.items.value.map(item => item?.id ?? item?.uuid ?? item?.code))
const selectedIds = selection.selectedList

const resourcePath = computed(() => props.crud?.resourcePath || '')
const crudResource = computed(() => ({ resourcePath: resourcePath.value }))

const { t } = useI18n()
const capabilities = useEntityCapabilities()

const allowTags = computed(() => {
  if (props.noTags === true) return false
  if (props.noTags === false) return true
  return capabilities.value.hasTags !== false
})

const tableRows = computed<EntityRow[]>(() => {
  const raw = props.crud.items.value
  return raw.map((entity) => normalizeEntity(entity))
})

const tableLoading = computed<boolean>(() => {
  return props.crud.loading.value
})

function normalizeEntity(entity: any): EntityRow {
  const resourcePathValue = resourcePath.value
  const isUserEntity = resourcePathValue.includes('/user')
  if (isUserEntity) {
    const rolesArray = Array.isArray(entity?.roles) ? entity.roles : []
    const roleNames = rolesArray
      .map((role: any) => role?.name)
      .filter((val: any): val is string => typeof val === 'string' && val.length > 0)

    const id = Number(entity?.id ?? 0) || 0
    const name = entity?.username ?? entity?.email ?? `#${id || '—'}`
    const image = resolveImage(entity)
    const permissions = typeof entity?.permissions === 'object' && entity?.permissions !== null
      ? entity.permissions as Record<string, boolean>
      : {}

    return {
      id,
      name,
      short_text: entity?.email ?? '',
      description: null,
      status: typeof entity?.status === 'string' ? entity.status : null,
      statusKind: 'user',
      img: image,
      email: entity?.email ?? null,
      username: entity?.username ?? null,
      roles: roleNames,
      permissions,
      created_at: entity?.created_at ?? null,
      updated_at: entity?.modified_at ?? null,
      raw: entity,
    }
  }

  const id = Number(entity?.id ?? entity?.uuid ?? entity?.code ?? 0)
  const name = entity?.name
    ?? entity?.title
    ?? entity?.label
    ?? entity?.code
    ?? `#${entity?.id ?? '—'}`
  const shortText = entity?.short_text ?? entity?.summary ?? ''
  const description = entity?.description ?? entity?.long_text ?? ''
  const status = entity?.status ?? entity?.state ?? null
  const isActive = entity?.is_active ?? entity?.isActive ?? null
  const image = resolveImage(entity)
  const tags = Array.isArray(entity?.tags)
    ? entity.tags.map((t: any) => t?.name ?? t?.label ?? t?.code ?? '').filter(Boolean).join(', ')
    : null

  return {
    id: Number.isFinite(id) && id > 0 ? id : Number(entity?.id) || 0,
    name,
    short_text: shortText,
    description,
    status: typeof status === 'string' ? status : null,
    is_active: typeof isActive === 'boolean' ? isActive : null,
    img: image,
    code: entity?.code ?? null,
    lang: entity?.language_code_resolved ?? entity?.language_code ?? entity?.lang ?? null,
    card_type: (
      // snake_case direct fields
      entity?.card_type_name
      ?? entity?.card_type_code
      ?? entity?.card_type_label
      ?? entity?.card_type_title
      // snake_case relation
      ?? entity?.card_type?.name
      ?? entity?.card_type?.code
      ?? entity?.card_type?.label
      ?? entity?.card_type?.title
      // camelCase direct fields
      ?? entity?.cardType_name
      ?? entity?.cardType_code
      ?? entity?.cardType_label
      ?? entity?.cardType_title
      // camelCase relation
      ?? entity?.cardType?.name
      ?? entity?.cardType?.code
      ?? entity?.cardType?.label
      ?? entity?.cardType?.title
      // generic 'type' relation sometimes used for base cards
      ?? entity?.type?.name
      ?? entity?.type?.code
      ?? entity?.type?.label
      ?? entity?.type?.title
      // direct string field
      ?? entity?.card_type
      ?? null
    ),
    arcana: (
      entity?.arcana_name
      ?? entity?.arcana_code
      ?? entity?.arcana_label
      ?? entity?.arcana_title
      ?? entity?.arcana?.name
      ?? entity?.arcana?.code
      ?? entity?.arcana?.label
      ?? entity?.arcana?.title
      // alternative keys
      ?? entity?.Arcana?.name
      ?? entity?.Arcana?.code
      ?? entity?.Arcana?.label
      ?? entity?.Arcana?.title
      // direct string field
      ?? entity?.arcana
      ?? null
    ),
    facet: (
      entity?.facet_name
      ?? entity?.facet_code
      ?? entity?.facet_label
      ?? entity?.facet_title
      ?? entity?.facet?.name
      ?? entity?.facet?.code
      ?? entity?.facet?.label
      ?? entity?.facet?.title
      // camelCase variants
      ?? entity?.Facet?.name
      ?? entity?.Facet?.code
      ?? entity?.Facet?.label
      ?? entity?.Facet?.title
      ?? entity?.facetRel?.name
      ?? entity?.facetRel?.code
      ?? entity?.facetRel?.label
      ?? entity?.facetRel?.title
      // direct string field
      ?? entity?.facet
      ?? null
    ),
    parent: entity?.parent_name ?? entity?.parent_code ?? null,
    category: entity?.category ?? null,
    tags,
    updated_at: entity?.updated_at ?? null,
    raw: entity,
  }
}

function resolveImage(entity: any): string | null {
  const src = entity?.image || entity?.thumbnail_url || entity?.img || null
  if (!src || typeof src !== 'string') return null
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:'))
    return src

  const resourcePathValue = resourcePath.value
  if (resourcePathValue.includes('/user')) {
    return src.startsWith('img/') ? `/${src}` : `/img/${src}`
  }

  if (entity?.entity_type) return `/img/${entity.entity_type}/${src}`

  const entityKey = props.label?.toLowerCase?.() ?? ''

  if (entityKey.includes('card type')) return `/img/cardType/${src}`
  if (entityKey.includes('world')) return `/img/world/${src}`
  if (entityKey.includes('facet')) return `/img/facet/${src}`
  if (entityKey.includes('skill')) return `/img/skill/${src}`
  if (entityKey.includes('arcana')) return `/img/arcana/${src}`

  return `/img/${src}`
}

function onUpdateSelected(ids: number[]) {
  selection.setSelected(ids)
}

const isTagEntity = computed(() => {
  const key = (props.entity || '').toLowerCase()
  if (key === 'tag') return true
  return resourcePath.value.includes('/tag')
})

const canFeedback = (_entity: any) => true
const canTags = (_entity: any) => allowTags.value && !isTagEntity.value

function handleFullEdit(row: EntityRow) {
  const raw = row.raw ?? row
  const id = Number(row.id ?? raw?.id)
  if (!Number.isFinite(id) || id <= 0) return
  emit('full-edit', id)
}

const emptyTitle = computed(() => t('common.noResults'))
const emptySubtitle = computed(() => t('common.tryAdjustFilters'))
const emptyCreateLabel = computed(() => `${t('ui.actions.create')} ${props.label}`)
const emptyResetLabel = computed(() => t('common.resetFilters'))
</script>