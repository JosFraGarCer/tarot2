import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { z } from 'zod'

import { useEntityCapabilities, type EntityCapabilities } from '~/composables/common/useEntityCapabilities'
import { arcanaCreateSchema, arcanaUpdateSchema } from '~/schemas/entities/arcana'
import { baseCardCreateSchema, baseCardUpdateSchema } from '~/schemas/entities/basecard'
import { cardTypeCreateSchema, cardTypeUpdateSchema } from '~/schemas/entities/cardtype'
import { facetCreateSchema, facetUpdateSchema } from '~/schemas/entities/facet'
import { skillCreateSchema, skillUpdateSchema } from '~/schemas/entities/skill'
import { tagCreateSchema, tagUpdateSchema } from '~/schemas/entities/tag'
import { worldCreateSchema, worldUpdateSchema } from '~/schemas/entities/world'

export type EntityFormFieldType = 'text' | 'textarea' | 'select' | 'toggle' | 'number' | 'image' | 'effects'

export interface EntityFormFieldOption {
  value: any
  label?: string
  labelKey?: string
}

export interface EntityFormField {
  label: string
  type?: EntityFormFieldType
  placeholder?: string
  required?: boolean
  hidden?: boolean
  disabled?: boolean
  relation?: string
  options?: EntityFormFieldOption[]
  rows?: number
  multiLang?: boolean
  helper?: string
}

export interface EntityFormPresetSchema {
  create?: z.ZodTypeAny
  update?: z.ZodTypeAny
}

export interface EntityFormPreset {
  schema: EntityFormPresetSchema | null
  fields: Record<string, EntityFormField>
  defaults: Record<string, any>
}

type EntityFormPresetBuilder = (capabilities: EntityCapabilities) => EntityFormPreset

type CorePresetConfig = {
  schema: EntityFormPresetSchema
  relation?: { key: string; relation: string; label: string; required?: boolean; options?: EntityFormFieldOption[] }
  supportsEffects?: boolean
  supportsImage?: boolean
  defaults?: Record<string, any>
  extraFields?: Record<string, EntityFormField>
}

const RELEASE_STAGE_OPTIONS: EntityFormFieldOption[] = [
  { value: 'dev', labelKey: 'ui.release.dev' },
  { value: 'alpha', labelKey: 'ui.release.alpha' },
  { value: 'beta', labelKey: 'ui.release.beta' },
  { value: 'candidate', labelKey: 'ui.release.candidate' },
  { value: 'release', labelKey: 'ui.release.release' },
  { value: 'revision', labelKey: 'ui.release.revision' },
]

function normalizeKind(rawKind: string | null | undefined): string {
  if (!rawKind) return 'entity'
  const normalized = rawKind
    .toString()
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()

  switch (normalized) {
    case 'cardtype':
      return 'card_type'
    case 'basecard':
      return 'base_card'
    case 'worldcard':
      return 'world_card'
    default:
      return normalized
  }
}

function cloneDefaultValue<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(item => cloneDefaultValue(item)) as unknown as T
  try {
    return structuredClone(value)
  } catch {
    const out: Record<string, any> = {}
    for (const key of Object.keys(value as Record<string, any>)) {
      out[key] = cloneDefaultValue((value as Record<string, any>)[key])
    }
    return out as T
  }
}

function pruneUndefinedDefaults(defaults: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(defaults)) {
    if (value !== undefined) {
      out[key] = cloneDefaultValue(value)
    }
  }
  return out
}

function buildCoreCardPreset(capabilities: EntityCapabilities, config: CorePresetConfig): EntityFormPreset {
  const supportsEffects = config.supportsEffects !== false
  const supportsImage = config.supportsImage !== false

  const fields: Record<string, EntityFormField> = {
    code: { label: 'fields.code', type: 'text', required: true },
    name: { label: 'fields.name', type: 'text', required: true, multiLang: capabilities.translatable !== false },
    short_text: { label: 'common.short_text', type: 'textarea', rows: 3, multiLang: capabilities.translatable !== false },
    description: { label: 'ui.fields.description', type: 'textarea', rows: 5, multiLang: capabilities.translatable !== false },
    status: { label: 'ui.fields.status', type: 'select', hidden: capabilities.hasStatus === false },
    is_active: { label: 'ui.states.active', type: 'toggle' },
  }

  if (supportsImage) {
    fields.image = { label: 'common.image', type: 'image' }
  }

  if (supportsEffects) {
    fields.legacy_effects = { label: 'common.legacy_effects', type: 'toggle', hidden: true }
    fields.effects = { label: 'common.effects', type: 'effects', multiLang: capabilities.translatable !== false }
  }

  fields.sort = { label: 'common.sort', type: 'number', hidden: true }
  fields.language_code = { label: 'common.language_code', type: 'text', hidden: true }

  if (capabilities.hasReleaseStage) {
    fields.release_stage = {
      label: 'ui.release.stage',
      type: 'select',
      options: RELEASE_STAGE_OPTIONS,
    }
  }

  if (capabilities.hasTags !== false) {
    fields.tag_ids = {
      label: 'entities.tags',
      type: 'select',
      hidden: capabilities.hasTags === false,
    }
  }

  if (config.relation) {
    fields[config.relation.key] = {
      label: config.relation.label,
      type: 'select',
      relation: config.relation.relation,
      required: config.relation.required !== false,
      options: config.relation.options,
    }
  }

  const defaults = pruneUndefinedDefaults({
    code: '',
    name: '',
    short_text: '',
    description: '',
    status: capabilities.hasStatus === false ? undefined : 'draft',
    is_active: true,
    image: supportsImage ? null : undefined,
    legacy_effects: supportsEffects ? false : undefined,
    effects: supportsEffects ? {} : undefined,
    release_stage: capabilities.hasReleaseStage ? 'dev' : undefined,
    language_code: undefined,
    tag_ids: capabilities.hasTags === false ? undefined : [],
    ...(config.relation ? { [config.relation.key]: null } : {}),
    ...(config.defaults ?? {}),
  })

  const extraFields = config.extraFields ?? {}
  for (const [key, value] of Object.entries(extraFields)) {
    fields[key] = value
  }

  return {
    schema: config.schema,
    fields,
    defaults,
  }
}

