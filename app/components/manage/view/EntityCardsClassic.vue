<!-- /app/components/manage/views/EntityCardsClassic.vue -->
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <template v-if="crud.loading.value">
      <UCard v-for="n in 6" :key="`classic-skeleton-${n}`" class="flex flex-col gap-3 h-full text-sm">
        <div class="flex items-start gap-3">
          <USkeleton class="w-15 h-20 rounded-md" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-3 w-1/2" />
            <USkeleton class="h-3 w-full" />
          </div>
        </div>
        <USkeleton class="h-3 w-5/6" />
      </UCard>
    </template>
    <template v-else-if="(crud.items?.value ?? crud.items)?.length === 0">
      <div class="col-span-full">
        <UCard class="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <UIcon name="i-heroicons-magnifying-glass-circle" class="h-14 w-14 text-neutral-300 dark:text-neutral-600" />
          <div class="space-y-2">
            <p class="text-lg font-semibold text-neutral-700 dark:text-neutral-200">{{ t('common.noResults') }}</p>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ t('common.tryAdjustFilters') }}</p>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <UButton color="primary" icon="i-heroicons-plus" @click="onCreateFromEmpty">
              {{ t('ui.actions.create') }} {{ label }}
            </UButton>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-heroicons-arrow-path"
              @click="onResetFiltersFromEmpty"
            >
              {{ t('common.resetFilters') }}
            </UButton>
          </div>
        </UCard>
      </div>
    </template>
    <UCard v-else v-for="item in crud.items?.value ?? crud.items" :key="item.id" class="flex flex-col gap-3 h-full text-sm">
      <div class="flex justify-between items-start gap-3">
        <div class="flex items-start gap-3 flex-1">
          <img
            v-if="item.image"
            :src="resolveImage(item.image || item.thumbnail_url)"
            :alt="item.name || item.code"
            class="w-15 h-20 object-cover rounded-md border border-neutral-200 dark:border-neutral-700"
            loading="lazy"
            @error="imageFallback"
          >
          <div class="flex-1 space-y-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
               <span class="truncate" :title="titleOf(item)">{{ titleOf(item) }}</span>
              <UButton
                icon="i-heroicons-eye"
                size="xs"
                color="neutral"
                variant="ghost"
                :title="$t('ui.actions.preview')"
                @click="onPreviewClick(item)"
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
              <StatusBadge
                :status="item.status"
                kind="card"
              />
              <UBadge
                :label="(item.is_active ? t('ui.states.active') : t('ui.states.inactive')) || '-'"
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
          :no-tags="noTags || isTagEntity"
          vertical
          @edit="onEditClick(item)"
          @feedback="onFeedbackClick(item)"
          @tags="onTagsClick(item)"
          @delete="onDeleteClick(item)"
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
      <div v-if="!noTags && !isTagEntity && Array.isArray(item.tags) && item.tags.length" class="flex flex-wrap gap-1 mt-2">
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
import { computed } from 'vue'
import { useI18n } from '#imports'
import EntityActions from '~/components/manage/EntityActions.vue'
import StatusBadge from '~/components/common/StatusBadge.vue'
import { useCardViewHelpers } from '~/composables/common/useCardViewHelpers'
import type { ManageCrud } from '@/types/manage'

const props = defineProps<{
  crud: ManageCrud
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
  (e: 'create'): void
  (e: 'reset-filters'): void
}>()

const { t, locale } = useI18n()

const {
  resolveImage,
  imageFallback,
  titleOf,
  isActive,
  langBadge
} = useCardViewHelpers({
  entity: computed(() => props.entity),
  locale
})

const isTagEntity = computed(() => props.entity === 'tag')

function onPreviewClick(item: any) { emit('preview', item) }
function onEditClick(item: any) { emit('edit', item) }
function onDeleteClick(item: any) { emit('delete', item) }
function onFeedbackClick(item: any) { emit('feedback', item) }
function onTagsClick(item: any) { emit('tags', item) }
function onCreateFromEmpty() { emit('create') }
function onResetFiltersFromEmpty() { emit('reset-filters') }
</script>