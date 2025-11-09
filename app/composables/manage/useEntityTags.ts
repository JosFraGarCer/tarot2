import { computed, ref } from 'vue'
import { useI18n, useToast } from '#imports'
import type { AnyManageCrud } from '@/types/manage'
import { useApiFetch } from '@/utils/fetcher'

interface TagOption {
  label: string
  value: number
}

type TagLinkEntityType =
  | 'arcana'
  | 'facet'
  | 'base_card'
  | 'base_card_type'
  | 'world'
  | 'world_card'
  | 'base_skills'

interface UseEntityTagsOptions {
  entityKey: string
  entityLabel: string
  crud: AnyManageCrud
  toast?: ReturnType<typeof useToast> | null
}

interface OpenPayload {
  entity: any
}

const ENTITY_TYPE_MAP: Record<string, TagLinkEntityType> = {
  arcana: 'arcana',
  facet: 'facet',
  baseCard: 'base_card',
  base_card: 'base_card',
  baseCardType: 'base_card_type',
  cardType: 'base_card_type',
  base_card_type: 'base_card_type',
  world: 'world',
  worldCard: 'world_card',
  world_card: 'world_card',
  skill: 'base_skills',
  baseSkill: 'base_skills',
  base_skills: 'base_skills',
}

const TAG_LINK_ENTITY_TYPES: Set<string> = new Set(Object.values(ENTITY_TYPE_MAP))

function normalizeId(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

function extractTagIds(entity: any): number[] {
  if (!entity) return []
  const tags = Array.isArray(entity.tags) ? entity.tags : []
  const ids = tags
    .map((tag: any) => normalizeId(tag?.id ?? tag?.tag_id))
    .filter((val): val is number => Number.isFinite(val ?? NaN))
  return Array.from(new Set(ids))
}

function resolveEntityType(entityKey: string, entity: any): TagLinkEntityType | null {
  const direct = ENTITY_TYPE_MAP[entityKey]
  if (direct) return direct
  const raw = String(entity?.entity_type ?? '')
  if (raw && TAG_LINK_ENTITY_TYPES.has(raw)) {
    return raw as TagLinkEntityType
  }
  return null
}

function unwrapTagRows(raw: any): any[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.items)) return raw.items
  if (Array.isArray(raw.data)) return raw.data
  if (Array.isArray(raw.results)) return raw.results
  return []
}

export function useEntityTags(options: UseEntityTagsOptions) {
  const toast = options.toast ?? useToast?.() ?? null
  const { locale, t } = useI18n()
  const apiFetch = useApiFetch

  const modalOpen = ref(false)
  const selection = ref<number[]>([])
  const originalSelection = ref<number[]>([])
  const currentEntity = ref<any>(null)
  const entityType = ref<TagLinkEntityType | null>(null)
  const tagOptions = ref<TagOption[]>([])
  const optionsLoaded = ref(false)
  const optionsLoading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  function setSelection(values: number[]) {
    const unique = Array.from(new Set((values ?? []).map((value) => Number(value)).filter((val) => Number.isFinite(val))))
    selection.value = unique
  }

  async function loadTagOptions() {
    if (optionsLoaded.value || optionsLoading.value) return
    optionsLoading.value = true
    try {
      const response = await apiFetch('/tag', {
        method: 'GET',
        params: {
          pageSize: 100,
          is_active: true,
          lang: typeof locale === 'string' ? locale : locale.value,
        },
      })
      const rows = unwrapTagRows(response)
      tagOptions.value = rows
        .map((item: any) => {
          const id = normalizeId(item?.id)
          if (!id) return null
          return {
            value: id,
            label: item?.name ?? item?.code ?? `#${id}`,
          }
        })
        .filter((item): item is TagOption => !!item)
      optionsLoaded.value = true
    } catch (err: any) {
      error.value = err?.data?.message ?? err?.message ?? String(err)
      toast?.add?.({
        title: options.entityLabel,
        description: error.value,
        color: 'error',
      })
    } finally {
      optionsLoading.value = false
    }
  }

  async function open(payload: OpenPayload) {
    const entity = payload?.entity
    const resolvedType = resolveEntityType(options.entityKey, entity)
    if (!resolvedType) {
      toast?.add?.({
        title: options.entityLabel,
        description: t('errors.unsupportedEntityTags') || 'Tags are not supported for this entity',
        color: 'error',
      })
      return
    }

    currentEntity.value = entity
    entityType.value = resolvedType
    originalSelection.value = extractTagIds(entity)
    selection.value = [...originalSelection.value]
    error.value = null
    modalOpen.value = true
    await loadTagOptions()
  }

  function close() {
    modalOpen.value = false
    selection.value = [...originalSelection.value]
    currentEntity.value = null
    entityType.value = null
    error.value = null
  }

  async function confirm() {
    if (!currentEntity.value || !entityType.value) {
      close()
      return
    }

    const entityId = normalizeId(currentEntity.value.id ?? currentEntity.value.entity_id)
    if (!entityId) {
      error.value = t('errors.update_failed') || 'Update failed'
      toast?.add?.({
        title: options.entityLabel,
        description: error.value,
        color: 'error',
      })
      return
    }

    const nextSelection = Array.from(new Set(selection.value))
    const toAttach = nextSelection.filter((id) => !originalSelection.value.includes(id))
    const toDetach = originalSelection.value.filter((id) => !nextSelection.includes(id))

    if (!toAttach.length && !toDetach.length) {
      close()
      return
    }

    saving.value = true
    error.value = null

    try {
      if (toAttach.length) {
        await apiFetch('/tag_links', {
          method: 'POST',
          body: {
            entity_type: entityType.value,
            entity_ids: [entityId],
            tag_ids: toAttach,
          },
        })
      }

      if (toDetach.length) {
        await apiFetch('/tag_links', {
          method: 'DELETE',
          body: {
            entity_type: entityType.value,
            entity_ids: [entityId],
            tag_ids: toDetach,
          },
        })
      }

      originalSelection.value = [...nextSelection]
      toast?.add?.({
        title: options.entityLabel,
        description: t('common.saved') || 'Saved',
        color: 'success',
      })
      await options.crud.fetchList?.()
      close()
    } catch (err: any) {
      error.value = err?.data?.message ?? err?.message ?? String(err)
      toast?.add?.({
        title: options.entityLabel,
        description: error.value,
        color: 'error',
      })
    } finally {
      saving.value = false
    }
  }

  const isBusy = computed(() => saving.value || optionsLoading.value)

  return {
    modalOpen,
    selection,
    tagOptions,
    saving: isBusy,
    error,
    open,
    close,
    setSelection,
    confirm,
  }
}
