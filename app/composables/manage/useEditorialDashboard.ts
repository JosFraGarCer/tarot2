// app/composables/manage/useEditorialDashboard.ts
// Single list call per entity type → client-side grouping by editorial_state.status
import { ref, computed, reactive } from 'vue'
import { useApiFetch } from '~/utils/fetcher'

export interface DashboardEntity {
  id: number
  code: string
  name: string
  status: string
  entity_type: string
  image?: string | null
  world_id?: number | null
  world_name?: string | null
  version_semver?: string | null
  release_stage?: string | null
  modified_at?: string | null
  created_at?: string | null
  editorial_state?: {
    status: string
    is_active: boolean
    modified_at: string
  } | null
}

export type DashboardStatus = 'draft' | 'review' | 'changes_requested' | 'approved' | 'published'

const DASHBOARD_STATUSES: DashboardStatus[] = [
  'draft',
  'review',
  'changes_requested',
  'approved',
  'published',
]

const ENTITY_ENDPOINTS: { key: string; path: string; label: string }[] = [
  { key: 'base_card', path: '/base_card', label: 'Base Cards' },
  { key: 'arcana', path: '/arcana', label: 'Arcana' },
  { key: 'facet', path: '/facet', label: 'Facets' },
  { key: 'world', path: '/world', label: 'Worlds' },
  { key: 'skill', path: '/skill', label: 'Skills' },
  { key: 'card_type', path: '/card_type', label: 'Card Types' },
]

function resolveEditorialStatus(entity: DashboardEntity): string {
  return entity.editorial_state?.status ?? entity.status ?? 'draft'
}

function sortByModified(a: DashboardEntity, b: DashboardEntity): number {
  const dateA = a.modified_at ?? a.created_at ?? ''
  const dateB = b.modified_at ?? b.created_at ?? ''
  return dateB.localeCompare(dateA)
}

export function useEditorialDashboard() {
  const allEntities = ref<DashboardEntity[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const filters = reactive<{ worldId: number | null }>({
    worldId: null,
  })

  const filtered = computed(() => {
    let result = allEntities.value
    if (filters.worldId != null) {
      result = result.filter(e => e.world_id === filters.worldId)
    }
    return result
  })

  const grouped = computed(() => {
    const map: Record<DashboardStatus, DashboardEntity[]> = {
      draft: [],
      review: [],
      changes_requested: [],
      approved: [],
      published: [],
    }
    for (const entity of filtered.value) {
      const s = resolveEditorialStatus(entity)
      if (s === 'pending_review' || s === 'review' || s === 'translation_review') {
        map.review.push(entity)
      } else if (s in map) {
        map[s as DashboardStatus].push(entity)
      }
    }
    for (const key of DASHBOARD_STATUSES) {
      map[key].sort(sortByModified)
    }
    return map
  })

  const worldOptions = computed(() => {
    const seen = new Map<number, string>()
    for (const e of allEntities.value) {
      if (e.world_id != null && e.world_name) {
        seen.set(e.world_id, e.world_name)
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ label: name, value: id }))
  })

  async function refresh() {
    loading.value = true
    error.value = null
    const results: DashboardEntity[] = []

    try {
      const promises = ENTITY_ENDPOINTS.map(async (ep) => {
        try {
          const res = await useApiFetch(ep.path, {
            method: 'GET',
            params: {
              pageSize: 200,
              sort: 'modified_at',
              direction: 'desc',
              lang: 'en',
            },
          })
          const items = (res as Record<string, unknown>)?.data
          if (Array.isArray(items)) {
            for (const raw of items) {
              const row = raw as Record<string, unknown>
              results.push({
                id: Number(row.id),
                code: String(row.code ?? ''),
                name: String(row.name ?? row.code ?? ''),
                status: String(row.status ?? 'draft'),
                entity_type: ep.key,
                image: typeof row.image === 'string' ? row.image : null,
                world_id: typeof row.world_id === 'number' ? row.world_id : null,
                world_name: typeof row.world_name === 'string' ? row.world_name : null,
                version_semver: typeof row.version_semver === 'string' ? row.version_semver : null,
                release_stage: typeof row.release_stage === 'string' ? row.release_stage : null,
                modified_at: typeof row.modified_at === 'string' ? row.modified_at : null,
                created_at: typeof row.created_at === 'string' ? row.created_at : null,
                editorial_state: row.editorial_state && typeof row.editorial_state === 'object'
                  ? row.editorial_state as DashboardEntity['editorial_state']
                  : null,
              })
            }
          }
        } catch {
          // Skip failed endpoints
        }
      })

      await Promise.all(promises)
      allEntities.value = results
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load dashboard data'
    } finally {
      loading.value = false
    }
  }

  return {
    allEntities,
    loading,
    error,
    filters,
    filtered,
    grouped,
    worldOptions,
    dashboardStatuses: DASHBOARD_STATUSES,
    entityEndpoints: ENTITY_ENDPOINTS,
    refresh,
  }
}
