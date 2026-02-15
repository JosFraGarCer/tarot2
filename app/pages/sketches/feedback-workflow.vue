<!--
  /pages/sketches/feedback-workflow.vue
  POC 10: Structured feedback system for cards

  OBJECTIVE:
  Threaded feedback panel with per-comment status (open/addressed/resolved),
  editorial integration (blocking issues, unresolved count in indicator),
  filtering (unresolved, mine, per-language), and resolution UX.

  SUCCESS CRITERIA:
  - Threaded comments with inline reply
  - Status per comment: open → addressed → resolved
  - Filtering: unresolved only, my comments, per-language
  - Editorial indicator shows warning when open feedback exists
  - Resolution with note + visual confirmation
  - Visually consistent with Studio editor layout

  INTEGRATION INTO /manage:
  1. Feedback panel → EntitySlideover "Feedback" tab or standalone USlideover
  2. Connect to /api/feedback endpoints:
     - GET  /api/feedback?entity_type=X&entity_id=Y → list comments
     - POST /api/feedback → create comment
     - PATCH /api/feedback/:id → update status, add reply
  3. EntityEditorialIndicator receives unresolved count as blocking reason
  4. useFeedback composable handles CRUD + optimistic updates
  5. Feedback count badge in ManageTableBridge row actions overflow menu
-->
<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  generateMockEntities,
  editorialStatusMeta,
  translationCoverage,
  avatarUrl,
  relativeTime as relativeTimeFn,
  type MockEntity,
} from '~/components/sketches/mockData'
import EntityEditorialIndicator from '~/components/sketches/EntityEditorialIndicator.vue'
import SketchCrossNav from '~/components/sketches/SketchCrossNav.vue'

definePageMeta({ layout: 'default' })

const toast = useToast()

// --- Mock entity ---
const entity = ref<MockEntity>(generateMockEntities(1)[0])
const _coverage = computed(() => {
  const cov = translationCoverage(entity.value.translations)
  return { current: cov.done, total: cov.total }
})

// --- Feedback types ---
type FeedbackStatus = 'open' | 'addressed' | 'resolved'
type FeedbackType = 'card' | 'translation'

interface FeedbackReply {
  id: number
  author: string
  avatar_seed: string
  text: string
  created_at: string
}

interface FeedbackComment {
  id: number
  author: string
  avatar_seed: string
  text: string
  status: FeedbackStatus
  feedback_type: FeedbackType
  lang: string | null
  field_path: string | null
  content_version_id: number | null
  created_at: string
  resolution_note: string | null
  resolved_at: string | null
  resolved_by: string | null
  replies: FeedbackReply[]
}

// --- Mock feedback data ---
const feedbackComments = ref<FeedbackComment[]>([
  {
    id: 1,
    author: 'alice',
    avatar_seed: 'alice',
    text: 'The card description is too vague. We need more detail about the journey symbolism and how it connects to the arcana system.',
    status: 'open',
    feedback_type: 'card',
    lang: 'en',
    field_path: 'description',
    content_version_id: 12,
    created_at: '2026-02-10T14:30:00Z',
    resolution_note: null,
    resolved_at: null,
    resolved_by: null,
    replies: [
      { id: 101, author: 'bob', avatar_seed: 'bob', text: 'I agree — the symbolism section should reference the World card connection.', created_at: '2026-02-10T15:00:00Z' },
    ],
  },
  {
    id: 2,
    author: 'bob',
    avatar_seed: 'bob',
    text: 'French translation uses "Le Mat" but the community prefers "Le Fou". Need editorial decision.',
    status: 'addressed',
    feedback_type: 'translation',
    lang: 'fr',
    field_path: 'title',
    content_version_id: 11,
    created_at: '2026-02-09T10:15:00Z',
    resolution_note: null,
    resolved_at: null,
    resolved_by: null,
    replies: [
      { id: 201, author: 'carol', avatar_seed: 'carol', text: 'Historical sources use "Le Mat". I vote we keep it.', created_at: '2026-02-09T11:00:00Z' },
      { id: 202, author: 'alice', avatar_seed: 'alice', text: 'Addressed — updated translation note to explain the choice.', created_at: '2026-02-09T14:00:00Z' },
    ],
  },
  {
    id: 3,
    author: 'carol',
    avatar_seed: 'carol',
    text: 'Image quality is excellent. Approved for this card.',
    status: 'resolved',
    feedback_type: 'card',
    lang: null,
    field_path: 'image',
    content_version_id: 10,
    created_at: '2026-02-08T09:00:00Z',
    resolution_note: 'Image approved by art director.',
    resolved_at: '2026-02-08T16:00:00Z',
    resolved_by: 'dave',
    replies: [],
  },
  {
    id: 4,
    author: 'dave',
    avatar_seed: 'dave',
    text: 'Spanish translation missing the keyword "comienzos". This is a core concept for this card.',
    status: 'open',
    feedback_type: 'translation',
    lang: 'es',
    field_path: 'keywords',
    content_version_id: 12,
    created_at: '2026-02-11T09:00:00Z',
    resolution_note: null,
    resolved_at: null,
    resolved_by: null,
    replies: [],
  },
  {
    id: 5,
    author: 'alice',
    avatar_seed: 'alice',
    text: 'The card needs a subtitle. All Major Arcana should have "Major Arcana · [number]" format.',
    status: 'open',
    feedback_type: 'card',
    lang: null,
    field_path: 'subtitle',
    content_version_id: 12,
    created_at: '2026-02-12T08:30:00Z',
    resolution_note: null,
    resolved_at: null,
    resolved_by: null,
    replies: [],
  },
])

