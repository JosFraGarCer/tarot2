// app/composables/manage/useEditorialDashboard.ts
import { ref, computed } from 'vue'
import { useApiFetch } from '~/utils/fetcher'
import { useCurrentUser } from '~/composables/users/useCurrentUser'

interface DashboardEntity {
  id: number
  code: string
  name?: string
  status: string
  entity_type: string
  modified_at?: string
  created_at?: string
  editorial?: {
    status: string
    allowedTransitions: string[]
    publishReady: boolean
    blockingReasons: string[]
  }
}

interface FeedbackItem {
  id: number
  entity_type: string
  entity_id: number
  entity_code?: string
  comment: string
  category?: string
  status: string
  created_at?: string
  created_by_name?: string
}

interface DashboardSection<T> {
  items: T[]
  loading: boolean
  error: string | null
  total: number
}

const ENTITY_ENDPOINTS = [
  { key: 'base_card', path: '/base_card' },
  { key: 'arcana', path: '/arcana' },
  { key: 'facet', path: '/facet' },
  { key: 'world', path: '/world' },
  { key: 'skill', path: '/skill' },
  { key: 'card_type', path: '/card_type' },
] as const

const DASHBOARD_PAGE_SIZE = 5

async function fetchEntitiesByStatus(
  statuses: string[],
  pageSize = DASHBOARD_PAGE_SIZE,
): Promise<DashboardEntity[]> {
  const results: DashboardEntity[] = []

  const promises = ENTITY_ENDPOINTS.map(async (ep) => {
    for (const status of statuses) {
      try {
        const res = await useApiFetch(`${ep.path}`, {
          method: 'GET',
          params: {
            status,
            pageSize,
            sort: 'modified_at',
            direction: 'desc',
          },
        })
        const items = (res as any)?.data ?? []
        if (Array.isArray(items)) {
          for (const item of items) {
            results.push({
              ...item,
              entity_type: ep.key,
            })
          }
        }
      } catch {
        // Silently skip failed endpoints
      }
    }
  })

  await Promise.all(promises)

  results.sort((a, b) => {
    const dateA = a.modified_at || a.created_at || ''
    const dateB = b.modified_at || b.created_at || ''
    return dateB.localeCompare(dateA)
  })

  return results.slice(0, pageSize * 2)
}

export function useEditorialDashboard() {
  const { currentUser } = useCurrentUser()

  const drafts = ref<DashboardSection<DashboardEntity>>({
    items: [],
    loading: false,
    error: null,
    total: 0,
  })

  const pendingReview = ref<DashboardSection<DashboardEntity>>({
    items: [],
    loading: false,
    error: null,
    total: 0,
  })

  const blocked = ref<DashboardSection<DashboardEntity>>({
    items: [],
    loading: false,
    error: null,
    total: 0,
  })

  const openFeedback = ref<DashboardSection<FeedbackItem>>({
    items: [],
    loading: false,
    error: null,
    total: 0,
  })

  const loading = computed(() =>
    drafts.value.loading || pendingReview.value.loading || blocked.value.loading || openFeedback.value.loading,
  )

  async function fetchDrafts() {
    drafts.value.loading = true
    drafts.value.error = null
    try {
      const items = await fetchEntitiesByStatus(['draft'], DASHBOARD_PAGE_SIZE)
      const userId = currentUser.value?.id
      const filtered = userId
        ? items.filter((e: any) => e.created_by === userId || e.updated_by === userId)
        : items
      drafts.value.items = filtered.slice(0, DASHBOARD_PAGE_SIZE)
      drafts.value.total = filtered.length
    } catch (e: any) {
      drafts.value.error = e?.message ?? 'Failed to load drafts'
    } finally {
      drafts.value.loading = false
    }
  }

  async function fetchPendingReview() {
    pendingReview.value.loading = true
    pendingReview.value.error = null
    try {
      const items = await fetchEntitiesByStatus(['pending_review', 'review'], DASHBOARD_PAGE_SIZE)
      pendingReview.value.items = items.slice(0, DASHBOARD_PAGE_SIZE)
      pendingReview.value.total = items.length
    } catch (e: any) {
      pendingReview.value.error = e?.message ?? 'Failed to load pending reviews'
    } finally {
      pendingReview.value.loading = false
    }
  }

  async function fetchBlocked() {
    blocked.value.loading = true
    blocked.value.error = null
    try {
      const allApproved = await fetchEntitiesByStatus(['approved'], DASHBOARD_PAGE_SIZE * 2)
      const blockedItems = allApproved.filter(
        (e) => e.editorial && e.editorial.publishReady === false,
      )
      blocked.value.items = blockedItems.slice(0, DASHBOARD_PAGE_SIZE)
      blocked.value.total = blockedItems.length
    } catch (e: any) {
      blocked.value.error = e?.message ?? 'Failed to load blocked content'
    } finally {
      blocked.value.loading = false
    }
  }

  async function fetchOpenFeedback() {
    openFeedback.value.loading = true
    openFeedback.value.error = null
    try {
      const res = await useApiFetch('/content_feedback', {
        method: 'GET',
        params: {
          status: 'open',
          pageSize: DASHBOARD_PAGE_SIZE,
          sort: 'created_at',
          direction: 'desc',
        },
      })
      const data = (res as any)?.data ?? []
      openFeedback.value.items = Array.isArray(data) ? data : []
      openFeedback.value.total = (res as any)?.meta?.totalItems ?? openFeedback.value.items.length
    } catch (e: any) {
      openFeedback.value.error = e?.message ?? 'Failed to load feedback'
    } finally {
      openFeedback.value.loading = false
    }
  }

  async function refresh() {
    await Promise.all([
      fetchDrafts(),
      fetchPendingReview(),
      fetchBlocked(),
      fetchOpenFeedback(),
    ])
  }

  return {
    drafts,
    pendingReview,
    blocked,
    openFeedback,
    loading,
    refresh,
  }
}
