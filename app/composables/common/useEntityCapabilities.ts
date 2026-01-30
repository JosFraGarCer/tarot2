// app/composables/common/useEntityCapabilities.ts
import { computed, inject, provide, toValue, type ComputedRef, type InjectionKey, type MaybeRefOrGetter } from 'vue'

export interface EntityCapabilities {
  translatable?: boolean
  hasTags?: boolean
  hasPreview?: boolean
  hasRevisions?: boolean
  hasStatus?: boolean
  hasReleaseStage?: boolean
  hasLanguage?: boolean
  actionsBatch?: boolean
  [key: string]: boolean | undefined
}

export interface UseEntityCapabilitiesOptions {
  kind?: MaybeRefOrGetter<string | null | undefined>
  overrides?: MaybeRefOrGetter<Partial<EntityCapabilities> | null | undefined>
}

const DEFAULT_CAPABILITIES: Required<EntityCapabilities> = {
  translatable: true,
  hasTags: true,
  hasPreview: true,
  hasRevisions: false,
  hasStatus: true,
  hasReleaseStage: false,
  hasLanguage: true,
  actionsBatch: false,
}

const ENTITY_CAPABILITIES_MAP: Record<string, Partial<EntityCapabilities>> = {
  arcana: {
    translatable: true,
    hasTags: true,
    hasPreview: true,
    hasRevisions: true,
    hasStatus: true,
    hasReleaseStage: true,
    actionsBatch: true,
  },
  base_card: {
    translatable: true,
    hasTags: true,
    hasPreview: true,
    hasRevisions: true,
    hasStatus: true,
    hasReleaseStage: true,
    actionsBatch: true,
  },
  card_type: {
    translatable: true,
    hasTags: false,
    hasPreview: true,
    hasRevisions: false,
    hasStatus: true,
    hasReleaseStage: false,
  },
  world: {
    translatable: true,
    hasTags: true,
    hasPreview: true,
    hasRevisions: false,
    hasStatus: true,
    hasReleaseStage: false,
  },
  content_version: {
    translatable: false,
    hasTags: false,
    hasPreview: false,
    hasRevisions: true,
    hasStatus: true,
    hasReleaseStage: true,
    actionsBatch: true,
    hasLanguage: false,
  },
  content_revision: {
    translatable: false,
    hasTags: false,
    hasPreview: false,
    hasRevisions: true,
    hasStatus: true,
    hasReleaseStage: false,
  },
  feedback: {
    translatable: false,
    hasTags: true,
    hasPreview: true,
    hasRevisions: false,
    hasStatus: true,
    hasReleaseStage: false,
    actionsBatch: true,
  },
  users: {
    translatable: false,
    hasTags: false,
    hasPreview: false,
    hasRevisions: false,
    hasStatus: true,
    hasReleaseStage: false,
    hasLanguage: false,
    actionsBatch: true,
  },
  deck: {
    translatable: true,
    hasTags: true,
    hasPreview: true,
    hasRevisions: true,
    hasStatus: true,
    hasReleaseStage: true,
  },
}

const EntityCapabilitiesOverridesKey: InjectionKey<MaybeRefOrGetter<Partial<EntityCapabilities> | null | undefined>> = Symbol('entity:capabilities:overrides')

export const EntityCapabilitiesKey: InjectionKey<MaybeRefOrGetter<Partial<EntityCapabilities> | null | undefined>> = Symbol('entity:capabilities')

function resolveBaseCapabilities(kind: string | null | undefined): EntityCapabilities {
  if (!kind) return { ...DEFAULT_CAPABILITIES }
  const mapEntry = ENTITY_CAPABILITIES_MAP[kind] || ENTITY_CAPABILITIES_MAP[kind.toLowerCase?.() ?? '']
  return { ...DEFAULT_CAPABILITIES, ...(mapEntry ?? {}) }
}

export function provideEntityCapabilities(overrides: MaybeRefOrGetter<Partial<EntityCapabilities> | null | undefined>) {
  provide(EntityCapabilitiesKey, overrides)
}

export function provideEntityCapabilitiesDefaults(overrides: MaybeRefOrGetter<Partial<EntityCapabilities> | null | undefined>) {
  provide(EntityCapabilitiesOverridesKey, overrides)
}

export function useEntityCapabilities(
  kindOrOptions?: MaybeRefOrGetter<string | null | undefined> | UseEntityCapabilitiesOptions,
): ComputedRef<EntityCapabilities> {
  const resolvedOptions: UseEntityCapabilitiesOptions =
    typeof kindOrOptions === 'object' && kindOrOptions !== null && !('value' in kindOrOptions && typeof kindOrOptions.value === 'string')
      ? kindOrOptions as UseEntityCapabilitiesOptions
      : { kind: kindOrOptions as MaybeRefOrGetter<string | null | undefined> }

  const injectedOverrides = inject(EntityCapabilitiesKey, null)
  const injectedDefaults = inject(EntityCapabilitiesOverridesKey, null)

  return computed(() => {
    const kind = toValue(resolvedOptions.kind) ?? null
    const base = resolveBaseCapabilities(kind)
    const defaultOverrides = injectedDefaults ? (toValue(injectedDefaults) ?? {}) : {}
    const providedOverrides = injectedOverrides ? (toValue(injectedOverrides) ?? {}) : {}
    const localOverrides = resolvedOptions.overrides ? (toValue(resolvedOptions.overrides) ?? {}) : {}

    return {
      ...base,
      ...defaultOverrides,
      ...providedOverrides,
      ...localOverrides,
    }
  })
}

export function resolveEntityCapabilities(kind?: string | null, overrides?: Partial<EntityCapabilities> | null | undefined) {
  const base = resolveBaseCapabilities(kind ?? null)
  return {
    ...base,
    ...(overrides ?? {}),
  }
}
