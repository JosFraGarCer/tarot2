<!-- app/components/manage/modal/FormModal.vue -->
<!-- app/components/manage/Modal/FormModal.vue -->
<template>
  <UModal v-model:open="openInternal" :title="title" :description="description || ''" :ui="ui">
    <template #body>
      <UForm v-if="resolvedFields && Object.keys(resolvedFields).length" class="space-y-4" @submit.prevent="emit('submit')">
        <!-- Campos dinámicos -->
        <div v-for="(field, key) in resolvedFields" :key="key">
          <UFormField :label="trLabel(key as string, field.label)" :required="field.required" :class="{ hidden: field.hidden }">

            <USelectMenu
              v-if="field.type === 'select'"
              v-model="form[key]"
              :items="selectItems(field, key as string)"
              option-attribute="label"
              value-key="value"
              :disabled="field.disabled"
              class="w-full"
            />
            <USwitch
              v-else-if="field.type === 'toggle'"
              v-model="form[key]"
              :disabled="field.disabled"
              size="md"
            />
            <template v-else-if="field.type === 'effects'">
              <USwitch
                v-model="form.legacy_effects"
                :label="trLabel('legacy_effects', 'Legacy effects')"
                :disabled="field.disabled"
                size="md"
              />
              <p
                v-if="showFallbackHint(key)"
                class="text-xs text-neutral-500 dark:text-neutral-400 mb-1"
              >
                EN: {{ formatEffectsFallback() }}
              </p>
              <MarkdownEditor
                v-if="form.legacy_effects"
                v-model="effectsText"
                :label="field.label || trLabel(key as string, field.label)"
                :placeholder="field.placeholder || 'Write markdown content...'"
                :disabled="field.disabled"
              />
            </template>
            <ImageUploadField
              v-else-if="field.type === 'upload'"
              :model-value="imageFile"
              :preview="resolvedImagePreview"
              :field="imageFieldConfig"
              :enabled="true"
              @update:model-value="(v) => emit('update:image-file', v)"
              @remove="emit('remove-image')"
            />
            <template v-else-if="field.rows">
              <p
                v-if="showFallbackHint(key)"
                class="text-xs text-neutral-500 dark:text-neutral-400 mb-1"
              >
                EN: {{ props.englishItem?.[key] || '—' }}
              </p>
              <UTextarea
                v-model="form[key]"
                :rows="field.rows"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                class="w-full"
              />
            </template>
            <template v-else>
              <p
                v-if="showFallbackHint(key)"
                class="text-xs text-neutral-500 dark:text-neutral-400 mb-1"
              >
                EN: {{ props.englishItem?.[key] || '—' }}
              </p>
              <UInput
                v-model="form[key]"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                class="w-full"
              />
          </template>

          </UFormField>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="soft" :label="cancelLabel" @click="handleCancel" />
        <UButton color="primary" :label="submitLabel" :loading="loading" @click="emit('submit')" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch, onMounted } from 'vue'
import { useI18n } from '#imports'
import ImageUploadField from '~/components/manage/common/ImageUploadField.vue'
import MarkdownEditor from '~/components/common/MarkdownEditor.vue'
import { useEntityRelations } from '~/composables/manage/useEntityRelations'
import { entityFieldPresets } from '~/composables/manage/entityFieldPresets'
import type { z } from 'zod'
import { useCardStatus } from '~/utils/status'

// Props
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  entityLabel: string,
  entity: string,
  form: Record<string, unknown>
  loading?: boolean
  ui?: Record<string, unknown>
  submitLabel?: string
  cancelLabel?: string
  imageFile?: File | null
  imagePreview?: string | null
  imageFieldConfig?: Record<string, unknown>
  englishItem?: Record<string, unknown> | null
  schema?: {
    create?: z.ZodTypeAny
    update?: z.ZodTypeAny
  } | null
}>(), {
  loading: false,
  submitLabel: 'Save',
  cancelLabel: 'Cancel',
  englishItem: null,
  schema: null
})

const { t, locale } = useI18n()
const localeCode = computed(() =>
  typeof locale === 'string' ? locale : locale.value
)

// Configuración por defecto del campo de imagen
const imageFieldConfig = computed(() => {
  return props.imageFieldConfig || {
    label: 'Image',
    dropLabel: 'Drop image or click to upload',
    removeLabel: 'Remove image',
    previewAlt: 'Preview image',
    description: '',
    required: false,
    disabled: false
  }
})

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'submit'): void
  (e: 'cancel'): void
  (e: 'remove-image'): void
  (e: 'update:image-file', v: File | null): void
}>()

