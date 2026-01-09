<!-- app/components/manage/view/EntityCardsClassic.vue -->
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <template v-if="ctx.crud.loading.value">
      <div v-for="n in 6" :key="`classic-skeleton-${n}`" class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm space-y-3">
        <div class="flex items-start gap-4">
          <USkeleton class="w-16 h-20 rounded-xl" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-3 w-1/2" />
            <USkeleton class="h-3 w-full" />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="(ctx.crud.items?.value ?? ctx.crud.items)?.length === 0">
      <div class="col-span-full py-16 flex flex-col items-center justify-center text-center">
        <UIcon name="i-heroicons-magnifying-glass-circle" class="h-16 w-16 text-neutral-200 dark:text-neutral-800 mb-4" />
        <h3 class="text-lg font-bold text-neutral-900 dark:text-white">{{ t('common.noResults') }}</h3>
        <p class="text-neutral-500 max-w-xs mx-auto mt-1">{{ t('common.tryAdjustFilters') }}</p>
      </div>
    </template>

    <div 
      v-for="item in ctx.crud.items?.value ?? ctx.crud.items" 
      v-else 
      :key="item.id"
      class="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
    >
      <!-- Selection Indicator -->
      <div 
        class="absolute top-3 left-3 z-20 transition-opacity"
        :class="[ctx.tableSelectionSource?.isSelected(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100']"
      >
        <UCheckbox 
          :model-value="ctx.tableSelectionSource?.isSelected(item.id)" 
          @update:model-value="ctx.tableSelectionSource?.toggleOne(item.id, $event)" 
          @click.stop
        />
      </div>

      <div class="flex gap-4 min-w-0">
        <!-- Image with Hover Overlay -->
        <div class="w-16 h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 relative">
          <img
            v-if="item.image"
            :src="resolveImage(item.image || item.thumbnail_url)"
            alt=""
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          >
          <div v-else class="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
            <UIcon :name="ctx.capabilities.value.icon || 'i-heroicons-photo'" class="w-8 h-8 text-neutral-400 opacity-20" />
          </div>
          
          <!-- Small Hover Overlay -->
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <UIcon name="i-heroicons-eye" class="text-white w-5 h-5" @click.stop="ctx.onPreview(item)" />
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h3 class="font-bold text-neutral-900 dark:text-white truncate group-hover:text-primary-500 transition-colors leading-tight" :title="titleOf(item)">
                {{ titleOf(item) }}
              </h3>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="item.code" class="text-[10px] font-mono text-neutral-400 tracking-wider">#{{ item.code }}</span>
                <UBadge v-if="langBadge(item)" color="neutral" variant="soft" size="xs" class="rounded px-1 py-0 scale-90">
                  {{ langBadge(item) }}
                </UBadge>
              </div>
            </div>
            
            <StatusBadge
              :type="isUserEntity ? 'user' : 'status'"
              :value="typeof item.status === 'string' ? item.status : null"
              size="sm"
              class="shrink-0"
            />
          </div>

          <div class="mt-2 flex items-center gap-2 text-[10px] text-neutral-500 font-medium">
            <span v-if="item.card_type_name" class="truncate">{{ item.card_type_name }}</span>
            <span v-if="item.card_type_name" class="text-neutral-300">•</span>
            <span :class="[item.is_active ? 'text-primary-500' : 'text-neutral-400']">
              {{ item.is_active ? t('ui.states.active') : t('ui.states.inactive') }}
            </span>
          </div>
        </div>

        <!-- Actions (Vertical) -->
        <div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
          <UButton 
            icon="i-heroicons-pencil" 
            size="xs" 
            color="neutral" 
            variant="ghost" 
            class="rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            @click.stop="ctx.onEdit(item)"
          />
          <UButton 
            icon="i-heroicons-trash" 
            size="xs" 
            color="error" 
            variant="ghost" 
            class="rounded-lg"
            @click.stop="ctx.onDelete(item)"
          />
        </div>
      </div>

      <!-- Footer Text -->
      <div v-if="item.short_text" class="mt-3 text-xs text-neutral-500 line-clamp-1 italic italic-lore border-t border-neutral-100 dark:border-neutral-800 pt-2">
        "{{ item.short_text }}"
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
  imageFallback,
  titleOf,
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

const isTagEntity = computed(() => ctx.entityKey.value === 'tag')
const isUserEntity = computed(() => ctx.entityKey.value === 'user')
</script>