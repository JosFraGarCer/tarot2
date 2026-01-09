<!-- app/components/manage/view/EntityCards.vue -->
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
    <template v-if="ctx.crud.loading.value">
      <div v-for="n in 8" :key="`skeleton-${n}`"
        class="aspect-[4/5] bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
        <USkeleton class="flex-1" />
        <div class="h-24 p-5 space-y-2">
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="h-3 w-1/2" />
        </div>
      </div>
    </template>

    <template v-else-if="(ctx.crud.items?.value ?? ctx.crud.items)?.length === 0">
      <div class="col-span-full py-20 flex flex-col items-center justify-center text-center">
        <UIcon name="i-heroicons-magnifying-glass-circle"
          class="h-20 w-20 text-neutral-200 dark:text-neutral-800 mb-4" />
        <h3 class="text-xl font-bold text-neutral-900 dark:text-white">{{ t('common.noResults') }}</h3>
        <p class="text-neutral-500 max-w-xs mx-auto mt-2">{{ t('common.tryAdjustFilters') }}</p>
        <div class="mt-6 flex gap-3">
          <UButton color="primary" variant="solid" icon="i-heroicons-plus" class="rounded-xl px-6"
            @click="ctx.onCreate()">
            {{ t('ui.actions.create') }}
          </UButton>
          <UButton color="neutral" variant="soft" icon="i-heroicons-funnel-slash" class="rounded-xl"
            @click="ctx.resetFilters()">
            {{ t('ui.actions.resetFilters') }}
          </UButton>
        </div>
      </div>
    </template>

    <div v-for="item in ctx.crud.items?.value ?? ctx.crud.items" v-else :key="item.id"
      class="group relative bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col">
      <!-- Multi-selection Indicator (New functionality) -->
      <div class="absolute top-4 left-4 z-20 transition-opacity"
        :class="[ctx.tableSelectionSource?.isSelected(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100']">
        <UCheckbox :model-value="ctx.tableSelectionSource?.isSelected(item.id)"
          @update:model-value="ctx.tableSelectionSource?.toggleOne(item.id, $event)" @click.stop />
      </div>

      <!-- Image/Icon Container with Hover Actions -->
      <div class="aspect-[4/5] bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden shrink-0">
        <img v-if="item.image" :src="resolveImage(item.image || item.thumbnail_url)" alt=""
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy">
        <div v-else class="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
          <UIcon :name="ctx.capabilities.value.icon || 'i-heroicons-photo'"
            class="w-16 h-16 text-neutral-400 opacity-20" />
        </div>

        <!-- Glassmorphism Gradient Overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

        <!-- Action Buttons (Hover State) -->
        <div
          class="absolute bottom-4 left-4 right-4 flex justify-between items-center z-20 translate-y-12 group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <UButton v-if="allowPreview" icon="i-heroicons-eye" size="sm" color="neutral" variant="solid"
            class="rounded-full shadow-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white hover:scale-110"
            @click.stop="ctx.onPreview(item)" />
          <div class="flex gap-2">
            <UButton icon="i-heroicons-pencil" size="sm" color="neutral" variant="solid"
              class="rounded-full shadow-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white hover:scale-110"
              @click.stop="ctx.onEdit(item)" />
            <UButton icon="i-heroicons-trash" size="sm" color="error" variant="solid"
              class="rounded-full shadow-lg hover:scale-110" @click.stop="ctx.onDelete(item)" />
          </div>
        </div>

        <!-- Badges on top of image -->
        <div
          class="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end opacity-100 group-hover:opacity-0 transition-opacity">
          <UBadge v-if="langBadge(item)" color="neutral" variant="subtle" size="xs"
            class="rounded-lg backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/30 text-white font-bold">
            {{ langBadge(item) }}
          </UBadge>
          <StatusBadge :type="isUserEntity ? 'user' : 'status'"
            :value="typeof item.status === 'string' ? item.status : null" size="sm" class="shadow-sm" />
        </div>
      </div>

      <!-- Content Area -->
      <div class="p-5 flex-1 flex flex-col min-w-0">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="min-w-0">
            <h3
              class="font-bold text-neutral-900 dark:text-white truncate group-hover:text-primary-500 transition-colors leading-tight"
              :title="titleOf(item)">
              {{ titleOf(item) }}
            </h3>
            <p v-if="item.code" class="text-[10px] font-mono text-neutral-400 mt-0.5 tracking-wider">#{{ item.code }}
            </p>
          </div>
          <UBadge v-if="item.release_stage" color="primary" variant="soft" size="xs" class="rounded-md shrink-0">
            {{ item.release_stage }}
          </UBadge>
        </div>

        <div class="flex-1 space-y-2">
          <p v-if="item.short_text || item.description"
            class="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed italic italic-lore">
            "{{ item.short_text || item.description }}"
          </p>

          <div v-if="allowTags && Array.isArray(item.tags) && item.tags.length" class="flex flex-wrap gap-1 pt-1">
            <UBadge v-for="(tag, idx) in item.tags.slice(0, 3)" :key="tag.id ?? idx" size="xs" variant="outline"
              color="neutral" class="rounded-md border-neutral-200 dark:border-neutral-700 font-medium">
              {{ tag.name ?? tag.code }}
            </UBadge>
            <span v-if="item.tags.length > 3" class="text-[10px] text-neutral-400 font-bold ml-1">+{{ item.tags.length -
              3
              }}</span>
          </div>
        </div>

        <!-- Entity Specific Bottom Info -->
        <div
          class="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px]">
          <div class="flex items-center gap-2 text-neutral-400 font-medium">
            <UIcon v-if="item.card_type_name" name="i-heroicons-tag" class="w-3 h-3" />
            <span class="truncate max-w-[80px]">{{ item.card_type_name || item.entity_type || 'Entity' }}</span>
          </div>
          <div v-if="item.modified_at || item.created_at" class="text-neutral-400">
            {{ formatDate(item.modified_at || item.created_at) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import EntityActions from '~/components/manage/EntityActions.vue'
import StatusBadge from '~/components/common/StatusBadge.vue'
import { useCardViewHelpers } from '~/composables/common/useCardViewHelpers'

const ctx = useEntityBase()
const { t, locale } = useI18n()

const {
  resolveImage,
  titleOf,
  isActive,
  langBadge
} = useCardViewHelpers({
  entity: computed(() => ctx.entityKey.value),
  locale
})

const allowPreview = computed(() => ctx.capabilities.value.hasPreview !== false)

const allowTags = computed(() => {
  if (ctx.noTags.value === true) return false
  if (ctx.noTags.value === false) return true
  return ctx.capabilities.value.hasTags !== false
})

const showCardType = computed(() => {
  const cap = ctx.capabilities.value.cardType
  if (cap !== undefined) return Boolean(cap)
  if (ctx.cardType.value !== undefined) return Boolean(ctx.cardType.value)
  return false
})

const isUserEntity = computed(() => ctx.entityKey.value === 'user')
const isTagEntity = computed(() => ctx.entityKey.value === 'tag')

function userRoles(item: unknown): string[] {
  const r = item as Record<string, unknown>
  const roles = Array.isArray(r?.roles) ? r.roles : []
  return roles
    .map((role: unknown) => (role as Record<string, unknown>)?.name)
    .filter((val: unknown): val is string => typeof val === 'string' && val.length > 0)
}

function formatDate(value: unknown) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value as string | number)
  if (Number.isNaN(date.getTime())) return ''
  const localeCode = typeof locale === 'string' ? locale : locale.value
  try {
    return new Intl.DateTimeFormat(localeCode || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
  } catch {
    return date.toISOString()
  }
}
</script>