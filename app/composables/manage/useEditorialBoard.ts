// app/composables/manage/useEditorialBoard.ts
import { ref, computed, reactive } from 'vue'
import { useApiFetch } from '~/utils/fetcher'
import { useAuthRoles } from '~/composables/auth/useAuthRoles'
import { useUserStore } from '~/stores/user'
import { cardStatusTransitions } from '~~/shared/editorial/transitions'
import type { CardStatus } from '~~/shared/editorial/card-status'

export interface BoardEntity {
  id: number
  code: string
  name: string
  status: CardStatus
  entity_type: string
  image?: string | null
  version_semver?: string | null
  release_stage?: string | null
  world_id?: number | null
  world_name?: string | null
  translation_states?: { lang: string; status: string }[]
  editorial?: {
    status: string
    allowedTransitions: string[]
    publishReady: boolean
    blockingReasons: string[]
  } | null
  modified_at?: string | null
  created_at?: string | null
}

export type EntityTypeFilter = 'all' | 'base_card' | 'arcana' | 'facet' | 'world' | 'skill' | 'card_type'

const ENTITY_ENDPOINTS: { key: EntityTypeFilter; path: string; label: string }[] = [
  { key: 'base_card', path: '/base_card', label: 'Base Cards' },
  { key: 'arcana', path: '/arcana', label: 'Arcana' },
  { key: 'facet', path: '/facet', label: 'Facets' },
  { key: 'world', path: '/world', label: 'Worlds' },
  { key: 'skill', path: '/skill', label: 'Skills' },
  { key: 'card_type', path: '/card_type', label: 'Card Types' },
]

const BOARD_STATUSES: CardStatus[] = [
  'draft',
  'pending_review',
  'review',
  'translation_review',
  'changes_requested',
  'approved',
  'published',
  'rejected',
  'archived',
]

export function useEditorialBoard() {
  const { isAdmin } = useAuthRoles()
  const userStore = useUserStore()

  const entities = ref<BoardEntity[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const transitioning = reactive<Record<string, boolean>>({})

  const filters = reactive<{
    entityType: EntityTypeFilter
    worldId: number | null
  }>({
    entityType: 'all',
    worldId: null,
  })

  const filteredEntities = computed(() => {
    let result = entities.value
    if (filters.entityType !== 'all') {
      result = result.filter(e => e.entity_type === filters.entityType)
    }
    if (filters.worldId != null) {
      result = result.filter(e => e.world_id === filters.worldId)
    }
    return result
  })

  const columns = computed(() => {
    return BOARD_STATUSES.map(status => ({
      status,
      items: filteredEntities.value.filter(e => e.status === status),
    }))
  })

  const worldOptions = computed(() => {
    const map = new Map<number, string>()
    for (const e of entities.value) {
      if (e.world_id && e.world_name) {
        map.set(e.world_id, e.world_name)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ label: name, value: id }))
  })

  function resolveApiPath(entityType: string): string | null {
    const ep = ENTITY_ENDPOINTS.find(e => e.key === entityType)
    return ep ? ep.path : null
  }

  function getAllowedTargets(from: CardStatus): CardStatus[] {
    const forward = cardStatusTransitions[from] ?? []
    if (isAdmin.value) {
      const backward: CardStatus[] = []
      for (const [source, targets] of Object.entries(cardStatusTransitions)) {
        if (targets.includes(from) && source !== from && !forward.includes(source as CardStatus)) {
          backward.push(source as CardStatus)
        }
      }
      return [...forward, ...backward]
    }
    return [...forward]
  }

  function canDrop(entity: BoardEntity, targetStatus: CardStatus): boolean {
    if (entity.status === targetStatus) return false
    const allowed = getAllowedTargets(entity.status)
    return allowed.includes(targetStatus)
  }

  async function fetchAll() {
    loading.value = true
    error.value = null
    const allItems: BoardEntity[] = []

    try {
      const promises = ENTITY_ENDPOINTS.map(async (ep) => {
        try {
          const res = await useApiFetch(ep.path, {
            method: 'GET',
            params: { pageSize: 200, lang: 'en' },
          })
          const items = (res as Record<string, unknown>)?.data
          if (Array.isArray(items)) {
            for (const item of items) {
              const raw = item as Record<string, unknown>
              allItems.push({
                id: Number(raw.id),
                code: String(raw.code ?? ''),
                name: String(raw.name ?? raw.code ?? ''),
                status: (raw.status as CardStatus) ?? 'draft',
                entity_type: ep.key,
                image: typeof raw.image === 'string' ? raw.image : null,
                version_semver: typeof raw.version_semver === 'string' ? raw.version_semver : null,
                release_stage: typeof raw.release_stage === 'string' ? raw.release_stage : null,
                world_id: typeof raw.world_id === 'number' ? raw.world_id : null,
                world_name: typeof raw.world_name === 'string' ? raw.world_name : null,
                translation_states: Array.isArray(raw.translation_states) ? raw.translation_states as BoardEntity['translation_states'] : [],
                editorial: raw.editorial && typeof raw.editorial === 'object'
                  ? raw.editorial as BoardEntity['editorial']
                  : null,
                modified_at: typeof raw.modified_at === 'string' ? raw.modified_at : null,
                created_at: typeof raw.created_at === 'string' ? raw.created_at : null,
              })
            }
          }
        } catch {
          // Skip failed endpoints silently
        }
      })

      await Promise.all(promises)
      entities.value = allItems
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load board data'
    } finally {
      loading.value = false
    }
  }

  async function moveEntity(entity: BoardEntity, targetStatus: CardStatus): Promise<boolean> {
    const key = `${entity.entity_type}:${entity.id}`
    if (transitioning[key]) return false

    if (!canDrop(entity, targetStatus)) return false

    const apiPath = resolveApiPath(entity.entity_type)
    if (!apiPath) return false

    const previousStatus = entity.status
    transitioning[key] = true

    // Optimistic update
    const idx = entities.value.findIndex(e => e.id === entity.id && e.entity_type === entity.entity_type)
    if (idx !== -1) {
      const current = entities.value[idx]
      entities.value[idx] = Object.assign({}, current, { status: targetStatus }) as BoardEntity
      entities.value = [...entities.value]
    }

    try {
      await useApiFetch(`${apiPath}/${entity.id}`, {
        method: 'PATCH',
        body: { status: targetStatus, lang: 'en' },
      })
      return true
    } catch {
      // Rollback optimistic update
      if (idx !== -1) {
        const current = entities.value[idx]
        entities.value[idx] = Object.assign({}, current, { status: previousStatus }) as BoardEntity
        entities.value = [...entities.value]
      }
      return false
    } finally {
      transitioning[key] = false
    }
  }

  return {
    entities,
    columns,
    loading,
    error,
    filters,
    filteredEntities,
    worldOptions,
    transitioning,
    boardStatuses: BOARD_STATUSES,
    entityEndpoints: ENTITY_ENDPOINTS,
    isAdmin,
    userPermissions: computed(() => userStore.user?.permissions ?? {}),
    fetchAll,
    moveEntity,
    canDrop,
    getAllowedTargets,
  }
}
