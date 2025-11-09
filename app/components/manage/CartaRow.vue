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
          :img="img"
        />
        <component
          :is="resolvedTemplate"
          v-else
          class="shadow-lg shadow-gray-800"
          :title="name"
          :short-text="shortText"
          :description="description"
          :img="img"
          :card-info="cardInfo || typeLabel"
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

const props = withDefaults(defineProps<{
  templateKey?: CardTemplateKey
  typeLabel?: string
  name: string
  shortText?: string
  description?: string
  img?: string
  cardInfo?: string
  status?: string | null
  active?: boolean
  tags?: Array<any>
}>(), {
  templateKey: 'Class',
  typeLabel: '',
  shortText: '',
  description: '',
  img: undefined,
  cardInfo: '',
  status: null,
  active: undefined,
  tags: () => [],
})

const { t } = useI18n()
const { resolveTemplate } = useCardTemplates()
const cardStatus = useCardStatus()

const templateKeyResolved = computed<CardTemplateKey>(() => props.templateKey ?? 'Class')
const resolvedTemplate = computed(() => resolveTemplate(templateKeyResolved.value))

const typeLabel = computed(() => props.typeLabel || '')
const name = computed(() => props.name)
const shortText = computed(() => props.shortText || '')
const description = computed(() => props.description || '')
const img = computed(() => props.img)
const cardInfo = computed(() => props.cardInfo || '')
const active = computed(() => props.active)

const statusMeta = computed(() => {
  if (!props.status) return null
  return cardStatus.options().find(option => option.value === props.status) ?? null
})

const statusLabel = computed(() => {
  if (!props.status) return ''
  return t(cardStatus.labelKey(props.status as any))
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
</script>
