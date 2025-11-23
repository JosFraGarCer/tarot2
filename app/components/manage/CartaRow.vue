<!-- app/components/manage/CartaRow.vue -->
<template>
  <div class="flex flex-col items-center w-full">
    <div class="flex items-start justify-center w-fit">
      <div>
        <component
          :is="resolvedTemplate"
          v-if="templateKeyResolved === 'Class'"
          class="shadow-lg shadow-gray-800"
          :type-label="typeLabel"
          :name="name"
          :short-text="shortText"
          :description="description"
          :img="resolvedImage"
          :legacy-effects="legacyEffects"
          :effects-markdown="effectsMarkdown"
        />
        <component
          :is="resolvedTemplate"
          v-else
          class="shadow-lg shadow-gray-800"
          :card-info="cardInfo"
          :title="name"
          :short-text="shortText"
          :description="description"
          :img="resolvedImage"
          :legacy-effects="legacyEffects"
          :effects-markdown="effectsMarkdown"
        />
      </div>

      <div class="flex flex-col gap-1 self-start pt-1">
        <slot name="actions" />
      </div>
    </div>

    <div class="mt-3 space-y-1 text-center">
      <div v-if="showStatusRow" class="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <span
          v-if="active !== undefined"
          class="inline-flex h-2 w-2 rounded-full"
          :class="active ? 'bg-emerald-500' : 'bg-red-500'"
        />
        <UBadge
          v-if="statusMeta"
          size="sm"
          :color="statusMeta.color"
          :variant="statusMeta.variant"
        >
          {{ statusLabel }}
        </UBadge>
      </div>

      <div v-if="resolvedTags.length" class="flex flex-wrap justify-center gap-1">
        <UBadge
          v-for="(tag, idx) in resolvedTags"
          :key="tagKey(tag, idx)"
          size="sm"
          color="neutral"
          variant="subtle"
        >
          {{ tagLabel(tag) }}
        </UBadge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import { useCardTemplates } from '~/composables/common/useCardTemplates'
import type { CardTemplateKey } from '~/composables/common/useCardTemplates'
import { useCardStatus } from '~/utils/status'
import { useCardViewHelpers } from '~/composables/common/useCardViewHelpers'

const props = withDefaults(defineProps<{
  templateKey?: CardTemplateKey
  entity?: string
  typeLabel?: string
  name: string
  shortText?: string
  description?: string
  img?: string
  cardInfo?: string
  status?: string | null
  active?: boolean
  tags?: Array<any>
  legacyEffects?: boolean
  effectsMarkdown?: string | null
  effects?: Record<string, unknown> | null
}>(), {
  templateKey: 'Class',
  entity: '',
  typeLabel: '',
  shortText: '',
  description: '',
  img: undefined,
  cardInfo: '',
  status: null,
  active: undefined,
  tags: () => [],
  legacyEffects: false,
  effectsMarkdown: null,
  effects: null,
})

const { t, locale } = useI18n()
const { resolveTemplate } = useCardTemplates()
const cardStatus = useCardStatus()
const {
  resolveImage,
  imageFallback,
  statusColor,
  statusVariant,
  statusLabelKey
} = useCardViewHelpers({
  entity: computed(() => props.entity || ''),
})

const templateKeyResolved = computed<CardTemplateKey>(() => props.templateKey ?? 'Class')
const resolvedTemplate = computed(() => resolveTemplate(templateKeyResolved.value))

const typeLabel = computed(() => props.typeLabel || props.cardInfo || '')
const name = computed(() => props.name)
const shortText = computed(() => props.shortText || '')
const description = computed(() => props.description || '')
const img = computed(() => props.img)
const resolvedImage = computed(() => resolveImage(img.value))
const cardInfo = computed(() => props.cardInfo || props.typeLabel || '')
const active = computed(() => props.active)
const legacyEffects = computed(() => props.legacyEffects ?? false)
const effects = computed(() => props.effects)
const currentLocale = computed(() => (typeof locale === 'string' ? locale : locale.value) || 'en')

const effectsMarkdown = computed(() => {
  if (!legacyEffects.value) return null
  if (props.effectsMarkdown) return props.effectsMarkdown
  const normalized = normalizeEffects(effects.value)
  if (!normalized) return null
  return resolveEffectsMarkdown(normalized, currentLocale.value)
})

const statusMeta = computed(() => {
  if (!props.status) return null
  return cardStatus.options().find(option => option.value === props.status) ?? null
})

const statusLabel = computed(() => {
  if (!props.status) return ''
  return t(statusLabelKey(props.status as any))
})

const showStatusRow = computed(() => active.value !== undefined || statusMeta.value !== null)

const resolvedTags = computed(() => props.tags?.filter(tag => tag !== undefined && tag !== null) ?? [])

function tagKey(tag: any, idx: number) {
  if (tag && typeof tag === 'object') {
    return tag.id ?? tag.code ?? tag.name ?? tag.label ?? idx
  }
  return `${idx}-${String(tag)}`
}

function tagLabel(tag: any) {
  if (tag && typeof tag === 'object') {
    return tag.name ?? tag.label ?? tag.code ?? String(tag.id ?? '')
  }
  return String(tag)
}

function normalizeEffects(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
    } catch {
      return null
    }
  }
  if (typeof raw === 'object') {
    return raw as Record<string, unknown>
  }
  return null
}

function resolveEffectsMarkdown(effects: Record<string, unknown>, localeCode: string): string | null {
  const normalizedLocale = String(localeCode || 'en').toLowerCase()
  const localesToTry = [normalizedLocale]
  if (!localesToTry.includes('en')) localesToTry.push('en')

  const values = Object.values(effects)
  for (const value of localesToTry
    .map(code => effects[code])
    .concat(values)) {
    const lines = toLines(value)
    if (lines && lines.length) {
      const markdown = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n')
      if (markdown) {
        return markdown
      }
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
</script>
