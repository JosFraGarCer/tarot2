<!-- app/pages/admin/versions/index.vue -->
<template>
  <div class="px-4">
    <UCard>
      <template #header>
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ tt('admin.versionsTitle', 'Versions') }}</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ tt('admin.versionsSubtitle', 'Manage card versions and releases') }}</p>
          </div>
          <div class="flex gap-2">
            <UButton icon="i-heroicons-plus" color="primary" :label="tt('common.new', 'New')" @click="openCreate" />
            <UButton icon="i-heroicons-arrow-path" color="neutral" variant="soft" :label="tt('common.refresh', 'Refresh')" @click="reload" />
          </div>
        </div>
      </template>

      <div class="flex items-center gap-2 mb-3">
        <UInput v-model="search" :placeholder="tt('common.search', 'Search')" icon="i-heroicons-magnifying-glass" class="w-full sm:w-72" />
        <USelectMenu v-model="status" :items="statusOptions" value-key="value" option-attribute="label" class="w-40" />
      </div>

      <div v-if="error" class="mb-3">
        <UAlert color="error" :title="tt('common.error', 'Error')" :description="String(error)" />
      </div>

      <div v-if="pending" class="py-6">
        <USkeleton class="h-8 w-full mb-2" />
        <USkeleton class="h-8 w-full" />
      </div>
      <div v-else>
        <VersionList :versions="filtered" @view="onView" @edit="onEdit" @delete="onDelete" @meta="onMeta" />
      </div>

      <PaginationControls
        class="mt-4"
        :page="meta.page"
        :page-size="meta.pageSize"
        :total-items="meta.totalItems"
        :total-pages="meta.totalPages"
        :has-server-pagination="true"
        :page-size-items="pageSizeItems"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
      <div v-if="isEditor" class="mt-4 flex justify-end">
        <UButton color="primary" variant="soft" icon="i-heroicons-cloud-arrow-up" :label="tt('versions.publishApproved','Publish approved revisions')" @click="openPublish" />
      </div>

      <VersionModal v-model="modalOpen" :value="selected" @save="onSave" />
      <JsonModal v-model="metaOpen" :value="metaData" :title="tt('common.metadata', 'Metadata')" :description="tt('versions.viewMetadata', 'View metadata')" />
    </UCard>

    <UCard class="mt-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">{{ tt('revisions.title','Approved Revisions') }}</h2>
          <UButton v-if="isEditor" color="primary" variant="soft" icon="i-heroicons-cloud-arrow-up" :label="tt('versions.publishApproved','Publish approved revisions')" @click="openPublish" />
        </div>
      </template>
      <RevisionsTable />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import VersionList from '~/components/admin/VersionList.vue'
import PaginationControls from '~/components/common/PaginationControls.vue'
import VersionModal from '~/components/admin/VersionModal.vue'
import JsonModal from '~/components/admin/JsonModal.vue'
import RevisionsTable from '~/components/admin/RevisionsTable.vue'
import { useContentVersions } from '~/composables/admin/useContentVersions'
import { useDebounceFn } from '@vueuse/core'
import { useToast } from '#imports'
import { useCurrentUser } from '@/composables/users/useCurrentUser'

const { t, te } = useI18n()
const router = useRouter()
const localePath = useLocalePath()
function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}
useSeoMeta({ title: `${t('nav.admin') || 'Admin'} · ${tt('admin.versionsTitle', 'Versions')}` })

// State
const search = ref('')
const status = ref<'all' | 'draft' | 'published'>('all')
const statusOptions = [
  { label: tt('filters.all', 'All'), value: 'all' },
  { label: tt('status.draft', 'Draft'), value: 'draft' },
  { label: tt('status.published', 'Published'), value: 'published' }
]

// Data from API
const { items, pending, error, meta, fetchList, create, update, publish, remove } = useContentVersions()

