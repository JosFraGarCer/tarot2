<!--
  /pages/sketches/create-flow.vue
  POC 4: Improved entity creation with post-create guidance

  OBJECTIVE:
  After creating an entity (English-first), guide the editor to add FR translation.
  Show translation completeness immediately via EntityEditorialIndicator.
  Toast with "Add FR translation?" action button.

  SUCCESS CRITERIA:
  - "Create entity + add FR translation" = 3 clicks (Create → toast action → Add FR)
  - Post-create toast offers "Add Translations" action
  - Slideover opens directly to translation section with mock form fields

  INTEGRATION INTO /manage:
  1. After FormModal create success, emit 'created' with entity ID
  2. EntityBase catches 'created', shows toast with action
  3. Toast action opens EntitySlideover on translation tab
  4. EntityEditorialIndicator shows coverage immediately
-->
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  computeEditorial,
  translationCoverage,
  avatarUrl,
  relativeTime,
  type MockEntity,
  type EditorialStatus,
  type TranslationLangState,
} from '~/components/sketches/mockData'
import EntityEditorialIndicator from '~/components/sketches/EntityEditorialIndicator.vue'
import SketchCrossNav from '~/components/sketches/SketchCrossNav.vue'

definePageMeta({ layout: 'default' })

const toast = useToast()
const isAuthenticated = ref(true)

// --- Created entities ---
const createdEntities = ref<MockEntity[]>([])
let nextId = 100

// --- Create form ---
const createModalOpen = ref(false)
const showOptionalFields = ref(false)
const form = reactive({ name: '', code: '', entity_type: 'base_card', short_text: '', description: '', image: '' })
const formErrors = reactive({ name: '', code: '' })

const entityTypeOptions = [
  { label: 'Base Card', value: 'base_card' },
  { label: 'Arcana', value: 'arcana' },
  { label: 'Facet', value: 'facet' },
  { label: 'World', value: 'world' },
  { label: 'Skill', value: 'skill' },
  { label: 'Card Type', value: 'base_card_type' },
  { label: 'World Card', value: 'world_card' },
]

// --- Preview ---
const previewOpen = ref(false)
const previewEntity = ref<MockEntity | null>(null)

// --- Slideover ---
const slideoverOpen = ref(false)
const slideoverEntity = ref<MockEntity | null>(null)
const translationForm = reactive({ name: '', short_text: '', description: '' })
const slideoverIndex = computed(() => {
  if (!slideoverEntity.value) return -1
  return createdEntities.value.findIndex(e => e.id === slideoverEntity.value!.id)
})
const hasPrev = computed(() => slideoverIndex.value > 0)
const hasNext = computed(() => slideoverIndex.value >= 0 && slideoverIndex.value < createdEntities.value.length - 1)
function navPrev() { if (hasPrev.value) { slideoverEntity.value = createdEntities.value[slideoverIndex.value - 1]!; resetTranslationForm() } }
function navNext() { if (hasNext.value) { slideoverEntity.value = createdEntities.value[slideoverIndex.value + 1]!; resetTranslationForm() } }
function resetTranslationForm() { translationForm.name = ''; translationForm.short_text = ''; translationForm.description = '' }

function openCreate() {
  form.name = ''
  form.code = ''
  form.entity_type = 'base_card'
  form.short_text = ''
  form.description = ''
  form.image = ''
  formErrors.name = ''
  formErrors.code = ''
  showOptionalFields.value = false
  createModalOpen.value = true
}

function validateAndSubmit() {
  formErrors.name = form.name.trim() ? '' : 'Name is required'
  formErrors.code = form.code.trim() ? '' : 'Code is required'
  if (formErrors.name || formErrors.code) return

  const translations: TranslationLangState[] = [
    { lang: 'en', has_translation: true, is_fallback: false, status: 'draft', updated_by: 'current_user', updated_at: new Date().toISOString() },
    { lang: 'fr', has_translation: false, is_fallback: true, status: null, updated_by: null, updated_at: null },
    { lang: 'es', has_translation: false, is_fallback: true, status: null, updated_by: null, updated_at: null },
  ]

  const status: EditorialStatus = 'draft'
  const newEntity: MockEntity = {
    id: nextId++,
    code: form.code.trim(),
    name: form.name.trim(),
    status,
    entity_type: form.entity_type,
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
    updated_by: 'current_user',
    created_by: 'current_user',
    editorial_state: { status, updated_by: 'current_user', updated_at: new Date().toISOString(), content_version_id: nextId },
    editorial: computeEditorial(status, translations),
    translations,
    tags: [],
    is_active: true,
    content_version_id: nextId,
    release_stage: 'dev',
    version_semver: '0.1.0',
    image: form.image || null,
    open_feedback_count: 0,
    world: null,
  }

  createdEntities.value.unshift(newEntity)
  createModalOpen.value = false

  toast.add({
    title: `Created "${newEntity.name}"`,
    description: 'Entity created in English (1/3 translations). Add FR?',
    color: 'success',
    icon: 'i-lucide-check-circle',
    duration: 8000,
    actions: [{
      label: 'Add Translations',
      color: 'primary' as const,
      variant: 'solid' as const,
      onClick: () => openTranslations(newEntity),
    }],
  })
}

