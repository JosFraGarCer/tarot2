<!-- /app/components/manage/views/EntityCards.vue -->
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <template v-if="crud.loading.value">
      <UCard v-for="n in 6" :key="`skeleton-${n}`" class="space-y-3">
        <USkeleton class="h-36 w-full rounded-md" />
        <div class="space-y-2">
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="h-3 w-1/2" />
          <USkeleton class="h-3 w-full" />
        </div>
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
    <UCard v-else v-for="item in crud.items?.value ?? crud.items" :key="item.id">
      <template #header>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 space-y-1">
            <div class="flex items-center gap-2">
              <p class="font-medium truncate" :title="titleOf(item)">{{ titleOf(item) }}</p>
              <UButton
                icon="i-heroicons-eye"
                size="xs"
                color="neutral"
                variant="ghost"
                aria-label="Preview"
                @click="onPreviewClick(item)"
              />
              <UBadge v-if="langBadge(item)" color="neutral" variant="subtle" size="sm">
                {{ langBadge(item) }}
              </UBadge>
            </div>
            <template v-if="isUserEntity">
              <p v-if="item.email" class="text-xs text-neutral-500 truncate">{{ item.email }}</p>
              <div v-if="userRoles(item).length" class="flex flex-wrap gap-1">
                <UBadge
                  v-for="role in userRoles(item)"
                  :key="role"
                  size="xs"
                  color="primary"
                  variant="soft"
                >
                  {{ role }}
                </UBadge>
              </div>
            </template>
            <template v-else>
              <p v-if="item.code" class="text-xs text-neutral-500 truncate">#{{ item.code }}</p>
              <p v-if="cardType && (item.card_type_name || item.card_type_code)" class="text-xs text-neutral-600 truncate">
                {{ item.card_type_name || item.card_type_code }}
                <UBadge v-if="item.card_type_lang" color="neutral" variant="soft" size="sm" class="ml-1">{{ item.card_type_lang }}</UBadge>
              </p>
            </template>
          </div>
          <EntityActions
            :entity="item"
            :entity-label="label"
            :entity-type="label"
            :no-tags="noTags"
            @edit="onEditClick(item)"
            @feedback="onFeedbackClick(item)"
            @tags="onTagsClick(item)"
            @delete="onDeleteClick(item)"
          />
        </div>
      </template>

      <template #default>
        <img
          v-if="item.image"
          :src="resolveImage(item.image || item.thumbnail_url)"
          alt=""
          class="w-full h-36 object-cover rounded-md mb-3"
          loading="lazy"
          @error="imageFallback"
        >
        <div class="flex items-center gap-2 mb-2">
          <StatusBadge
            :status="item.status"
            :kind="isUserEntity ? 'user' : 'card'"
          />
          <UBadge
            :color="isActive(item) ? 'primary' : 'neutral'"
            size="sm"
            variant="outline"
          >
            {{ isActive(item) ? t('ui.states.active') : t('ui.states.inactive') }}
          </UBadge>
        </div>
        <p v-if="!isUserEntity && item.short_text" class="text-sm text-neutral-700 dark:text-neutral-300">
          {{ item.short_text }}
        </p>
        <p v-if="!isUserEntity && item.description" class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-3">
          {{ item.description }}
        </p>
        <p v-if="isUserEntity && item.created_at" class="text-xs text-neutral-500 dark:text-neutral-400">
          {{ t('ui.misc.createdAt') }}: {{ formatDate(item.created_at) }}
        </p>
        <div v-if="!noTags && Array.isArray(item.tags) && item.tags.length" class="mt-3 flex flex-wrap gap-1.5">
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
      </template>
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

const isUserEntity = computed(() => props.entity === 'user')

function userRoles(item: any): string[] {
  const roles = Array.isArray(item?.roles) ? item.roles : []
  return roles
    .map((role: any) => role?.name)
    .filter((val: any): val is string => typeof val === 'string' && val.length > 0)
}

function formatDate(value: unknown) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value as any)
  if (Number.isNaN(date.getTime())) return ''
  const localeCode = typeof locale === 'string' ? locale : locale.value
  try {
    return new Intl.DateTimeFormat(localeCode || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
  } catch {
    return date.toISOString()
  }
}

function onPreviewClick(item: any) { emit('preview', item) }
function onEditClick(item: any) { emit('edit', item) }
function onDeleteClick(item: any) { emit('delete', item) }
function onFeedbackClick(item: any) { emit('feedback', item) }
function onTagsClick(item: any) { emit('tags', item) }
function onCreateFromEmpty() { emit('create') }
function onResetFiltersFromEmpty() { emit('reset-filters') }
</script>