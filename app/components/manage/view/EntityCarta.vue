<!-- /app/components/manage/views/EntityCarta.vue -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
  <div v-for="item in crud.items?.value ?? crud.items" :key="item.id" class="flex flex-col items-center w-full">
    <div class="flex items-start justify-center w-fit">
      <!-- Card principal -->
      <div>
        <component
          :is="Resolved"
          v-if="templateKey === 'Class'"
          class="shadow-lg shadow-gray-800"
          :type-label="entity"
          :name="item.name"
          :short-text="item.short_text"
          :description="item.description"
          :img="resolveImage(item.image)"
        />
        <component
          :is="Resolved"
          v-else-if="templateKey === 'Origin'"
          class="shadow-lg shadow-gray-800"
          :title="item.name"
          :short-text="item.short_text"
          :description="item.description"
          :img="resolveImage(item.image)"
          :card-info="item.typeLabel"
        />
      </div>

      <!-- Acciones justo al lado del card -->
      <div class="flex flex-col gap-1 self-start pt-1 pl-1">
        <EntityActions
          :entity="item"
          :entity-label="label"
          :entity-type="label"
          :no-tags="noTags"
          vertical
          @editform="() => emit('edit', item)"
          @feedback="() => emit('feedback', item)"
          @tags="() => emit('tags', item)"
          @delete="() => emit('delete', item)"
        />
      </div>
    </div>

    <!-- Fila inferior: estado + tags -->
    <div class="mt-3 space-y-1 text-center">
      <div class="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <UBadge
                :label="(item.is_active ? t('common.active') : t('common.inactive')) || '-'"
                :color="item.is_active ? 'primary' : 'neutral'"
                size="sm"
              />
         <UBadge
                  size="sm"
                  :color="statusColor(item.status)"
                  :variant="statusVariant(item.status)"
                >
                  {{ $t(statusLabelKey(item.status)) }}
                </UBadge>
      </div>

      <div v-if="!noTags && Array.isArray(item.tags) && item.tags.length"  class="flex flex-wrap justify-center gap-1">
        <UBadge
            v-for="(tag, idx) in item.tags"
            :key="tag.id ?? tag.code ?? idx"
            color="neutral"
            size="sm"
            variant="subtle"
          >
            {{ tag.name ?? tag.label ?? tag.code }}
          </UBadge>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '#imports'
import { useCardTemplates } from '~/composables/common/useCardTemplates'
import EntityActions from '~/components/manage/EntityActions.vue'
import { useCardStatus } from '~/utils/status'

const props = defineProps<{
  crud: any
  label: string
  entity: string
  noTags?: boolean
  cardType?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', entity: any): void
  (e: 'delete', entity: any): void
  (e: 'feedback', entity: any): void
  (e: 'tags', entity: any): void
  (e: 'preview', entity: any): void
}>()

const { t, locale } = useI18n()

const { resolveTemplate } = useCardTemplates()
// const Resolved = computed(() => resolveTemplate(props.templateKey as any))
const templateKey = 'Class'
const Resolved = computed(() => resolveTemplate(templateKey as any))

function resolveImage(src?: string) {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('/')) return src
  
  return `/img/${props.entity}/${src}`
}

function titleOf(item: any): string {
  return item?.name ?? item?.title ?? item?.code ?? '—'
}

function isActive(item: any): boolean {
  return Boolean(item?.is_active ?? item?.isActive ?? false)
}

function langBadge(item: any): string | null {
  const lc = (item?.language_code_resolved || item?.language_code || item?.lang || '').toString()
  if (!lc) return null
  return lc !== String(locale.value) ? lc : null
}

const statusUtil = useCardStatus()
const statusOptions = statusUtil.options()

function getStatusMeta(value: string | null | undefined) {
  if (!value) return null
  return statusOptions.find(option => option.value === value) ?? null
}

function statusColor(value: string | null | undefined) {
  return getStatusMeta(value)?.color ?? 'neutral'
}

function statusVariant(value: string | null | undefined) {
  return getStatusMeta(value)?.variant ?? 'subtle'
}

function statusLabelKey(value: string | null | undefined) {
  return getStatusMeta(value)?.labelKey ?? 'status.draft'
}

</script>