<!-- app/pages/admin/feedback/[id].vue -->
<template>
  <div class="px-4">
    <UCard>
      <template #header>
        <div class="flex items-start justify-between w-full">
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ t('admin.feedbackTitle') || 'Feedback' }} #{{ feedback?.id ?? route.params.id }}
            </h1>
            <p v-if="feedback" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span class="font-mono">{{ feedback.entity_type }}</span>
              · ID {{ feedback.entity_id }}
              <span v-if="feedback.language_code">· {{ feedback.language_code?.toUpperCase() }}</span>
              · {{ formatDate(feedback.created_at) }}
            </p>
          </div>
          <div class="flex gap-2">
            <UButton icon="i-heroicons-check-circle" color="primary" variant="soft" :disabled="feedback?.status==='resolved'" :label="t('common.resolve') || 'Resolve'" @click="onResolve" />
            <UButton icon="i-heroicons-trash" color="error" variant="soft" :label="t('common.delete') || 'Delete'" @click="deleteOpen=true" />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-between items-center w-full">
          <UButton icon="i-heroicons-arrow-left" variant="soft" :label="t('common.back') || 'Back'" @click="router.replace(localePath('/admin/feedback'))" />
          <div>
            <h3 class="font-semibold mb-2 text-gray-800 dark:text-gray-100">{{ t('common.card') || 'Card' }}</h3>
            <div v-if="card">
              <CartaRow
                :template-key="'Class'"
                :type-label="card.card_type_name || card.card_type_code"
                :name="card.name || card.code"
                :short-text="card.short_text || ''"
                :description="card.description || ''"
                :img="card.image || undefined"
              />
            </div>
            <div v-else class="text-gray-500 text-sm">{{ t('feedback.noLinkedCard') || 'No linked card preview' }}</div>
          </div>

          <!-- Right: Feedback detail -->
          <div>
            <h3 class="font-semibold mb-2 text-gray-800 dark:text-gray-100">{{ t('common.details') || 'Details' }}</h3>
            <div class="space-y-3">
              <div>
                <div class="text-xs text-gray-500">{{ t('common.category') || 'Category' }}</div>
                <div class="mt-0.5"><UBadge variant="soft">{{ feedback?.category || '-' }}</UBadge></div>
              </div>
              <div>
                <div class="text-xs text-gray-500">{{ t('common.comment') || 'Comment' }}</div>
                <p class="mt-1 whitespace-pre-wrap">{{ feedback?.comment }}</p>
              </div>
              <div class="flex items-center gap-2">
                <div class="text-xs text-gray-500">{{ t('common.status') || 'Status' }}</div>
                <UBadge :color="feedback?.status==='resolved' ? 'primary' : 'neutral'" variant="soft">{{ feedback?.status }}</UBadge>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UCard>
    <ConfirmDeleteModal
      :open="deleteOpen"
      :title="t('admin.feedbackDeleteTitle') || 'Delete feedback'"
      :description="t('admin.feedbackDeleteDescription') || 'This will permanently delete this feedback entry. This action cannot be undone.'"
      :confirm-label="t('manageConfirm.deleteConfirm') || 'Delete'"
      :cancel-label="t('common.cancel') || 'Cancel'"
      :loading="deleting"
      @update:open="v => deleteOpen = v"
      @confirm="confirmDelete"
      @cancel="() => { deleteOpen = false }"
    />
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/date'
import CartaRow from '~/components/manage/CartaRow.vue'
import { useContentFeedback } from '~/composables/admin/useContentFeedback'
import ConfirmDeleteModal from '~/components/common/ConfirmDeleteModal.vue'
import { useApiFetch } from '@/utils/fetcher'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()

useSeoMeta({ title: `${t('nav.admin') || 'Admin'} · ${t('admin.feedbackTitle') || 'Feedback'} · #${route.params.id}` })

const id = computed(() => Number(route.params.id))

const loading = ref(true)
const error = ref<any>(null)
const feedback = ref<any>(null)
const card = ref<any>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await fetchOne(id.value)
    feedback.value = res

    // If feedback refers to a base card translation, fetch the base card
    if (feedback.value?.entity_type === 'base_card_translations') {
      try {
        const cardRes = await apiFetch<{ success?: boolean; data?: any }>(`/base_card/by-translation/${feedback.value.entity_id}`, {
          method: 'GET',
        })
        card.value = cardRes?.data ?? cardRes ?? null
      } catch (e) {
        // ignore card load error; show feedback anyway
        console.error(e)
      }
    }
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || String(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)

const { fetchOne, resolve: resolveFeedback, remove } = useContentFeedback()
const apiFetch = useApiFetch
const toast = useToast()
const deleteOpen = ref(false)
const deleting = ref(false)
async function onResolve() {
  if (!feedback.value) return
  await resolveFeedback(feedback.value.id)
  toast.add({ title: t('common.success') || 'Success', description: t('status.resolved') || 'resolved', color: 'success' })
  await load()
}
async function onDelete() {
  if (!feedback.value) return
  // handled via modal
}

async function confirmDelete() {
  if (!feedback.value) return
  try {
    deleting.value = true
    await remove(feedback.value.id)
    toast.add({ title: t('common.success') || 'Success', description: t('messages.deleteSuccess') || 'Deleted successfully', color: 'success' })
    router.replace(localePath('/admin/feedback'))
  } finally {
    deleting.value = false
    deleteOpen.value = false
  }
}
</script>
