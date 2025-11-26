// app/composables/manage/useFeedback.ts
import { computed, ref } from 'vue'
import { useI18n, useToast } from '#imports'
import type { AnyManageCrud } from '@/types/manage'
import { useApiFetch } from '@/utils/fetcher'

export type FeedbackCategory = 'bug' | 'suggestion' | 'balance' | 'translation' | 'other'

export interface FeedbackPayload {
  type: FeedbackCategory
  comment: string
  attachment?: string | null
}

interface OpenPayload {
  entity: any
}

interface UseFeedbackOptions {
  entityKey: string
  entityLabel: string
  crud: AnyManageCrud
  toast?: ReturnType<typeof useToast> | null
}

const ENTITY_TYPE_MAP: Record<string, string> = {
  arcana: 'arcana',
  facet: 'facet',
  baseCard: 'base_card',
  base_card: 'base_card',
  cardType: 'base_card_type',
  baseCardType: 'base_card_type',
  base_card_type: 'base_card_type',
  world: 'world',
  worldCard: 'world_card',
  world_card: 'world_card',
  skill: 'base_skills',
  baseSkill: 'base_skills',
  base_skills: 'base_skills',
}

function resolveEntityType(entityKey: string, entity: any): string | null {
  if (ENTITY_TYPE_MAP[entityKey]) return ENTITY_TYPE_MAP[entityKey]
  const raw = String(entity?.entity_type ?? '')
  if (raw && ENTITY_TYPE_MAP[raw]) return ENTITY_TYPE_MAP[raw]
  return null
}

function resolveEntityName(entity: any): string | null {
  if (!entity || typeof entity !== 'object') return null
  const candidates = [
    (entity as any).name,
    (entity as any).title,
    (entity as any).translation?.name,
    (entity as any).code,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length) return candidate
  }
  if (entity.id !== undefined && entity.id !== null) return `#${entity.id}`
  return null
}

export function useFeedback(options: UseFeedbackOptions) {
  const toast = options.toast ?? useToast?.() ?? null
  const { t } = useI18n()
  const apiFetch = useApiFetch

  const modalOpen = ref(false)
  const saving = ref(false)
  const currentEntity = ref<any>(null)
  const entityType = ref<string | null>(null)
  const error = ref<string | null>(null)

  const entityId = computed(() => currentEntity.value?.id ?? null)
  const entityName = computed(() => resolveEntityName(currentEntity.value))
  const entityTypeComputed = computed(() => entityType.value)

  function close() {
    modalOpen.value = false
    currentEntity.value = null
    entityType.value = null
  }

  function open(payload: OpenPayload) {
    const entity = payload?.entity
    const resolvedType = resolveEntityType(options.entityKey, entity)
    if (!resolvedType || !entity?.id) {
      toast?.add?.({
        title: options.entityLabel,
        description: t('errors.unsupportedFeedback') || 'Feedback not available for this entity',
        color: 'error',
      })
      return
    }

    currentEntity.value = entity
    entityType.value = resolvedType
    error.value = null
    modalOpen.value = true
  }

  async function submit(payload: FeedbackPayload) {
    if (!modalOpen.value || !currentEntity.value || !entityType.value || saving.value) return

    const commentBase = payload.comment?.trim() ?? ''
    if (!commentBase) return

    saving.value = true
    error.value = null

    try {
      let comment = commentBase
      const attachment = payload.attachment?.trim()
      if (attachment) {
        comment += `\n\nAttachment: ${attachment}`
      }

      const body: Record<string, unknown> = {
        entity_type: entityType.value,
        entity_id: currentEntity.value.id,
        comment,
        category: payload.type,
        status: 'open',
      }

      const lang = currentEntity.value?.language_code_resolved ?? currentEntity.value?.language_code
      if (typeof lang === 'string' && lang.length) body.language_code = lang
      const version = currentEntity.value?.version_number ?? currentEntity.value?.revision
      if (Number.isFinite(version)) body.version_number = Number(version)

      await apiFetch('/content_feedback', {
        method: 'POST',
        body,
      })

      toast?.add?.({ title: options.entityLabel, description: t('common.saved') || 'Saved', color: 'success' })
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

  return {
    modalOpen,
    saving,
    entityId,
    entityName,
    entityType: entityTypeComputed,
    error,
    open,
    close,
    submit,
  }
}