function openTranslations(entity: MockEntity) {
  slideoverEntity.value = entity
  resetTranslationForm()
  slideoverOpen.value = true
}

function openPreview(entity: MockEntity) {
  previewEntity.value = entity
  previewOpen.value = true
}

function simulateAddTranslation(entity: MockEntity, lang: string) {
  const idx = createdEntities.value.findIndex(e => e.id === entity.id)
  if (idx === -1) return
  const source = createdEntities.value[idx]!
  const newTranslations = source.translations.map(t =>
    t.lang === lang ? { ...t, has_translation: true, is_fallback: false, status: 'draft' as const, updated_by: 'current_user', updated_at: new Date().toISOString() } : t
  )
  const updated: MockEntity = {
    ...source,
    translations: newTranslations,
    editorial: computeEditorial(source.status, newTranslations),
  }
  createdEntities.value[idx] = updated
  if (slideoverEntity.value?.id === entity.id) slideoverEntity.value = updated
  toast.add({ title: `${lang.toUpperCase()} translation saved`, color: 'success', icon: 'i-lucide-check' })
}

function coverageOf(entity: MockEntity) {
  const cov = translationCoverage(entity.translations)
  return { current: cov.done, total: cov.total }
}

const _slideoverCoverage = computed(() => {
  if (!slideoverEntity.value) return null
  return coverageOf(slideoverEntity.value)
})
</script>

