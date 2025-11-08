<!-- /app/components/manage/views/EntityCards.vue -->
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <UCard v-for="item in crud.items?.value ?? crud.items" :key="item.id">
      <template #header>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-medium truncate" :title="titleOf(item)">{{ titleOf(item) }}</p>
              <UButton
                icon="i-heroicons-eye"
                size="xs"
                color="neutral"
                variant="ghost"
                aria-label="Preview"
                @click="emit('preview', item)"
              />
              <UBadge v-if="langBadge(item)" color="neutral" variant="subtle" size="sm">
                {{ langBadge(item) }}
              </UBadge>
            </div>
            <p v-if="item.code" class="text-xs text-neutral-500 truncate">#{{ item.code }}</p>
            <p v-if="cardType && (item.card_type_name || item.card_type_code)" class="text-xs text-neutral-600 truncate">
              {{ item.card_type_name || item.card_type_code }}
              <UBadge v-if="item.card_type_lang" color="neutral" variant="soft" size="sm" class="ml-1">{{ item.card_type_lang }}</UBadge>
            </p>
          </div>
          <EntityActions
            :entity="item"
            :entity-label="label"
            :entity-type="label"
            :no-tags="noTags"
            @edit="() => emit('edit', item)"
            @feedback="() => emit('feedback', item)"
            @tags="() => emit('tags', item)"
            @delete="() => emit('delete', item)"
          />
        </div>
      </template>

      <template #default>
        <img
          :src="resolveImage(item.image || item.thumbnail_url) || '/img/default.avif'"
          alt=""
          class="w-full h-36 object-cover rounded-md mb-3"
          loading="lazy"
          @error="imageFallback"
        >
        <div class="flex items-center gap-2 mb-2">
           <UBadge
                  size="sm"
                  :color="statusColor(item.status)"
                  :variant="statusVariant(item.status)"
                >
                  {{ $t(statusLabelKey(item.status)) }}
                </UBadge>
          <UBadge
            :color="isActive(item) ? 'primary' : 'neutral'"
            size="sm"
            variant="outline"
          >
            {{ isActive(item) ? t('common.active') : t('common.inactive') }}
          </UBadge>
        </div>
        <p v-if="item.short_text" class="text-sm text-neutral-700 dark:text-neutral-300">
          {{ item.short_text }}
        </p>
        <p v-if="item.description" class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-3">
          {{ item.description }}
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
}>()

const { t, locale } = useI18n()

const {
  resolveImage,
  imageFallback,
  titleOf,
  isActive,
  langBadge,
  statusColor,
  statusVariant,
  statusLabelKey
} = useCardViewHelpers({
  entity: computed(() => props.entity),
  locale
})

</script>