<!-- app/components/admin/FeedbackDashboard.vue -->
<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <UCard>
        <template #header>{{ $t('admin.feedbackDashboard.total','Total feedbacks') }}</template>
        <div class="text-2xl font-semibold">{{ totals.total }}</div>
      </UCard>
      <UCard>
        <template #header>{{ $t('admin.feedbackDashboard.open','Open') }}</template>
        <div class="text-2xl font-semibold">{{ totals.open }}</div>
      </UCard>
      <UCard>
        <template #header>{{ $t('admin.feedbackDashboard.resolved','Resolved') }}</template>
        <div class="text-2xl font-semibold">{{ totals.resolved }}</div>
      </UCard>
      <UCard>
        <template #header>{{ $t('admin.feedbackDashboard.byType','By type') }}</template>
        <div class="text-sm space-y-1">
          <div class="flex justify-between"><span>bug</span><span>{{ totalsByType.bug }}</span></div>
          <div class="flex justify-between"><span>suggestion</span><span>{{ totalsByType.suggestion }}</span></div>
          <div class="flex justify-between"><span>balance</span><span>{{ totalsByType.balance }}</span></div>
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>{{ $t('admin.feedbackDashboard.weekly','Weekly activity (last 30 days)') }}</template>
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
const props = defineProps<{ query?: { type?: string | null; status?: string | null } }>()

const totals = reactive({ total: 0, open: 0, resolved: 0 })
const totalsByType = reactive({ bug: 0, suggestion: 0, balance: 0 })

async function fetchCount(q: Record<string, any>) {
  const res = await $fetch<any>('/api/content_feedback', { method: 'GET', query: q })
  if (res?.meta?.totalItems != null) return Number(res.meta.totalItems)
  if (Array.isArray(res)) return res.length
  return 0
}

async function loadTotals() {
  const base: any = {}
  if (props.query?.type && props.query.type !== 'all') base.type = props.query.type
  totals.total = await fetchCount(base)
  totals.open = await fetchCount({ ...base, status: 'open' })
  totals.resolved = await fetchCount({ ...base, status: 'resolved' })
  totalsByType.bug = await fetchCount({ status: 'open', type: 'bug' }) + await fetchCount({ status: 'resolved', type: 'bug' })
  totalsByType.suggestion = await fetchCount({ status: 'open', type: 'suggestion' }) + await fetchCount({ status: 'resolved', type: 'suggestion' })
  totalsByType.balance = await fetchCount({ status: 'open', type: 'balance' }) + await fetchCount({ status: 'resolved', type: 'balance' })
}

const weeklyBuckets = ref<{ label: string; count: number }[]>([])

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function format(d: Date) { return `${d.getMonth()+1}/${d.getDate()}` }

async function loadWeekly() {
  // Pull last 30 days (paginated aggregations are not available, we sample pages until enough or rely on meta to hint)
  // For simplicity, we load first N pages to cover recent entries
  const now = new Date()
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const dates: Date[] = []
  for (let i=0;i<30;i++) dates.push(new Date(since.getTime() + i*24*60*60*1000))
  const map = new Map<string, number>()
  for (const d of dates) map.set(format(d), 0)

  // Fetch first 5 pages (max 250 items) to get recent activity
  for (let page=1; page<=5; page++) {
    const res = await $fetch<any>('/api/content_feedback', { method: 'GET', query: { page, pageSize: 50 } })
    const arr = Array.isArray(res) ? res : (res?.data || [])
    for (const it of arr) {
      const created = new Date(it.created_at || it.createdAt)
      if (created >= since) {
        const key = format(startOfDay(created))
        map.set(key, (map.get(key) || 0) + 1)
      }
    }
    if ((res?.data?.length || 0) < 50) break
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