const FIELD_PATH_OPTIONS = [
  { label: 'General (no field)', value: '' },
  { label: 'Title', value: 'title' },
  { label: 'Subtitle', value: 'subtitle' },
  { label: 'Description', value: 'description' },
  { label: 'Keywords', value: 'keywords' },
  { label: 'Image', value: 'image' },
  { label: 'Effects', value: 'effects' },
]

function openInStudio(comment: FeedbackComment) {
  const parts = [`/manage/${entity.value.entity_type}/${entity.value.id}/studio`]
  const params: string[] = []
  if (comment.lang) params.push(`lang=${comment.lang}`)
  if (comment.field_path) params.push(`field=${comment.field_path}`)
  const url = parts[0] + (params.length ? `?${params.join('&')}` : '')
  toast.add({ title: 'Open in Studio', description: url, color: 'primary', icon: 'i-lucide-external-link' })
}

// --- Filters ---
const filterStatus = ref<'all' | 'unresolved' | 'mine'>('all')
const filterType = ref<'all' | 'card' | 'translation'>('all')
const filterLang = ref<string>('')
const currentUser = 'alice'

const langOptions = computed(() => {
  const langs = new Set(feedbackComments.value.map(c => c.lang).filter(Boolean) as string[])
  return [{ label: 'All languages', value: '' }, ...Array.from(langs).map(l => ({ label: l.toUpperCase(), value: l }))]
})

const filteredComments = computed(() => {
  let result = feedbackComments.value
  if (filterStatus.value === 'unresolved') {
    result = result.filter(c => c.status !== 'resolved')
  } else if (filterStatus.value === 'mine') {
    result = result.filter(c => c.author === currentUser)
  }
  if (filterType.value !== 'all') {
    result = result.filter(c => c.feedback_type === filterType.value)
  }
  if (filterLang.value) {
    result = result.filter(c => c.lang === filterLang.value)
  }
  return result
})

// --- Counts ---
const unresolvedCount = computed(() => feedbackComments.value.filter(c => c.status !== 'resolved').length)
const openCount = computed(() => feedbackComments.value.filter(c => c.status === 'open').length)
const addressedCount = computed(() => feedbackComments.value.filter(c => c.status === 'addressed').length)

// --- Blocking reasons for editorial indicator ---
const blockingReasons = computed(() => {
  const reasons: string[] = []
  if (openCount.value > 0) reasons.push(`${openCount.value} open feedback item${openCount.value > 1 ? 's' : ''}`)
  return reasons
})

// --- Status helpers ---
function statusMeta(status: FeedbackStatus): { color: 'warning' | 'primary' | 'success'; icon: string; label: string } {
  const map: Record<FeedbackStatus, { color: 'warning' | 'primary' | 'success'; icon: string; label: string }> = {
    open: { color: 'warning', icon: 'i-lucide-circle-alert', label: 'Open' },
    addressed: { color: 'primary', icon: 'i-lucide-message-circle', label: 'Addressed' },
    resolved: { color: 'success', icon: 'i-lucide-check-circle', label: 'Resolved' },
  }
  return map[status]
}

