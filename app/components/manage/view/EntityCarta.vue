<!-- app/components/manage/view/EntityCarta.vue -->
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
          v-else-if="templateKey === 'Origin'"
          class="shadow-lg shadow-gray-800"
          :title="item.name"
          :short-text="item.short_text"
          :description="item.description"
          :img="resolveImage(item.image)"
          :card-info="showCardType ? resolveTypeLabel(item) : null"
          :legacy-effects="item.legacy_effects"
          :effects-markdown="resolveEffectsMarkdown(item)"
        />
      </div>

      <!-- Acciones justo al lado del card -->
      <div class="flex flex-col gap-1 self-start pt-1 pl-1">
        <EntityActions
          :entity="item"
          :entity-label="label"
          :entity-type="label"
          :no-tags="!allowTags || isTagEntity"
          vertical
          @edit="() => emit('edit', item)"
          @feedback="() => emit('feedback', item)"
          @tags="onTags(item)"
          @delete="onDelete(item)"
        />
      </div>
    </div>

    <!-- Fila inferior: estado + tags -->
    <div class="mt-3 space-y-1 text-center">
      <div class="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <UBadge
          :label="(item.is_active ? t('ui.states.active') : t('ui.states.inactive')) || '-'"
          :color="item.is_active ? 'primary' : 'neutral'"
          size="sm"
        />
        <StatusBadge
          v-if="allowPreview"
          type="status"
          :value="typeof item.status === 'string' ? item.status : null"
        />
      </div>

      <div v-if="allowTags && !isTagEntity && Array.isArray(item.tags) && item.tags.length" class="flex flex-wrap justify-center gap-1">
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
import { computed } from 'vue'
import { useI18n } from '#imports'
import { useCardTemplates } from '~/composables/common/useCardTemplates'
import EntityActions from '~/components/manage/EntityActions.vue'
import StatusBadge from '~/components/common/StatusBadge.vue'
import { useCardViewHelpers } from '~/composables/common/useCardViewHelpers'
import { useEntityCapabilities } from '~/composables/common/useEntityCapabilities'

const props = defineProps<{
  crud: any
  label: string
  entity: string
  templateKey?: string
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
const templateKey = computed(() => props.templateKey ?? 'Class')
const Resolved = computed(() => resolveTemplate(templateKey.value as any))

const {
  resolveImage,
  titleOf,
  isActive,
  langBadge
} = useCardViewHelpers({
  entity: computed(() => props.entity),
  locale
})

const capabilities = useEntityCapabilities({
  kind: () => props.entity ?? null,
})

const allowPreview = computed(() => capabilities.value.hasPreview !== false)

const allowTags = computed(() => {
  if (props.noTags === true) return false
  if (props.noTags === false) return true
  return capabilities.value.hasTags !== false
})

const showCardType = computed(() => {
  const cap = capabilities.value.cardType
  if (cap !== undefined) return Boolean(cap)
  if (props.cardType !== undefined) return Boolean(props.cardType)
  return false
})

const isTagEntity = computed(() => props.entity === 'tag')

function onTags(entity: any) {
  if (!allowTags.value) return
  emit('tags', entity)
}

function onDelete(entity: any) {
  emit('delete', entity)
}

function onPreview(entity: any) {
  if (!allowPreview.value) return
  emit('preview', entity)
}

function resolveEffectsMarkdown(item: any): string | null {
  if (!item?.legacy_effects) return null
  const raw = item?.effects
  if (!raw) return null
  const record = typeof raw === 'string' ? parseJsonSafe(raw) : raw
  if (!record || typeof record !== 'object') return null

  const localeCode = typeof locale === 'string' ? locale : locale.value
  const normalizedLocale = String(localeCode || 'en').toLowerCase()
  const localesToTry = [normalizedLocale]

  const resolvedLang = String(item?.language_code_resolved || item?.language_code || '').toLowerCase()
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

function resolveTypeLabel(item: any): string {
  return (
    item?.card_type_name
    ?? item?.card_type_code
    ?? item?.typeLabel
    ?? props.entity
    ?? ''
  )
}
</script>