// Estado interno
const openInternal = computed({
  get: () => props.open,
  set: v => emit('update:open', v)
})

const form = reactive(props.form || {})
watch(
  () => props.form,
  (newVal) => {
    if (newVal && typeof newVal === 'object') {
      Object.assign(form, newVal)
    }
  },
  { deep: true, immediate: true }
)

const { arcanaOptions, cardTypeOptions, facetOptions, loadAll } = useEntityRelations()

const resolvedImagePreview = computed(() => {
  const preview = props.imagePreview
  if (typeof preview === 'string' && preview) return resolveImage(preview)
  const imageValue = (form as Record<string, unknown>)?.image
  if (typeof imageValue === 'string' && imageValue) return resolveImage(imageValue)
  return null
})

function resolveImage(src?: string | null) {
  if (!src) return ''
  const value = String(src)
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/')) return value

  if (value.includes('/')) {
    return `/img/${value}`
  }

  const entityKey = props.entity?.toString().trim()
  return entityKey ? `/img/${entityKey}/${value}` : `/img/${value}`
}
function showFallbackHint(key: string) {
  // solo mostrar si NO estamos en inglés y sí hay englishItem
  if (localeCode.value === 'en' || !props.englishItem) return false

  const translatableKeys = ['name', 'short_text', 'description', 'effects']
  return translatableKeys.includes(key) && !!props.englishItem[key]
}

function formatEffectsFallback(): string {
  const effects = props.englishItem?.effects as Record<string, string[] | string | undefined> | undefined
  if (!effects) return '—'
  const candidate =
    effects[localeCode.value] ??
    effects.en ??
    Object.values(effects).find((value) => {
      if (Array.isArray(value)) return value.length > 0
      return typeof value === 'string' && value.length > 0
    })
  if (Array.isArray(candidate)) return candidate.join(' / ')
  if (typeof candidate === 'string') return candidate
  return '—'
}

const normalizedLabel = computed(() =>
  props.entityLabel
    ?.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/s$/, '') // quita plural final
    .trim() || ''
)

interface FieldConfig {
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  type?: 'select' | 'toggle' | 'effects' | 'upload' | 'input' | 'textarea'
  rows?: number
  relation?: string
  options?: Array<{ label: string; value: unknown } | string>
}

// Build fields from Zod schema if provided; fallback to presets
const schemaResolvedFields = computed<Record<string, FieldConfig>>(() => {
  try {
    const s = props.schema?.update || props.schema?.create
    if (!s || typeof (s as unknown as { _def: unknown })._def === 'undefined') return {}
    const obj = s as unknown as { _def: { shape?: () => Record<string, unknown> | Record<string, unknown> } }
    const shapeDef = obj._def?.shape
    const shape = typeof shapeDef === 'function' ? shapeDef() : shapeDef
    if (!shape) return {}

    function unwrap(t: unknown): unknown {
      // unwrap Optional/Nullable/Effects
      let current = t as { _def?: { typeName?: string; innerType?: unknown; schema?: unknown; inner?: unknown } }
      while (current && (current._def?.typeName === 'ZodOptional' || current._def?.typeName === 'ZodNullable' || current._def?.typeName === 'ZodEffects')) {
        current = (current._def?.innerType || current._def?.schema || current._def?.inner) as typeof current
      }
      return current
    }

    const fields: Record<string, FieldConfig> = {}
    for (const key of Object.keys(shape)) {
      const raw = (shape as Record<string, unknown>)[key]
      const t = unwrap(raw) as { _def?: { typeName?: string; values?: unknown[]; options?: unknown[] } }
      let field: FieldConfig = { label: key, placeholder: '', required: false, disabled: false }

      // Heurística para relaciones por nombre
      if (/(^|_)arcana_id$/.test(key)) field = { ...field, type: 'select', relation: 'arcana' }
      else if (/(^|_)facet_id$/.test(key)) field = { ...field, type: 'select', relation: 'facet' }
      else if (/(^|_)card_type_id$/.test(key)) field = { ...field, type: 'select', relation: 'card_type' }
      else if (key === 'image') field = { ...field, type: 'upload' }
      else if (t?._def?.typeName === 'ZodBoolean') field = { ...field, type: 'toggle' }
      else if (t?._def?.typeName === 'ZodEnum' || t?._def?.typeName === 'ZodNativeEnum') {
        const options = (t._def.values || t._def.options || []) as string[]
        field = { ...field, type: 'select', relation: undefined, options }
      } else {
        field = { ...field, type: 'input' }
      }

      // Ensure known keys map to correct UI controls regardless of Zod internals
      if (key === 'status') {
        const options = (t?._def?.values || t?._def?.options || field.options || []) as string[]
        field = { ...field, type: 'select', relation: undefined, options }
      }
      if (key === 'is_active') {
        field = { ...field, type: 'toggle' }
      }

      // Ajustes por clave conocida
      if (key === 'description') field.rows = 5
      if (key === 'short_text') field.rows = 3
      if (key === 'legacy_effects') field = { ...field, type: 'toggle', hidden: true }
      if (key === 'effects') field = { ...field, type: 'effects' }

      // Ocultar/ignorar campos que no se editan desde el formulario
      if (['id', 'created_by', 'content_version_id', 'sort', 'language_code'].includes(key)) {
        field.hidden = true
      }

      fields[key] = field
    }
    return fields
  } catch (_e) {
    // fallback silencioso a presets
    return {}
  }
})

