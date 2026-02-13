<!--
  /pages/sketches/delete-preview.vue
  POC 5: Delete confirmation with explicit impact preview

  OBJECTIVE:
  Confirm deletion with explicit impact summary table:
  - Base entity: YES/NO
  - Translations removed: [EN, FR, ES]
  - editorial_state removed: YES/NO
  - Tags removed: N
  Always language-independent: 2 clear options, no implicit UI-locale behavior.

  SUCCESS CRITERIA:
  - User always knows exactly what will be deleted
  - Impact summary table is scannable at a glance
  - No implicit behavior based on UI locale
  - Keyboard: Tab to options, Enter to select, focus trapped in modal

  INTEGRATION INTO /manage:
  1. Replace useEntityDeletion's implicit locale-based logic
  2. Always show choice dialog: "Delete base" vs "Delete translation"
  3. Wire to crud.remove() for base, translation-specific endpoint for translations
  4. After delete, refresh list and editorial_state
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  generateMockEntities,
  editorialStatusMeta,
  translationCoverage,
  computeEditorial,
  type MockEntity,
} from '~/components/sketches/mockData'
import EntityEditorialIndicator from '~/components/sketches/EntityEditorialIndicator.vue'

definePageMeta({ layout: 'default' })

const toast = useToast()
const isAuthenticated = ref(true)
const entities = ref(generateMockEntities(10))

// --- Delete flow state ---
type DeleteStep = 'choose' | 'confirm-base' | 'confirm-translation'

const deleteModalOpen = ref(false)
const deleteStep = ref<DeleteStep>('choose')
const deleteEntity = ref<MockEntity | null>(null)
const deleteTranslationLang = ref<string | null>(null)

function openDeleteFlow(entity: MockEntity) {
  deleteEntity.value = entity
  deleteStep.value = 'choose'
  deleteTranslationLang.value = null
  deleteModalOpen.value = true
}

function chooseDeleteBase() {
  deleteStep.value = 'confirm-base'
}

function chooseDeleteTranslation(lang: string) {
  deleteTranslationLang.value = lang
  deleteStep.value = 'confirm-translation'
}

function goBackToChoice() {
  deleteStep.value = 'choose'
  deleteTranslationLang.value = null
}

function confirmDeleteBase() {
  if (!deleteEntity.value) return
  const name = deleteEntity.value.name
  entities.value = entities.value.filter(e => e.id !== deleteEntity.value!.id)
  deleteModalOpen.value = false
  toast.add({ title: `Deleted "${name}" and all related data`, color: 'success', icon: 'i-lucide-check' })
}

function confirmDeleteTranslation() {
  if (!deleteEntity.value || !deleteTranslationLang.value) return
  const lang = deleteTranslationLang.value
  const idx = entities.value.findIndex(e => e.id === deleteEntity.value!.id)
  if (idx !== -1) {
    const updated = { ...entities.value[idx] }
    updated.translations = updated.translations.map(t =>
      t.lang === lang ? { ...t, has_translation: false, is_fallback: true } : t
    )
    updated.editorial = computeEditorial(updated.status, updated.translations)
    entities.value[idx] = updated
  }
  deleteModalOpen.value = false
  toast.add({ title: `Deleted ${lang.toUpperCase()} translation`, color: 'success', icon: 'i-lucide-check' })
}

function deletableTranslations(entity: MockEntity) {
  return entity.translations.filter(t => t.lang !== 'en' && t.has_translation && !t.is_fallback)
}

function coverageOf(entity: MockEntity) {
  const cov = translationCoverage(entity.translations)
  return { current: cov.done, total: cov.total }
}

// Impact summary for base delete
const baseImpact = computed(() => {
  if (!deleteEntity.value) return []
  const e = deleteEntity.value
  const translatedLangs = e.translations.filter(t => t.has_translation).map(t => t.lang.toUpperCase())
  return [
    { label: 'Base entity', value: `${e.name} (#${e.code})`, removed: true },
    { label: 'Translations removed', value: translatedLangs.join(', ') || 'None', removed: translatedLangs.length > 0 },
    { label: 'editorial_state removed', value: e.editorial_state ? editorialStatusMeta(e.editorial_state.status).label : 'None', removed: !!e.editorial_state },
    { label: 'Tag associations removed', value: `${e.tags.length}`, removed: e.tags.length > 0 },
  ]
})