// --- Actions ---
const resolvingId = ref<number | null>(null)
const resolutionNote = ref('')

function startResolve(comment: FeedbackComment) {
  resolvingId.value = comment.id
  resolutionNote.value = ''
}

function cancelResolve() {
  resolvingId.value = null
  resolutionNote.value = ''
}

function confirmResolve(comment: FeedbackComment) {
  const idx = feedbackComments.value.findIndex(c => c.id === comment.id)
  if (idx === -1) return
  feedbackComments.value[idx] = {
    ...comment,
    status: 'resolved',
    resolution_note: resolutionNote.value || 'Resolved without note.',
    resolved_at: new Date().toISOString(),
    resolved_by: currentUser,
  }
  resolvingId.value = null
  resolutionNote.value = ''
  toast.add({ title: 'Feedback resolved', description: `Comment #${comment.id} marked as resolved.`, color: 'success', icon: 'i-lucide-check-circle' })
}

function markAddressed(comment: FeedbackComment) {
  const idx = feedbackComments.value.findIndex(c => c.id === comment.id)
  if (idx === -1) return
  feedbackComments.value[idx] = { ...comment, status: 'addressed' }
  toast.add({ title: 'Marked as addressed', color: 'primary', icon: 'i-lucide-message-circle' })
}

// --- Reply ---
const replyingToId = ref<number | null>(null)
const replyText = ref('')

function startReply(commentId: number) {
  replyingToId.value = commentId
  replyText.value = ''
}

function cancelReply() {
  replyingToId.value = null
  replyText.value = ''
}

function submitReply(comment: FeedbackComment) {
  if (!replyText.value.trim()) return
  const idx = feedbackComments.value.findIndex(c => c.id === comment.id)
  if (idx === -1) return
  const newReply: FeedbackReply = {
    id: Date.now(),
    author: currentUser,
    avatar_seed: currentUser,
    text: replyText.value.trim(),
    created_at: new Date().toISOString(),
  }
  feedbackComments.value[idx] = {
    ...comment,
    replies: [...comment.replies, newReply],
  }
  replyingToId.value = null
  replyText.value = ''
  toast.add({ title: 'Reply added', color: 'neutral', icon: 'i-lucide-message-square' })
}

// --- New comment ---
const showNewComment = ref(false)
const newCommentState = reactive({ text: '', lang: '', field_path: '' })

const newCommentLangOptions = [
  { label: 'General (no language)', value: '' },
  { label: 'EN', value: 'en' },
  { label: 'FR', value: 'fr' },
  { label: 'ES', value: 'es' },
]

function submitNewComment() {
  if (!newCommentState.text.trim()) return
  const newComment: FeedbackComment = {
    id: Date.now(),
    author: currentUser,
    avatar_seed: currentUser,
    text: newCommentState.text.trim(),
    status: 'open',
    feedback_type: newCommentState.lang ? 'translation' : 'card',
    lang: newCommentState.lang || null,
    field_path: newCommentState.field_path || null,
    content_version_id: entity.value.content_version_id,
    created_at: new Date().toISOString(),
    resolution_note: null,
    resolved_at: null,
    resolved_by: null,
    replies: [],
  }
  feedbackComments.value.unshift(newComment)
  newCommentState.text = ''
  newCommentState.lang = ''
  newCommentState.field_path = ''
  showNewComment.value = false
  toast.add({ title: 'Feedback added', color: 'success', icon: 'i-lucide-plus-circle' })
}

function feedbackTypeMeta(type: FeedbackType): { color: string; icon: string; label: string } {
  return type === 'translation'
    ? { color: 'info', icon: 'i-lucide-languages', label: 'Translation' }
    : { color: 'neutral', icon: 'i-lucide-file-text', label: 'Card' }
}
</script>

