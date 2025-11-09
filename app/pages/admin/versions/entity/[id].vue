<!-- app/pages/admin/versions/[entity]/[id].vue -->
<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-xl font-semibold">{{ $t('features.admin.entityHistory.title','Entity revision history') }} – {{ entity }} #{{ id }}</h1>
      <UButton icon="i-heroicons-arrow-left" variant="soft" @click="goBack">{{ $t('features.admin.entityHistory.back','Back to versions') }}</UButton>
    </div>

    <div class="flex flex-col md:flex-row gap-4">
      <!-- Sidebar: Revisions -->
      <UCard class="md:w-1/4 w-full">
        <template #header>
          <div class="flex items-center justify-between">
            <div>{{ $t('features.admin.revisionsHistory.title','Revision history') }}</div>
            <UButton
              color="primary"
              variant="soft"
              icon="i-heroicons-scale"
              :disabled="selectedIds.length !== 2"
              :label="$t('features.admin.revisionsHistory.compareSelected','Compare selected')"
              @click="openCompare"
            />
          </div>
        </template>
        <div class="space-y-2 max-h-[70vh] overflow-auto">
          <UTabs v-model="activeTab" :items="tabItems" class="mb-2" />
          <div v-if="activeTab === 'revisions'">
            <div v-if="pending" class="py-2 text-sm text-gray-500">{{ $t('ui.states.loading','Loading...') }}</div>
            <div v-else>
              <div v-if="revisions.length === 0" class="text-sm text-gray-400">{{ $t('features.admin.entityHistory.selectRevision','Select a revision to view changes') }}</div>
              <div v-for="r in revisions" :key="r.id" class="p-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-800">
                <div class="flex items-start gap-2">
                  <UCheckbox :model-value="selectedIds.includes(r.id)" @update:model-value="v => toggleSelect(r.id, v)" />
                  <div class="flex-1 cursor-pointer" :class="{ 'ring-2 ring-primary-500 rounded': selectedRevision?.id===r.id }" @click="select(r)">
                    <div class="flex items-center justify-between">
                      <div class="text-xs text-gray-500">#{{ r.id }}</div>
                      <UBadge size="xs" variant="soft">{{ r.status }}</UBadge>
                    </div>
                    <div class="mt-1">
                      <UBadge :color="r.language_code ? 'primary' : 'neutral'" variant="soft" size="xs">
                        {{ r.language_code ? $t('features.admin.revisionsHistory.translation','Translation ({lang})').replace('{lang}', String(r.language_code)) : $t('features.admin.revisionsHistory.baseEntity','Base entity') }}
                      </UBadge>
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-300 mt-1">{{ formatDate(r.created_at) }}</div>
                    <div class="text-xs text-gray-500">{{ (r as any).author_name || r.created_by || '' }}</div>
                    <div v-if="r.content_version_id" class="text-[11px] text-gray-500">v{{ r.content_version_id }}</div>
                    <div class="mt-1 flex gap-2">
                      <UButton size="xs" icon="i-heroicons-document-magnifying-glass" variant="soft" @click.stop="viewDiff(r)">{{ $t('features.admin.revisionsHistory.viewDiff','View diff') }}</UButton>
                      <UButton size="xs" icon="i-heroicons-arrow-path" color="primary" variant="soft" @click.stop="revertRevision(r.id)">{{ $t('features.admin.revisionsHistory.revert','Revert to this revision') }}</UButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else>
            <div class="mb-1 text-xs text-gray-500">{{ feedbackMeta.totalItems || 0 }} {{ $t('features.admin.revisionsHistory.feedbackTab','Feedback') }}</div>
            <p v-if="entityType !== entity" class="text-xs text-gray-500 italic mb-2">
              {{ $t('common.showing','Showing') }} feedback for base entity: {{ entityType }}
            </p>
            <FeedbackList
              :items="feedbackItems"
              :is-editor="isEditor"
              @resolve="onResolveFeedback"
              @reopen="onReopenFeedback"
              @delete="onDeleteFeedback"
              @notes="onNotes"
            />
          </div>
        </div>
      </UCard>

      <!-- Main: Entity viewer -->
      <div class="flex-1">
        <EntityViewer :entity="entityData" :highlight-diff="highlightOps" :language-code="selectedRevision?.language_code" />
        <div v-if="!highlightOps.length" class="mt-2 text-sm text-gray-500">{{ $t('features.admin.entityHistory.noDiff','No differences') }}</div>
      </div>
    </div>

    <JsonModal v-model="diffOpen" :value="currentDiff" :title="$t('features.admin.revisionsHistory.viewDiff','View diff')" />
    <RevisionCompareModal v-model:open="compareOpen" :rev-a="revA" :rev-b="revB" />
    <FeedbackNotesModal
      :open="notesOpen"
      :detail="notesItem?.detail || ''"
      :is-editor="isEditor"
      :username="currentUser?.username || currentUser?.name || ''"
      @update:open="v => notesOpen = v"
      @save="saveNotes"
    />
  </div>
</template>

<script setup lang="ts">
import EntityViewer from '@/components/admin/EntityViewer.vue'
import JsonModal from '@/components/admin/JsonModal.vue'
import RevisionCompareModal from '@/components/admin/RevisionCompareModal.vue'
import FeedbackList from '@/components/admin/FeedbackList.vue'
import FeedbackNotesModal from '@/components/admin/FeedbackNotesModal.vue'
import { useRevisions } from '@/composables/admin/useRevisions'
import { useContentFeedback } from '@/composables/admin/useContentFeedback'
import { useCurrentUser } from '@/composables/users/useCurrentUser'
import { useApiFetch } from '@/utils/fetcher'
import { formatDate } from '@/utils/date'
const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const entity = computed(() => String(route.params.entity || ''))
const id = computed(() => Number(route.params.id))