const filtered = computed(() => {
  // server filters already applied; local search narrows further if desired
  const term = search.value.trim().toLowerCase()
  return (items.value || []).filter(v =>
    (!term || v.version_semver.toLowerCase().includes(term) || (v.description || '').toLowerCase().includes(term))
  )
})

// Modal state
const modalOpen = ref(false)
const selected = ref<any | null>(null)
const publishMode = ref(false)

// Pagination state and options
const page = computed(() => meta.value?.page ?? 1)
const pageSize = computed(() => meta.value?.pageSize ?? 20)
const pageSizeItems = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 }
]

const doFetch = useDebounceFn(() => fetchList({ search: search.value, status: status.value, page: page.value, pageSize: pageSize.value }), 200)
watch([search, status], doFetch, { immediate: true })

function openCreate() {
  selected.value = null
  modalOpen.value = true
}
function openPublish() {
  // reuse VersionModal to capture semver/notes in description field
  selected.value = null
  publishMode.value = true
  modalOpen.value = true
}
function reload() {
  fetchList({ search: search.value, status: status.value, page: page.value, pageSize: pageSize.value })
}
function onView(v: any) {
  router.push(localePath(`/admin/versions/${v.id}`))
}
function handlePageChange(next: number) {
  fetchList({ search: search.value, status: status.value, page: next, pageSize: pageSize.value })
}
function handlePageSizeChange(next: number) {
  fetchList({ search: search.value, status: status.value, page: 1, pageSize: next })
}
async function onEdit(v:any) {
  selected.value = v
  modalOpen.value = true
}
async function onDelete(v:any) {
  const ok = confirm(tt('versions.deleteConfirm', 'Delete this version?'))
  if (!ok) return
  await remove(v.id)
  toast.add({ title: tt('common.success', 'Success'), description: tt('versions.deleted', 'Version deleted'), color: 'success' })
  await reload()
}

const toast = useToast()
async function onSave(payload: { id?: number; version_semver: string; description?: string | null; metadata?: Record<string, any> }) {
  try {
    if (publishMode.value) {
      // Guided publish: call publish endpoint with semver and notes (mapped from description)
      const res: any = await $fetch('/api/content_versions/publish', { method: 'POST', body: { version_semver: payload.version_semver, notes: payload.description || null } })
      toast.add({ title: tt('versions.published','Published'), description: `${res?.data?.totalEntities || 0} entities · ${res?.data?.totalRevisionsPublished || 0} revisions`, color: 'success' })
      publishMode.value = false
      modalOpen.value = false
      await reload()
    } else {
      // Ensure plain JSON (no Vue proxies)
      const metaPlain = payload.metadata ? JSON.parse(JSON.stringify(payload.metadata)) : {}
      const desc = payload.description ?? null
      if (payload.id) await update(payload.id, { version_semver: payload.version_semver, description: desc, metadata: metaPlain })
      else await create({ version_semver: payload.version_semver, description: desc, metadata: metaPlain })
      toast.add({ title: tt('common.success', 'Success'), description: tt('versions.saved', 'Version saved'), color: 'success' })
      await reload()
    }
  } catch (e: any) {
    const status = e?.statusCode || e?.response?.status
    let friendly = e?.data?.message || e?.message || String(e)
    if (status === 400) friendly = tt('versions.err400', 'Please review the fields and try again')
    else if (status === 409) friendly = tt('versions.err409', 'A version with this number already exists')
    else if (status >= 500) friendly = tt('versions.err500', 'Unexpected server error')
    toast.add({ title: tt('common.error', 'Error'), description: friendly, color: 'error' })
  }
}

// Metadata modal handling
const metaOpen = ref(false)
const metaData = ref<any>(null)
function onMeta(v:any) {
  metaData.value = v?.metadata ?? {}
  metaOpen.value = true
}

// role gating for publish
const { currentUser } = useCurrentUser()
const isEditor = computed(() => {
  const roles = currentUser.value?.roles?.map(r => r.name) || []
  return roles.includes('admin') || roles.includes('editor')
})
</script>
