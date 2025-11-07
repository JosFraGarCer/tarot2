<!-- /app/components/manage/views/ManageEntityCards2.vue -->
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <UCard v-for="item in crud.items?.value ?? crud.items" :key="item.id" class="flex flex-col gap-3 h-full text-sm">
      <div class="flex justify-between items-start gap-3">
        <div class="flex items-start gap-3 flex-1">
          <img
            v-if="item.image"
            :src="resolveImage(item.image)"
            :alt="item.name || item.code"
            class="w-15 h-20 object-cover rounded-md border border-neutral-200 dark:border-neutral-700"
            loading="lazy"
          >
          <div class="flex-1 space-y-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
               <span class="truncate" :title="titleOf(item)">{{ titleOf(item) }}</span>
              <UButton
                icon="i-heroicons-eye"
                size="xs"
                color="neutral"
                variant="ghost"
                :title="$t('common.preview')"
                @click="() => emit('preview', item)"
              />
               <UBadge v-if="langBadge(item)" color="neutral" variant="subtle" size="sm">
                {{ langBadge(item) }}
              </UBadge>
            </p>

            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              {{ item.code }}
            </p>

            <p
              v-if="cardType"
              class="text-xs text-neutral-500 dark:text-neutral-400"
            >
              {{ item.card_type_name || item.card_type_code }}
              <UBadge
                v-if="item.card_type_language_code && item.card_type_language_code !== locale"
                size="xs"
                variant="soft"
              >
                {{ item.card_type_language_code }}
              </UBadge>
            </p>
            <div class="flex-1 space-x-2">
                <UBadge
                  size="sm"
                  :color="statusColor(item.status)"
                  :variant="statusVariant(item.status)"
                >
                  {{ $t(statusLabelKey(item.status)) }}
                </UBadge>
              <UBadge
                :label="(item.is_active ? t('common.active') : t('common.inactive')) || '-'"
                :color="item.is_active ? 'primary' : 'neutral'"
                size="sm"
              />
            </div>
          </div>
        </div>

        <!-- ACCIONES -->
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
      <!-- DESCRIPCIÓN -->
      <div class="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <p v-if="item.short_text" class="text-neutral-600 dark:text-neutral-400">
          {{ item.short_text }}
        </p>
        <p v-if="item.description" class="text-neutral-700 dark:text-neutral-300 text-xs">
          {{ item.description }}
        </p>
      </div>

      <!-- TAGS -->
      <div v-if="!noTags && Array.isArray(item.tags) && item.tags.length" class="flex flex-wrap gap-1 mt-2">
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
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '#imports'
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