// Impact summary for translation delete
const translationImpact = computed(() => {
  if (!deleteEntity.value || !deleteTranslationLang.value) return []
  const lang = deleteTranslationLang.value.toUpperCase()
  return [
    { label: 'Base entity', value: deleteEntity.value.name, removed: false },
    { label: `${lang} translation`, value: 'Will be removed', removed: true },
    { label: 'Other translations', value: 'Not affected', removed: false },
    { label: 'editorial_state', value: 'Not affected', removed: false },
    { label: 'Fallback behavior', value: `${lang} fields will show English`, removed: false },
  ]
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-xl font-bold tracking-tight">
            Delete Preview
          </h1>
          <UBadge color="warning" variant="subtle" size="xs">
            P1
          </UBadge>
        </div>
        <p class="text-xs text-muted mt-1 ml-6">
          2-step delete: choose what to delete → impact summary table → confirm.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <USwitch
          v-model="isAuthenticated"
          :unchecked-icon="'i-lucide-lock'"
          :checked-icon="'i-lucide-unlock'"
          color="primary"
          aria-label="Toggle authentication simulation"
        />
        <span class="text-xs font-medium" :class="isAuthenticated ? 'text-primary' : 'text-muted'">
          {{ isAuthenticated ? 'Authenticated' : 'Guest' }}
        </span>
      </div>
    </div>

    <!-- 401 state -->
    <div v-if="!isAuthenticated" class="rounded-lg border border-default p-12 text-center">
      <UIcon name="i-lucide-shield-alert" class="text-4xl text-error mb-3" />
      <h2 class="text-lg font-semibold mb-1">
        401 Not Authenticated
      </h2>
      <p class="text-sm text-muted mb-4">
        Delete operations require authentication.
      </p>
      <UButton label="Simulate Login" icon="i-lucide-log-in" @click="isAuthenticated = true" />
    </div>

    <template v-else>
      <!-- Entity list -->
      <div class="space-y-2">
        <div
          v-for="entity in entities"
          :key="entity.id"
          class="flex items-center justify-between p-3 rounded-lg border border-default"
        >
          <div class="flex items-center gap-4">
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium">{{ entity.name }}</span>
              <span class="text-xs text-muted">#{{ entity.code }} &middot; {{ entity.entity_type }}</span>
            </div>
            <EntityEditorialIndicator
              :editorial-state="entity.editorial_state"
              :translation-coverage="coverageOf(entity)"
              compact
            />
          </div>
          <UButton
            label="Delete…"
            icon="i-lucide-trash-2"
            size="xs"
            color="error"
            variant="ghost"
            :aria-label="`Delete ${entity.name}`"
            @click="openDeleteFlow(entity)"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!entities.length" class="rounded-lg border border-dashed border-default p-8 text-center mt-4">
        <UIcon name="i-lucide-check-circle" class="text-3xl text-success mb-2" />
        <p class="text-sm text-muted">
          All entities deleted. Refresh to reset mock data.
        </p>
      </div>
    </template>

    <!-- Delete flow modal -->
    <UModal
      v-model:open="deleteModalOpen"
      :title="deleteStep === 'choose' ? 'What do you want to delete?' : deleteStep === 'confirm-base' ? 'Confirm: Delete Entity' : 'Confirm: Delete Translation'"
    >
      <template #body>
        <div v-if="deleteEntity">
          <!-- Step 1: Choose -->
          <div v-if="deleteStep === 'choose'" class="space-y-3">
            <p class="text-sm text-muted">
              Choose what to delete for <strong>{{ deleteEntity.name }}</strong>:
            </p>

            <button
              class="w-full text-left p-3 rounded-lg border border-default hover:border-error transition-colors focus-visible:outline-2 focus-visible:outline-error focus-visible:outline-offset-2"
              aria-label="Delete entire entity and all related data"
              @click="chooseDeleteBase"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-box" class="text-error mt-0.5 shrink-0" />
                <div>
                  <p class="text-sm font-medium">Delete entire entity</p>
                  <p class="text-xs text-muted mt-0.5">
                    Removes base entity, {{ deleteEntity.translations.filter(t => t.has_translation).length }} translations, editorial state, and {{ deleteEntity.tags.length }} tags.
                  </p>
                </div>
              </div>
            </button>

            <div v-if="deletableTranslations(deleteEntity).length">
              <p class="text-xs text-muted mb-2">Or delete a specific translation:</p>
              <div class="space-y-2">
                <button
                  v-for="t in deletableTranslations(deleteEntity)"
                  :key="t.lang"
                  class="w-full text-left p-3 rounded-lg border border-default hover:border-warning transition-colors focus-visible:outline-2 focus-visible:outline-warning focus-visible:outline-offset-2"
                  :aria-label="`Delete ${t.lang.toUpperCase()} translation only`"
                  @click="chooseDeleteTranslation(t.lang)"
                >
                  <div class="flex items-start gap-3">
                    <UIcon name="i-lucide-languages" class="text-warning mt-0.5 shrink-0" />
                    <div>
                      <p class="text-sm font-medium">Delete {{ t.lang.toUpperCase() }} translation</p>
                      <p class="text-xs text-muted mt-0.5">
                        Only {{ t.lang.toUpperCase() }} removed. Entity and other translations remain.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div v-else class="p-2 rounded bg-muted/20 border border-default">
              <p class="text-xs text-muted">No non-English translations to delete individually.</p>
            </div>
          </div>

          <!-- Step 2a: Confirm base delete with impact summary table -->
          <div v-else-if="deleteStep === 'confirm-base'" class="space-y-4">
            <button
              class="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
              aria-label="Go back to delete options"
              @click="goBackToChoice"
            >
              <UIcon name="i-lucide-arrow-left" class="text-xs" />
              Back to options
            </button>

            <!-- Impact summary table -->
            <div class="rounded-lg border border-error/30 overflow-hidden">
              <div class="px-3 py-2 bg-error/5 border-b border-error/20">
                <p class="text-xs font-medium text-error uppercase tracking-wider">
                  Deletion Impact Summary
                </p>
              </div>
              <table class="w-full text-sm" aria-label="Deletion impact summary">
                <tbody class="divide-y divide-default">
                  <tr v-for="row in baseImpact" :key="row.label">
                    <td class="px-3 py-2 text-xs text-muted w-44">{{ row.label }}</td>
                    <td class="px-3 py-2 text-xs font-medium">{{ row.value }}</td>
                    <td class="px-3 py-2 text-right">
                      <UBadge
                        :color="row.removed ? 'error' : 'success'"
                        variant="subtle"
                        size="xs"
                        :aria-label="`${row.label}: ${row.removed ? 'will be removed' : 'not affected'}`"
                      >
                        {{ row.removed ? 'REMOVED' : 'N/A' }}
                      </UBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="p-2 rounded bg-error/10 border border-error/20" role="alert">
              <p class="text-xs text-error font-medium">This action is irreversible.</p>
            </div>
          </div>

          <!-- Step 2b: Confirm translation delete with impact summary table -->
          <div v-else-if="deleteStep === 'confirm-translation'" class="space-y-4">
            <button
              class="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
              aria-label="Go back to delete options"
              @click="goBackToChoice"
            >
              <UIcon name="i-lucide-arrow-left" class="text-xs" />
              Back to options
            </button>

            <!-- Impact summary table -->
            <div class="rounded-lg border border-warning/30 overflow-hidden">
              <div class="px-3 py-2 bg-warning/5 border-b border-warning/20">
                <p class="text-xs font-medium text-warning uppercase tracking-wider">
                  Deletion Impact Summary
                </p>
              </div>
              <table class="w-full text-sm" aria-label="Translation deletion impact summary">
                <tbody class="divide-y divide-default">
                  <tr v-for="row in translationImpact" :key="row.label">
                    <td class="px-3 py-2 text-xs text-muted w-44">{{ row.label }}</td>
                    <td class="px-3 py-2 text-xs font-medium">{{ row.value }}</td>
                    <td class="px-3 py-2 text-right">
                      <UBadge
                        :color="row.removed ? 'warning' : 'neutral'"
                        :variant="row.removed ? 'subtle' : 'outline'"
                        size="xs"
                        :aria-label="`${row.label}: ${row.removed ? 'will be removed' : 'not affected'}`"
                      >
                        {{ row.removed ? 'REMOVED' : 'KEPT' }}
                      </UBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="outline" @click="deleteModalOpen = false" />
          <UButton
            v-if="deleteStep === 'confirm-base'"
            label="Delete Entity"
            color="error"
            icon="i-lucide-trash-2"
            @click="confirmDeleteBase"
          />
          <UButton
            v-if="deleteStep === 'confirm-translation'"
            :label="`Delete ${deleteTranslationLang?.toUpperCase()} Translation`"
            color="warning"
            icon="i-lucide-trash-2"
            @click="confirmDeleteTranslation"
          />
        </div>
      </template>
    </UModal>

    <!-- Integration notes -->
    <div class="mt-6 p-4 rounded-lg bg-muted/30 border border-default">
      <p class="text-xs text-muted leading-relaxed">
        <strong>Integration:</strong> Replace <code class="text-xs">useEntityDeletion</code>'s
        implicit locale-based logic with this 2-step flow.
        Step 1: always show choice (base vs translation).
        Step 2: impact summary table + confirm.
        Wire to <code class="text-xs">crud.remove()</code> for base,
        translation-specific endpoint for translations.
      </p>
    </div>
  </div>
</template>