<template>
  <div class="min-h-screen bg-default flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-default bg-default/95 backdrop-blur-sm">
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-lg font-bold tracking-tight">Feedback Workflow</h1>
          <UBadge color="primary" variant="subtle" size="xs">Studio</UBadge>
        </div>

        <!-- Editorial indicator with feedback warning -->
        <div class="flex items-center gap-3">
          <EntityEditorialIndicator
            :editorial-state="entity.editorial_state"
            :next-action="unresolvedCount > 0 ? `${unresolvedCount} unresolved` : null"
          />
          <UBadge
            v-if="unresolvedCount > 0"
            color="warning"
            variant="soft"
            size="sm"
            icon="i-lucide-message-circle-warning"
            :aria-label="`${unresolvedCount} unresolved feedback items`"
          >
            {{ unresolvedCount }}
          </UBadge>
        </div>
      </div>
    </header>

    <!-- Cross-navigation -->
    <SketchCrossNav :entity-name="entity.name" current-view="feedback" />

    <!-- Main content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: entity context (simulates Studio editor) -->
      <main class="flex-1 p-6 overflow-y-auto">
        <!-- Entity card preview (simplified) -->
        <div class="max-w-md mx-auto">
          <div class="rounded-xl border border-default p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold">{{ entity.name }}</h2>
              <UBadge
                :color="editorialStatusMeta(entity.status).color"
                :variant="editorialStatusMeta(entity.status).variant"
                :icon="editorialStatusMeta(entity.status).icon"
                size="sm"
              >
                {{ editorialStatusMeta(entity.status).label }}
              </UBadge>
            </div>

            <p class="text-sm text-muted">
              Code: <code class="text-xs">{{ entity.code }}</code> · Type: {{ entity.entity_type }}
            </p>

            <!-- Blocking issues from feedback -->
            <div v-if="blockingReasons.length" class="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-alert-triangle" class="text-warning" />
                <span class="text-xs font-semibold text-warning">Blocking Issues</span>
              </div>
              <ul class="space-y-1">
                <li
                  v-for="(reason, idx) in blockingReasons"
                  :key="idx"
                  class="text-xs text-warning flex items-center gap-1.5"
                >
                  <UIcon name="i-lucide-circle-dot" class="text-[10px] shrink-0" />
                  {{ reason }}
                </li>
              </ul>
            </div>

            <!-- Feedback summary -->
            <div class="flex items-center gap-3 text-xs text-muted">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-message-square" />
                {{ feedbackComments.length }} total
              </span>
              <span class="flex items-center gap-1 text-warning">
                <UIcon name="i-lucide-circle-alert" />
                {{ openCount }} open
              </span>
              <span class="flex items-center gap-1 text-primary">
                <UIcon name="i-lucide-message-circle" />
                {{ addressedCount }} addressed
              </span>
            </div>
          </div>

          <!-- Integration note -->
          <div class="mt-6 rounded-lg border border-default p-4 bg-muted/5">
            <p class="text-xs text-muted leading-relaxed">
              <strong>Integration:</strong> This panel appears as a <code class="text-xs">USlideover</code> in the Studio editor
              or as the "Feedback" tab in <code class="text-xs">EntitySlideover</code>.
              Connect to <code class="text-xs">/api/feedback</code> endpoints via <code class="text-xs">useFeedback</code> composable.
              Unresolved count feeds into <code class="text-xs">EntityEditorialIndicator</code> blocking reasons.
            </p>
          </div>
        </div>
      </main>

      <!-- Right: feedback panel -->
      <aside class="w-96 lg:w-md border-l border-default bg-default overflow-y-auto shrink-0 flex flex-col">
        <!-- Panel header -->
        <div class="sticky top-0 z-10 bg-default border-b border-default px-4 py-3 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">Feedback</h3>
            <UButton
              label="New"
              icon="i-lucide-plus"
              size="xs"
              aria-label="Add new feedback comment"
              @click="showNewComment = !showNewComment"
            />
          </div>

          <!-- Filters -->
          <div class="flex items-center gap-2 flex-wrap">
            <div class="flex items-center rounded-md border border-default overflow-hidden">
              <button
                v-for="opt in ([{ value: 'all', label: 'All' }, { value: 'unresolved', label: 'Unresolved' }, { value: 'mine', label: 'Mine' }] as const)"
                :key="opt.value"
                class="px-2.5 py-1 text-xs font-medium transition-colors"
                :class="filterStatus === opt.value ? 'bg-primary text-white' : 'text-muted hover:text-primary'"
                :aria-label="`Filter: ${opt.label}`"
                :aria-pressed="filterStatus === opt.value"
                @click="filterStatus = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
            <!-- Feedback type filter -->
            <div class="flex items-center rounded-md border border-default overflow-hidden">
              <button
                v-for="opt in ([{ value: 'all', label: 'All Types' }, { value: 'card', label: 'Card' }, { value: 'translation', label: 'Translation' }] as const)"
                :key="opt.value"
                class="px-2 py-1 text-xs font-medium transition-colors"
                :class="filterType === opt.value ? 'bg-primary text-white' : 'text-muted hover:text-primary'"
                :aria-pressed="filterType === opt.value"
                @click="filterType = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
            <USelect
              :model-value="filterLang"
              :items="langOptions"
              size="xs"
              class="w-24"
              aria-label="Filter by language"
              @update:model-value="filterLang = $event"
            />
          </div>
        </div>

        <!-- New comment form -->
        <div v-if="showNewComment" class="px-4 py-3 border-b border-default bg-muted/5 space-y-3">
          <UFormField label="Comment" description="Describe the issue or suggestion">
            <UTextarea
              v-model="newCommentState.text"
              placeholder="Write your feedback..."
              :rows="3"
              autofocus
              class="w-full"
              aria-label="New feedback comment text"
            />
          </UFormField>
          <UFormField label="Language context" description="Optional: link feedback to a specific language">
            <USelect
              v-model="newCommentState.lang"
              :items="newCommentLangOptions"
              size="xs"
              class="w-full"
              aria-label="Language context for feedback"
            />
          </UFormField>
          <UFormField label="Field" description="Optional: anchor feedback to a specific field">
            <USelect
              v-model="newCommentState.field_path"
              :items="FIELD_PATH_OPTIONS"
              size="xs"
              class="w-full"
              aria-label="Field path for feedback"
            />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" size="xs" variant="ghost" color="neutral" @click="showNewComment = false" />
            <UButton
              label="Submit"
              icon="i-lucide-send"
              size="xs"
              :disabled="!newCommentState.text.trim()"
              aria-label="Submit new feedback"
              @click="submitNewComment"
            />
          </div>
        </div>

        <!-- Comments list -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="filteredComments.length" class="divide-y divide-default">
            <div
              v-for="comment in filteredComments"
              :key="comment.id"
              class="px-4 py-4 space-y-3"
            >
              <!-- Comment header -->
              <div class="flex items-start gap-3">
                <!-- Avatar -->
                <UAvatar :src="avatarUrl(comment.author)" :alt="comment.author" size="sm" class="shrink-0" />

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-semibold">{{ comment.author }}</span>
                    <span class="text-[10px] text-muted">{{ relativeTimeFn(comment.created_at) }}</span>
                    <!-- Feedback type badge differentiator -->
                    <UBadge
                      :color="feedbackTypeMeta(comment.feedback_type).color as any"
                      variant="outline"
                      size="xs"
                      :icon="feedbackTypeMeta(comment.feedback_type).icon"
                    >
                      {{ feedbackTypeMeta(comment.feedback_type).label }}
                    </UBadge>
                    <UBadge
                      v-if="comment.lang"
                      color="neutral"
                      variant="outline"
                      size="xs"
                    >
                      {{ comment.lang.toUpperCase() }}
                    </UBadge>
                    <UBadge
                      v-if="comment.field_path"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                      icon="i-lucide-map-pin"
                    >
                      {{ comment.field_path }}
                    </UBadge>
                    <span v-if="comment.content_version_id" class="text-[9px] text-muted tabular-nums">v#{{ comment.content_version_id }}</span>
                    <UBadge
                      :color="statusMeta(comment.status).color"
                      variant="soft"
                      size="xs"
                      :icon="statusMeta(comment.status).icon"
                      :aria-label="`Status: ${statusMeta(comment.status).label}`"
                    >
                      {{ statusMeta(comment.status).label }}
                    </UBadge>
                  </div>

                  <!-- Comment text -->
                  <p class="text-sm leading-relaxed mt-1.5">{{ comment.text }}</p>

                  <!-- Resolution note -->
                  <div v-if="comment.status === 'resolved' && comment.resolution_note" class="mt-2 rounded-md bg-success/5 border border-success/20 px-3 py-2">
                    <div class="flex items-center gap-1.5 mb-1">
                      <UIcon name="i-lucide-check-circle" class="text-success text-xs" />
                      <span class="text-[10px] font-medium text-success">Resolved by {{ comment.resolved_by }}</span>
                      <span v-if="comment.resolved_at" class="text-[10px] text-muted">· {{ relativeTimeFn(comment.resolved_at) }}</span>
                    </div>
                    <p class="text-xs text-muted">{{ comment.resolution_note }}</p>
                  </div>

                  <!-- Replies -->
                  <div v-if="comment.replies.length" class="mt-3 space-y-2 pl-3 border-l-2 border-default">
                    <div
                      v-for="reply in comment.replies"
                      :key="reply.id"
                      class="flex items-start gap-2"
                    >
                      <UAvatar :src="avatarUrl(reply.author)" :alt="reply.author" size="2xs" class="shrink-0" />
                      <div>
                        <div class="flex items-center gap-1.5">
                          <span class="text-[11px] font-semibold">{{ reply.author }}</span>
                          <span class="text-[10px] text-muted">{{ relativeTimeFn(reply.created_at) }}</span>
                        </div>
                        <p class="text-xs leading-relaxed mt-0.5">{{ reply.text }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Reply form -->
                  <div v-if="replyingToId === comment.id" class="mt-3 space-y-2">
                    <UTextarea
                      v-model="replyText"
                      placeholder="Write a reply..."
                      :rows="2"
                      autofocus
                      class="w-full"
                      :aria-label="`Reply to ${comment.author}'s feedback`"
                    />
                    <div class="flex justify-end gap-2">
                      <UButton label="Cancel" size="xs" variant="ghost" color="neutral" @click="cancelReply" />
                      <UButton
                        label="Reply"
                        icon="i-lucide-corner-down-right"
                        size="xs"
                        :disabled="!replyText.trim()"
                        aria-label="Submit reply"
                        @click="submitReply(comment)"
                      />
                    </div>
                  </div>

                  <!-- Resolve form -->
                  <div v-if="resolvingId === comment.id" class="mt-3 space-y-2 rounded-md border border-success/30 bg-success/5 p-3">
                    <p class="text-xs font-medium text-success">Resolve this feedback</p>
                    <UTextarea
                      v-model="resolutionNote"
                      placeholder="Add a resolution note (optional)..."
                      :rows="2"
                      autofocus
                      class="w-full"
                      aria-label="Resolution note"
                    />
                    <div class="flex justify-end gap-2">
                      <UButton label="Cancel" size="xs" variant="ghost" color="neutral" @click="cancelResolve" />
                      <UButton
                        label="Resolve"
                        icon="i-lucide-check-circle"
                        size="xs"
                        color="success"
                        aria-label="Confirm resolve feedback"
                        @click="confirmResolve(comment)"
                      />
                    </div>
                  </div>

                  <!-- Action buttons -->
                  <div v-if="comment.status !== 'resolved' && resolvingId !== comment.id && replyingToId !== comment.id" class="mt-2 flex items-center gap-2">
                    <UButton
                      v-if="comment.field_path"
                      label="Open in Studio"
                      icon="i-lucide-external-link"
                      size="xs"
                      variant="ghost"
                      color="primary"
                      :aria-label="`Open ${comment.field_path} in Studio editor`"
                      @click="openInStudio(comment)"
                    />
                    <UButton
                      label="Reply"
                      icon="i-lucide-corner-down-right"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      :aria-label="`Reply to ${comment.author}`"
                      @click="startReply(comment.id)"
                    />
                    <UButton
                      v-if="comment.status === 'open'"
                      label="Addressed"
                      icon="i-lucide-message-circle"
                      size="xs"
                      variant="ghost"
                      color="primary"
                      :aria-label="`Mark feedback from ${comment.author} as addressed`"
                      @click="markAddressed(comment)"
                    />
                    <UButton
                      label="Resolve"
                      icon="i-lucide-check-circle"
                      size="xs"
                      variant="ghost"
                      color="success"
                      :aria-label="`Resolve feedback from ${comment.author}`"
                      @click="startResolve(comment)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="flex flex-col items-center justify-center py-12 text-center px-4">
            <UIcon name="i-lucide-message-square-off" class="text-3xl text-muted/30 mb-3" />
            <p class="text-sm text-muted">No feedback matches the current filters.</p>
            <UButton
              label="Clear filters"
              size="xs"
              variant="ghost"
              class="mt-2"
              @click="filterStatus = 'all'; filterLang = ''"
            />
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