function buildTagPreset(capabilities: EntityCapabilities): EntityFormPreset {
  const multiLang = capabilities.translatable !== false

  const fields: Record<string, EntityFormField> = {
    code: { label: 'fields.code', type: 'text', required: true },
    category: { label: 'entities.tag.category', type: 'text', required: true },
    name: { label: 'fields.name', type: 'text', required: true, multiLang: multiLang },
    short_text: { label: 'common.short_text', type: 'textarea', rows: 3, multiLang: multiLang },
    description: { label: 'ui.fields.description', type: 'textarea', rows: 5, multiLang: multiLang },
    parent_id: { label: 'entities.tag.parent', type: 'select', hidden: true, relation: 'tag' },
    is_active: { label: 'ui.states.active', type: 'toggle' },
    sort: { label: 'common.sort', type: 'number', hidden: true },
  }

  const defaults = pruneUndefinedDefaults({
    code: '',
    category: '',
    name: '',
    short_text: '',
    description: '',
    parent_id: null,
    is_active: true,
    sort: null,
  })

  return {
    schema: {
      create: tagCreateSchema,
      update: tagUpdateSchema,
    },
    fields,
    defaults,
  }
}

function buildFallbackPreset(): EntityFormPreset {
  const fields: Record<string, EntityFormField> = {
    name: { label: 'fields.name', type: 'text', required: true },
    description: { label: 'ui.fields.description', type: 'textarea', rows: 4 },
  }

  const defaults = pruneUndefinedDefaults({
    name: '',
    description: '',
  })

  return {
    schema: null,
    fields,
    defaults,
  }
}

const PRESET_FACTORIES: Record<string, EntityFormPresetBuilder> = {
  arcana: (capabilities) => buildCoreCardPreset(capabilities, {
    schema: { create: arcanaCreateSchema, update: arcanaUpdateSchema },
    supportsEffects: true,
    supportsImage: true,
  }),
  base_card: (capabilities) => buildCoreCardPreset(capabilities, {
    schema: { create: baseCardCreateSchema, update: baseCardUpdateSchema },
    supportsEffects: true,
    supportsImage: true,
    relation: { key: 'card_type_id', relation: 'card_type', label: 'entities.card_type', required: true },
  }),
  card_type: (capabilities) => buildCoreCardPreset(capabilities, {
    schema: { create: cardTypeCreateSchema, update: cardTypeUpdateSchema },
    supportsEffects: false,
    supportsImage: false,
  }),
  facet: (capabilities) => buildCoreCardPreset(capabilities, {
    schema: { create: facetCreateSchema, update: facetUpdateSchema },
    supportsEffects: true,
    supportsImage: true,
    relation: { key: 'arcana_id', relation: 'arcana', label: 'entities.arcana', required: true },
  }),
  skill: (capabilities) => buildCoreCardPreset(capabilities, {
    schema: { create: skillCreateSchema, update: skillUpdateSchema },
    supportsEffects: true,
    supportsImage: true,
    relation: { key: 'facet_id', relation: 'facet', label: 'entities.facet', required: true },
  }),
  world: (capabilities) => buildCoreCardPreset(capabilities, {
    schema: { create: worldCreateSchema, update: worldUpdateSchema },
    supportsEffects: false,
    supportsImage: true,
  }),
  tag: (capabilities) => buildTagPreset(capabilities),
}

export function useEntityFormPreset(entityKind: MaybeRefOrGetter<string | null | undefined>) {
  const normalizedKind = computed(() => normalizeKind(toValue(entityKind)))
  const capabilities = useEntityCapabilities({ kind: normalizedKind })

  const preset = computed<EntityFormPreset>(() => {
    const builder = PRESET_FACTORIES[normalizedKind.value] ?? buildFallbackPreset
    const result = builder(capabilities.value)

    return {
      schema: result.schema,
      fields: result.fields,
      defaults: result.defaults,
    }
  })

  const schema = computed(() => preset.value.schema)
  const fields = computed(() => preset.value.fields)
  const defaults = computed(() => preset.value.defaults)

  return {
    kind: normalizedKind,
    capabilities,
    schema,
    fields,
    defaults,
  }
}