<template>
  <div class="min-h-screen bg-default flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-default bg-default/95 backdrop-blur-sm">
      <div class="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
        <div class="flex items-center gap-3">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-lg font-bold tracking-tight">Create Flow</h1>
          <UBadge color="warning" variant="subtle" size="xs">P1</UBadge>
        </div>
        <div class="flex items-center gap-1.5">
          <USwitch v-model="isAuthenticated" size="xs" color="primary" aria-label="Toggle authentication" />
          <span class="text-[10px]" :class="isAuthenticated ? 'text-primary' : 'text-muted'">{{ isAuthenticated ? 'Auth' : 'Guest' }}</span>
        </div>
      </div>
    </header>

    <SketchCrossNav current-view="" />

    <!-- 401 state -->
    <div v-if="!isAuthenticated" class="flex-1 flex items-center justify-center">
      <div class="text-center p-12">
        <UIcon name="i-lucide-shield-alert" class="text-4xl text-error mb-3" />
        <h2 class="text-lg font-semibold mb-1">401 Not Authenticated</h2>
        <p class="text-sm text-muted mb-4">Entity creation requires authentication.</p>
        <UButton label="Simulate Login" icon="i-lucide-log-in" @click="isAuthenticated = true" />
      </div>
    </div>

    <template v-else>
      <div class="max-w-4xl mx-auto px-4 py-6 w-full flex-1">
        <!-- Create button -->
        <div class="mb-6">
          <UButton label="Create Entity" icon="i-lucide-plus" @click="openCreate" />
          <p class="text-xs text-muted mt-2">Creates in English. After creation, a toast offers to open the translation panel.</p>
        </div>

        <!-- Created entities list -->
        <div v-if="createdEntities.length" class="space-y-3 mb-6">
          <h2 class="text-sm font-semibold">Created Entities ({{ createdEntities.length }})</h2>
          <div
            v-for="entity in createdEntities"
            :key="entity.id"
            class="flex items-center justify-between p-3 rounded-lg border border-default"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-11 rounded bg-muted/30 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-image" class="text-muted text-xs" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm font-medium truncate">{{ entity.name }}</span>
                  <span class="text-[10px] text-muted tabular-nums">v{{ entity.version_semver }}</span>
                </div>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <UBadge color="neutral" variant="outline" size="xs">{{ entity.entity_type }}</UBadge>
                  <UBadge color="neutral" variant="subtle" size="xs">Base System</UBadge>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <EntityEditorialIndicator :editorial-state="entity.editorial_state" />
              <UButton icon="i-lucide-eye" size="xs" variant="ghost" color="neutral" :aria-label="`Preview ${entity.name}`" @click="openPreview(entity)" />
              <UButton label="Translations" icon="i-lucide-languages" size="xs" variant="soft" :aria-label="`Open translations for ${entity.name}`" @click="openTranslations(entity)" />
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="rounded-lg border border-dashed border-default p-8 text-center">
          <UIcon name="i-lucide-package-open" class="text-3xl text-muted mb-2" />
          <p class="text-sm text-muted">No entities created yet. Click "Create Entity" to start the flow.</p>
        </div>
      </div>
    </template>

    <!-- Preview modal -->
    <UModal v-model:open="previewOpen" role="dialog" aria-modal="true">
      <template #header>
        <span class="text-sm font-bold">{{ previewEntity?.name }}</span>
      </template>
      <template #body>
        <div v-if="previewEntity" class="space-y-3">
          <div class="flex items-center gap-2">
            <UBadge color="neutral" variant="outline" size="xs">{{ previewEntity.entity_type }}</UBadge>
            <UBadge color="neutral" variant="subtle" size="xs">Base System</UBadge>
            <UBadge color="neutral" variant="outline" size="xs">v{{ previewEntity.version_semver }}</UBadge>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-muted">
            <UAvatar :src="avatarUrl(previewEntity.created_by)" :alt="previewEntity.created_by" size="2xs" />
            <span>Created by <strong>{{ previewEntity.created_by }}</strong> · {{ relativeTime(previewEntity.created_at) }}</span>
          </div>
          <div class="text-xs text-muted">
            <span>Translations: {{ previewEntity.translations.filter(t => t.has_translation && !t.is_fallback).length }}/{{ previewEntity.translations.length }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end">
          <UButton label="Close" color="neutral" variant="outline" size="xs" @click="previewOpen = false" />
        </div>
      </template>
    </UModal>

    <!-- Create modal with UFormField -->
    <UModal
      v-model:open="createModalOpen"
      title="Create Entity"
      description="Create a new entity in English. You can add translations after creation."
      role="dialog"
      aria-modal="true"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Name" required :error="formErrors.name || undefined" description="Display name (English)">
            <UInput v-model="form.name" placeholder="The Fool" autofocus class="w-full" />
          </UFormField>

          <UFormField label="Code" required :error="formErrors.code || undefined" description="Unique identifier (snake_case)">
            <UInput v-model="form.code" placeholder="the_fool" class="w-full" />
          </UFormField>

          <UFormField label="Entity Type" description="Which domain entity to create">
            <USelect v-model="form.entity_type" :items="entityTypeOptions" class="w-full" />
          </UFormField>

          <!-- Optional fields (collapsible) -->
          <button
            class="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors w-full"
            @click="showOptionalFields = !showOptionalFields"
          >
            <UIcon :name="showOptionalFields ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="text-xs" />
            Optional fields (short text, description, image)
          </button>

          <template v-if="showOptionalFields">
            <UFormField label="Short Text" hint="Optional" description="Brief tagline or subtitle">
              <UInput v-model="form.short_text" placeholder="The journey begins..." class="w-full" />
            </UFormField>

            <UFormField label="Description" hint="Optional" description="Longer description or lore text">
              <UTextarea v-model="form.description" placeholder="A card representing new beginnings..." class="w-full" :rows="3" />
            </UFormField>

            <UFormField label="Image URL" hint="Optional" description="Card image (can be set later in Image System)">
              <UInput v-model="form.image" placeholder="https://..." class="w-full" />
            </UFormField>
          </template>

          <div class="p-2 rounded bg-muted/20 border border-default">
            <p class="text-xs text-muted">
              <UIcon name="i-lucide-info" class="inline-block mr-1" />
              Entity will be created in <strong>English</strong>. FR and ES translations can be added immediately after.
            </p>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="outline" @click="createModalOpen = false" />
          <UButton label="Create" icon="i-lucide-plus" :disabled="!form.name.trim() || !form.code.trim()" @click="validateAndSubmit" />
        </div>
      </template>
    </UModal>

    <!-- Translation slideover -->
    <USlideover
      v-model:open="slideoverOpen"
      :title="slideoverEntity ? `Translations: ${slideoverEntity.name}` : 'Translations'"
      :description="slideoverEntity ? `#${slideoverEntity.code} — ${slideoverEntity.entity_type}` : ''"
      side="right"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm">{{ slideoverEntity?.name }}</span>
            <UBadge color="neutral" variant="outline" size="xs">{{ slideoverEntity?.entity_type }}</UBadge>
          </div>
          <div class="flex items-center gap-1">
            <UButton icon="i-lucide-eye" size="xs" variant="ghost" color="neutral" aria-label="Preview" @click="slideoverEntity && openPreview(slideoverEntity)" />
            <UButton icon="i-lucide-chevron-left" size="xs" variant="ghost" color="neutral" :disabled="!hasPrev" aria-label="Previous" @click="navPrev" />
            <span class="text-[10px] text-muted tabular-nums">{{ slideoverIndex + 1 }}/{{ createdEntities.length }}</span>
            <UButton icon="i-lucide-chevron-right" size="xs" variant="ghost" color="neutral" :disabled="!hasNext" aria-label="Next" @click="navNext" />
          </div>
        </div>
      </template>

      <template #body>
        <div v-if="slideoverEntity" class="space-y-5">
          <!-- Coverage indicator -->
          <div class="p-3 rounded-lg bg-muted/20 border border-default">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-muted">Translation Coverage</p>
              <span class="text-xs tabular-nums">{{ slideoverEntity.translations.filter(t => t.has_translation && !t.is_fallback).length }}/{{ slideoverEntity.translations.length }}</span>
            </div>
          </div>

          <!-- Per-language rows -->
          <div class="space-y-3">
            <div
              v-for="t in slideoverEntity.translations"
              :key="t.lang"
              class="rounded-lg border border-default overflow-hidden"
            >
              <!-- Language header -->
              <div class="flex items-center justify-between px-3 py-2 bg-muted/10 border-b border-default">
                <div class="flex items-center gap-2">
                  <UBadge color="neutral" variant="outline" size="xs">{{ t.lang.toUpperCase() }}</UBadge>
                  <span class="text-xs font-medium">{{ t.lang === 'en' ? 'English (base)' : t.lang === 'fr' ? 'French' : 'Spanish' }}</span>
                </div>
                <UBadge :color="t.has_translation && !t.is_fallback ? 'success' : 'warning'" variant="soft" size="xs">
                  {{ t.has_translation && !t.is_fallback ? 'Complete' : 'Needs translation' }}
                </UBadge>
              </div>

              <!-- Translation form for missing languages — replicates exactly the same fields as base -->
              <div v-if="!t.has_translation || t.is_fallback" class="p-3 space-y-3">
                <UFormField :label="`Name (${t.lang.toUpperCase()})`" required :description="`English: ${slideoverEntity.name}`">
                  <UInput v-model="translationForm.name" :placeholder="`${slideoverEntity.name} in ${t.lang.toUpperCase()}`" class="w-full" />
                </UFormField>

                <UFormField :label="`Short Text (${t.lang.toUpperCase()})`" hint="Optional" description="Must match base field">
                  <UInput v-model="translationForm.short_text" placeholder="Brief tagline" class="w-full" />
                </UFormField>

                <UFormField :label="`Description (${t.lang.toUpperCase()})`" hint="Optional" description="Must match base field">
                  <UTextarea v-model="translationForm.description" placeholder="Description" class="w-full" :rows="2" />
                </UFormField>

                <div class="p-2 rounded bg-muted/10 border border-default">
                  <p class="text-[10px] text-muted"><UIcon name="i-lucide-info" class="inline-block mr-0.5" /> Translation fields must match base entity fields exactly. Fields not present in base cannot be translated.</p>
                </div>

                <div class="flex justify-end">
                  <UButton :label="`Save ${t.lang.toUpperCase()}`" size="xs" icon="i-lucide-check" @click="simulateAddTranslation(slideoverEntity!, t.lang)" />
                </div>
              </div>

              <!-- Already complete -->
              <div v-else class="p-3">
                <p class="text-xs text-muted">Translation complete. Edit in the full entity editor.</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end">
          <UButton label="Done" @click="slideoverOpen = false" />
        </div>
      </template>
    </USlideover>

    <!-- Integration notes -->
    <div class="mt-6 max-w-4xl mx-auto px-4 pb-6">
      <div class="p-4 rounded-lg bg-muted/30 border border-default">
        <p class="text-xs text-muted leading-relaxed">
          <strong>Integration:</strong> After <code class="text-xs">FormModal</code> create success,
          use <code class="text-xs">toast.add()</code> with action to open <code class="text-xs">EntitySlideover</code>.
          Translation form must replicate exactly the same translatable fields as the base entity.
          Optional fields (short_text, description, image) should be collapsible in create modal.
        </p>
      </div>
    </div>
  </div>
</template>