const resolvedFields = computed(() => {
  const fromSchema = schemaResolvedFields.value
  if (fromSchema && Object.keys(fromSchema).length) return fromSchema
  const label = normalizedLabel.value
  const preset = entityFieldPresets[label]
  if (!preset) {
    console.warn(`⚠️ No preset found for entityLabel="${props.entityLabel}" → normalized="${label}`)
  }
  return (preset?.fields || {}) as Record<string, FieldConfig>
})

// 🔧 Estado local sincronizado con form.effects
const effectsText = computed({
  get() {
    const f = form as Record<string, unknown>
    const eff = (f.effects as Record<string, string[] | string | undefined>)?.[localeCode.value]
    return Array.isArray(eff) ? eff.join('\n') : (eff || '')
  },
  set(v: string) {
    const f = form as Record<string, unknown>
    if (!f.effects) f.effects = {}
    ;(f.effects as Record<string, unknown>)[localeCode.value] = v
      ? v.split(/\n+/).filter(line => line.trim() !== '')
      : []
  }
})

onMounted(() => {
  loadAll()
})

function getRelationOptions(relation?: string) {
  switch (relation) {
    case 'arcana':
      return arcanaOptions.value
    case 'card_type':
      return cardTypeOptions.value
    case 'facet':
      return facetOptions.value
    default:
      return []
  }
}

// Items for select fields: prefer relation options; otherwise enum/explicit options.
function selectItems(field: FieldConfig, key: string) {
  // If relation specified, use relation options
  if (field?.relation) return getRelationOptions(field.relation)

  // Handle explicit options from schema (ZodEnum) or preset
  const raw = field?.options
  const statusUtil = useCardStatus()

  // Special handling for status: map to localized labels
  if (key === 'status') {
    return statusUtil.options().map(o => ({ label: t(o.labelKey), value: o.value }))
  }

  if (Array.isArray(raw)) {
    // normalize ["a","b"] or [{label,value}]
    if (raw.length === 0) return []
    if (typeof raw[0] === 'string') {
      return (raw as string[]).map(v => ({ label: String(v), value: v }))
    }
    return raw as { label: string; value: unknown }[]
  }

  return []
}

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}

// i18n label helper: try fields.<key>, else fallback label/key
function trLabel(key: string, fallback?: string) {
  const entityKey = normalizedLabel.value
  const tryKeys = [
    entityKey ? `fields.${entityKey}.${key}` : '',
    `fields.${key}`,
  ]

  // Common fallbacks for frequent keys
  const commonMap: Record<string, string> = {
    status: 'ui.fields.status',
    is_active: 'ui.states.active',
    name: 'ui.fields.name',
    description: 'ui.fields.description',
    short_text: 'common.short_text',
    arcana_id: 'entities.arcana',
    facet_id: 'entities.facet',
    card_type_id: 'entities.card_type',
    image: 'common.image',
  }
  if (commonMap[key]) tryKeys.push(commonMap[key])

  for (const k of tryKeys) {
    if (!k) continue
    const translated = t(k) as unknown as string
    if (translated !== k) return translated
  }
  return fallback || key
}
</script>
