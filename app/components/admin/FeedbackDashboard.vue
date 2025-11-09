<!-- app/components/admin/FeedbackDashboard.vue -->
<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <UCard>
        <template #header>{{ $t('features.admin.feedbackDashboard.total','Total feedbacks') }}</template>
        <div class="text-2xl font-semibold">{{ totals.total }}</div>
      </UCard>
      <UCard>
        <template #header>{{ $t('features.admin.feedbackDashboard.open','Open') }}</template>
        <div class="text-2xl font-semibold">{{ totals.open }}</div>
      </UCard>
      <UCard>
        <template #header>{{ $t('features.admin.feedbackDashboard.resolved','Resolved') }}</template>
        <div class="text-2xl font-semibold">{{ totals.resolved }}</div>
      </UCard>
      <UCard>
        <template #header>{{ $t('features.admin.feedbackDashboard.byType','By type') }}</template>
        <div class="text-sm space-y-1">
          <div class="flex justify-between"><span>bug</span><span>{{ totalsByType.bug }}</span></div>
          <div class="flex justify-between"><span>suggestion</span><span>{{ totalsByType.suggestion }}</span></div>
          <div class="flex justify-between"><span>balance</span><span>{{ totalsByType.balance }}</span></div>
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>{{ $t('features.admin.feedbackDashboard.weekly','Weekly activity (last 30 days)') }}</template>
      <div class="flex items-end gap-1 h-24">
        <div v-for="b in weeklyBuckets" :key="b.label" class="flex-1">
          <div class="bg-primary-500 dark:bg-primary-400" :style="{height: barHeight(b.count)}" title="{{ b.label }}: {{ b.count }}" />
        </div>
      </div>
      <div class="mt-1 text-xs text-gray-500 flex justify-between">
        <span>{{ weeklyBuckets[0]?.label || '' }}</span>
        <span>{{ weeklyBuckets[weeklyBuckets.length-1]?.label || '' }}</span>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useContentFeedback } from '@/composables/admin/useContentFeedback'
import { useApiFetch } from '@/utils/fetcher'

const props = defineProps<{ query?: { type?: string | null; status?: string | null } }>()

const totals = reactive({ total: 0, open: 0, resolved: 0 })
const totalsByType = reactive({ bug: 0, suggestion: 0, balance: 0 })
const weeklyBuckets = ref<{ label: string; count: number }[]>([])

const { fetchMeta } = useContentFeedback()
const apiFetch = useApiFetch

async function fetchCount(q: Record<string, any>) {
  try {
    const meta = await fetchMeta({ ...q, page: 1, pageSize: 1 })
    if (meta?.totalItems != null) return Number(meta.totalItems)
  } catch {}
  return 0
}

async function loadTotals() {
  const base: Record<string, any> = {}
  if (props.query?.type && props.query.type !== 'all') base.category = props.query.type
  totals.total = await fetchCount(base)
  totals.open = await fetchCount({ ...base, status: 'open' })
  totals.resolved = await fetchCount({ ...base, status: 'resolved' })
  totalsByType.bug = await fetchCount({ category: 'bug' })
  totalsByType.suggestion = await fetchCount({ category: 'suggestion' })
  totalsByType.balance = await fetchCount({ category: 'balance' })
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function format(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

async function loadWeekly() {
  const now = new Date()
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const dates: Date[] = []
  for (let i = 0; i < 30; i++) dates.push(new Date(since.getTime() + i * 24 * 60 * 60 * 1000))
  const map = new Map<string, number>()
  for (const d of dates) map.set(format(d), 0)

  for (let page = 1; page <= 5; page++) {
    const response = await apiFetch<{ data?: any[] } | any[]>('/content_feedback', {
      method: 'GET',
      params: { page, pageSize: 50 },
    })
    const data = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : []
    for (const it of data) {
      const created = new Date((it as any).created_at || (it as any).createdAt)
      if (created >= since) {
        const key = format(startOfDay(created))
        map.set(key, (map.get(key) || 0) + 1)
      }
    }
    if (data.length < 50) break
  }

  weeklyBuckets.value = Array.from(map.entries()).map(([label, count]) => ({ label, count }))
}

function barHeight(count: number) {
  const max = Math.max(1, ...weeklyBuckets.value.map(b => b.count))
  const pct = Math.round((count / max) * 100)
  return `${pct}%`
}

onMounted(async () => {
  await Promise.all([loadTotals(), loadWeekly()])
})

watch(() => [props.query?.type, props.query?.status], () => { loadTotals() })
</script>
