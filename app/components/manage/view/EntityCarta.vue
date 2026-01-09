<!-- app/components/manage/view/EntityCarta.vue -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
    <div 
      v-for="item in ctx.crud.items?.value ?? ctx.crud.items" 
      :key="item.id" 
      class="group relative flex flex-col items-center w-full"
    >
      <!-- Selection Indicator -->
      <div 
        class="absolute top-0 left-1/2 -translate-x-32 -translate-y-2 z-20 transition-opacity"
        :class="[ctx.tableSelectionSource?.isSelected(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100']"
      >
        <UCheckbox 
          :model-value="ctx.tableSelectionSource?.isSelected(item.id)" 
          @update:model-value="ctx.tableSelectionSource?.toggleOne(item.id, $event)" 
          @click.stop
        />
      </div>

      <div class="flex items-start justify-center w-fit relative">
        <!-- Main Card Component -->
        <div class="transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2">
          <component
            :is="Resolved"
            v-if="ctx.templateKey.value === 'Class'"
            class="shadow-xl shadow-neutral-900/20 dark:shadow-black/40 rounded-[2rem]"
            :type-label="showCardType ? resolveTypeLabel(item) : ''"
            :name="item.name"
            :short-text="item.short_text"
            :description="item.description"
            :img="resolveImage(item.image)"
            :legacy-effects="item.legacy_effects"
            :effects-markdown="resolveEffectsMarkdown(item)"
          />
          <component
            :is="Resolved"
            v-else-if="ctx.templateKey.value === 'Origin'"
            class="shadow-xl shadow-neutral-900/20 dark:shadow-black/40 rounded-[2rem]"
            :title="item.name"
            :short-text="item.short_text"
            :description="item.description"
            :img="resolveImage(item.image)"
            :card-info="showCardType ? resolveTypeLabel(item) : null"
            :legacy-effects="item.legacy_effects"
            :effects-markdown="resolveEffectsMarkdown(item)"
          />
        </div>

        <!-- Float Actions (Modern Style) -->
        <div class="absolute -right-12 top-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
          <UButton 
            icon="i-heroicons-eye" 
            size="sm" 
            color="neutral" 
            variant="solid" 
            class="rounded-full shadow-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white hover:scale-110"
            @click.stop="ctx.onPreview(item)"
          />
          <UButton 
            icon="i-heroicons-pencil" 
            size="sm" 
            color="neutral" 
            variant="solid" 
            class="rounded-full shadow-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white hover:scale-110"
            @click.stop="ctx.onEdit(item)"
          />
          <UButton 
            icon="i-heroicons-trash" 
            size="sm" 
            color="error" 
            variant="solid" 
            class="rounded-full shadow-lg hover:scale-110"
            @click.stop="ctx.onDelete(item)"
          />
        </div>
      </div>

      <!-- Bottom Info Area -->
      <div class="mt-6 flex flex-col items-center gap-3 w-full max-w-[260px]">
        <div class="flex items-center justify-center gap-3">
          <StatusBadge
            :type="isUserEntity ? 'user' : 'status'"
            :value="typeof item.status === 'string' ? item.status : null"
            size="sm"
          />
          <UBadge
            :color="item.is_active ? 'primary' : 'neutral'"
            size="sm"
            variant="soft"
            class="rounded-lg font-bold"
          >
            {{ item.is_active ? t('ui.states.active') : t('ui.states.inactive') }}
          </UBadge>
        </div>

        <!-- Tags Cloud -->
        <div v-if="allowTags && Array.isArray(item.tags) && item.tags.length" class="flex flex-wrap justify-center gap-1.5">
          <UBadge
            v-for="(tag, idx) in item.tags.slice(0, 4)"
            :key="tag.id ?? idx"
            color="neutral"
            size="xs"
            variant="outline"
            class="rounded-md border-neutral-200 dark:border-neutral-700 font-medium"
          >
            {{ tag.name ?? tag.code }}
          </UBadge>
          <span v-if="item.tags.length > 4" class="text-[10px] text-neutral-400 font-bold">+{{ item.tags.length - 4 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import { useCardTemplates } from '~/composables/common/useCardTemplates'
import EntityActions from '~/components/manage/EntityActions.vue'
import StatusBadge from '~/components/common/StatusBadge.vue'
import { useCardViewHelpers } from '~/composables/common/useCardViewHelpers'

const ctx = useEntityBase()
const { t, locale } = useI18n()

const { resolveTemplate } = useCardTemplates()
const templateKey = computed(() => ctx.templateKey.value ?? 'Class')
const Resolved = computed(() => resolveTemplate(templateKey.value as 'Class' | 'Origin'))

const {
  resolveImage
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

function resolveEffectsMarkdown(item: unknown): string | null {
  const i = item as Record<string, unknown>
  if (!i?.legacy_effects) return null
  const raw = i?.effects
  if (!raw) return null
  const record = typeof raw === 'string' ? parseJsonSafe(raw) : raw
  if (!record || typeof record !== 'object') return null

  const localeCode = typeof locale === 'string' ? locale : locale.value
  const normalizedLocale = String(localeCode || 'en').toLowerCase()
  const localesToTry = [normalizedLocale]

  const resolvedLang = String(i?.language_code_resolved || i?.language_code || '').toLowerCase()
  if (resolvedLang && !localesToTry.includes(resolvedLang)) localesToTry.unshift(resolvedLang)
  if (!localesToTry.includes('en')) localesToTry.push('en')

  const values = Object.values(record as Record<string, unknown>)
  for (const value of localesToTry
    .map(code => (record as Record<string, unknown>)[code])
    .concat(values)) {
    const lines = toLines(value)
    if (lines && lines.length) {
      return lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n')
    }
  }

  return null
}

function toLines(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value === 'string') {
    return value ? [value] : null
  }
  return null
}

function parseJsonSafe(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function resolveTypeLabel(item: unknown): string {
  const i = item as Record<string, unknown>
  return (
    (i?.card_type_name as string)
    ?? (i?.card_type_code as string)
    ?? ctx.entityKey.value
    ?? ''
  )
}
</script>