// Map translation entities to their base type for feedback filtering
const baseEntityMap: Record<string, string> = {
  base_card_translations: 'base_card',
  base_card_translation: 'base_card',
  arcana_translation: 'arcana',
  arcana_translations: 'arcana',
  base_skills_translations: 'base_skills',
  facet_translation: 'facet',
  facet_translations: 'facet',
  world_translations: 'world',
  world_translation: 'world',
  base_card_type_translations: 'base_card_type',
  base_card_type_translation: 'base_card_type'
}
const entityType = computed(() => baseEntityMap[entity.value] || entity.value)
const entityId = id

const { items, pending, error, fetchByEntity, fetchList, fetchOne, setStatus } = useRevisions()
const revisions = items
const selectedRevision = ref<any | null>(null)
const selectedIds = ref<number[]>([])

const entityData = ref<any>({})
const language = ref<string | undefined>(undefined)

const activeTab = ref<'revisions' | 'feedback'>('revisions')
const { items: feedbackItemsRef, meta: feedbackMetaRef, fetchList: fetchFeedback, resolve: resolveFeedback, remove: removeFeedback, update: updateFeedback } = useContentFeedback()
const feedbackItems = feedbackItemsRef
const feedbackMeta = feedbackMetaRef
const tabItems = computed(() => [
  { label: t('features.admin.revisionsHistory.title', 'Revisions'), value: 'revisions' },
  { label: `${t('features.admin.revisionsHistory.feedbackTab','Feedback')} (${feedbackMeta.value?.totalItems || 0})`, value: 'feedback' }
])

const { currentUser } = useCurrentUser()
const isEditor = computed(() => {
  const roles = currentUser.value?.roles?.map(r => r.name) || []
  return roles.includes('admin') || roles.includes('editor')
})

const apiFetch = useApiFetch

function goBack() { router.push('/admin/versions') }

async function loadEntity() {
  // try language if available
  try {
    const params = language.value ? { lang: language.value } : undefined
    const res = await apiFetch<any>(`/${entity.value}/${id.value}`, {
      method: 'GET',
      params,
    })
    entityData.value = res?.data ?? res ?? {}
  } catch (e) {
    entityData.value = {}
  }
}

function select(r:any) {
  selectedRevision.value = r
  language.value = r?.language_code || language.value
}

function toggleSelect(id:number, v:boolean) {
  const set = new Set(selectedIds.value)
  if (v) set.add(id); else set.delete(id)
  selectedIds.value = Array.from(set)
}

const highlightOps = computed(() => {
  const diff = selectedRevision.value?.diff
  return Array.isArray(diff) ? diff : ([] as any[])
})

const diffOpen = ref(false)
const currentDiff = ref<any>({})
function viewDiff(r:any) {
  currentDiff.value = r?.diff || {}
  diffOpen.value = true
}

const compareOpen = ref(false)
const revA = computed(() => revisions.value.find(r => r.id === selectedIds.value[0]) || null)
const revB = computed(() => revisions.value.find(r => r.id === selectedIds.value[1]) || null)
function openCompare() { if (selectedIds.value.length === 2) compareOpen.value = true }

async function refreshRevisions() {
  await fetchByEntity(entity.value, Number(id.value), language.value)
}

async function refreshFeedback() {
  try {
    await fetchFeedback({ entity_type: entityType.value, entity_id: Number(entityId.value), page: 1, pageSize: 50 })
  } catch (e) {
    // Fallback to original entity routing type if backend mapping fails
    await fetchFeedback({ entity_type: entity.value, entity_id: Number(id.value), page: 1, pageSize: 50 })
  }
}

async function onResolveFeedback(f:any) {
  await resolveFeedback(f.id)
  await refreshFeedback()
}
async function onReopenFeedback(f:any) {
  await updateFeedback(f.id, { status: 'open' })
  await refreshFeedback()
}
async function onDeleteFeedback(f:any) {
  await removeFeedback(f.id)
  await refreshFeedback()
}
const notesOpen = ref(false)
const notesItem = ref<any | null>(null)
function onNotes(f:any) { notesItem.value = f; notesOpen.value = true }
async function saveNotes(nextDetail:string) {
  if (!notesItem.value) return
  await updateFeedback(notesItem.value.id, { detail: nextDetail })
  notesOpen.value = false
  notesItem.value = null
  await refreshFeedback()
}

async function revertRevision(revId:number) {
  try {
    // confirm
    if (typeof window !== 'undefined') {
      const ok = window.confirm(String(t('features.admin.revisionsHistory.revertConfirm', 'Are you sure you want to restore this revision?')))
      if (!ok) return
    }
    await apiFetch(`/content_revisions/${revId}/revert`, { method: 'POST' })
    useToast().add({ title: t('features.admin.revisionsHistory.revertSuccess','Revision reverted successfully'), color: 'success' })
    await loadEntity()
    await refreshRevisions()
  } catch (e:any) {
    useToast().add({ title: t('features.admin.revisionsHistory.revertError','Error reverting revision'), description: e?.data?.message || e?.message, color: 'error' })
  }
}

watch([entity, id], async ([e, i]) => {
  if (!e || !i) return
  await fetchByEntity(e, Number(i))
  selectedRevision.value = revisions.value?.[0] || null
  language.value = selectedRevision.value?.language_code || undefined
  await loadEntity()
  await refreshFeedback()
}, { immediate: true })

watch([selectedRevision, language], async () => {
  await loadEntity()
})
</script>
