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
  type MockEntity,
  type EditorialStatus,
  type TranslationLangState,
} from '~/components/sketches/mockData'
import EntityEditorialIndicator from '~/components/sketches/EntityEditorialIndicator.vue'

definePageMeta({ layout: 'default' })

const toast = useToast()
const isAuthenticated = ref(true)

// --- Created entities ---
const createdEntities = ref<MockEntity[]>([])
let nextId = 100

// --- Create form ---
const createModalOpen = ref(false)
const form = reactive({ name: '', code: '', entity_type: 'base_card' })
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

// --- Slideover ---
const slideoverOpen = ref(false)
const slideoverEntity = ref<MockEntity | null>(null)
const translationForm = reactive({ name: '', description: '' })

function openCreate() {
  form.name = ''
  form.code = ''
  form.entity_type = 'base_card'
  formErrors.name = ''
  formErrors.code = ''
  createModalOpen.value = true
}

function validateAndSubmit() {
  formErrors.name = form.name.trim() ? '' : 'Name is required'
  formErrors.code = form.code.trim() ? '' : 'Code is required'
  if (formErrors.name || formErrors.code) return

  const translations: TranslationLangState[] = [
    { lang: 'en', has_translation: true, is_fallback: false },
    { lang: 'fr', has_translation: false, is_fallback: true },
    { lang: 'es', has_translation: false, is_fallback: true },
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
    editorial_state: { status, updated_by: 'current_user', updated_at: new Date().toISOString() },
    editorial: computeEditorial(status, translations),
    translations,
    tags: [],
    is_active: true,
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
  translationForm.name = ''
  translationForm.description = ''
  slideoverOpen.value = true
}

function simulateAddTranslation(entity: MockEntity, lang: string) {
  const idx = createdEntities.value.findIndex(e => e.id === entity.id)
  if (idx === -1) return
  const updated = { ...createdEntities.value[idx] }
  updated.translations = updated.translations.map(t =>
    t.lang === lang ? { ...t, has_translation: true, is_fallback: false } : t
  )
  updated.editorial = computeEditorial(updated.status, updated.translations)
  createdEntities.value[idx] = updated
  if (slideoverEntity.value?.id === entity.id) slideoverEntity.value = updated
  toast.add({ title: `${lang.toUpperCase()} translation saved`, color: 'success', icon: 'i-lucide-check' })
}

function coverageOf(entity: MockEntity) {
  const cov = translationCoverage(entity.translations)
  return { current: cov.done, total: cov.total }
}

const slideoverCoverage = computed(() => {
  if (!slideoverEntity.value) return null
  return coverageOf(slideoverEntity.value)
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-xl font-bold tracking-tight">
            Create Flow
          </h1>
          <UBadge color="warning" variant="subtle" size="xs">
            P1
          </UBadge>
        </div>
        <p class="text-xs text-muted mt-1 ml-6">
          English-first creation → toast with "Add Translations" → Slideover with translation form.
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
        Entity creation requires authentication.
      </p>
      <UButton label="Simulate Login" icon="i-lucide-log-in" @click="isAuthenticated = true" />
    </div>

    <template v-else>
      <!-- Create button -->
      <div class="mb-6">
        <UButton label="Create Entity" icon="i-lucide-plus" @click="openCreate" />
        <p class="text-xs text-muted mt-2">
          Creates in English. After creation, a toast offers to open the translation panel.
        </p>
      </div>

      <!-- Created entities list -->
      <div v-if="createdEntities.length" class="space-y-3 mb-6">
        <h2 class="text-sm font-semibold">
          Created Entities ({{ createdEntities.length }})
        </h2>
        <div
          v-for="entity in createdEntities"
          :key="entity.id"
          class="flex items-center justify-between p-3 rounded-lg border border-default"
        >
          <div class="flex flex-col gap-0.5">
            <span class="text-sm font-medium">{{ entity.name }}</span>
            <span class="text-xs text-muted">#{{ entity.code }} &middot; {{ entity.entity_type }}</span>
          </div>
          <div class="flex items-center gap-3">
            <EntityEditorialIndicator
              :editorial-state="entity.editorial_state"
              :translation-coverage="coverageOf(entity)"
            />
            <UButton
              label="Translations"
              icon="i-lucide-languages"
              size="xs"
              variant="soft"
              :aria-label="`Open translations for ${entity.name}`"
              @click="openTranslations(entity)"
            />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="rounded-lg border border-dashed border-default p-8 text-center">
        <UIcon name="i-lucide-package-open" class="text-3xl text-muted mb-2" />
        <p class="text-sm text-muted">
          No entities created yet. Click "Create Entity" to start the flow.
        </p>
      </div>
    </template>

    <!-- Create modal with UFormField -->
    <UModal
      v-model:open="createModalOpen"
      title="Create Entity"
      description="Create a new entity in English. You can add translations after creation."
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Name" required :error="formErrors.name || undefined" description="Display name (English)">
            <UInput
              v-model="form.name"
              placeholder="The Fool"
              autofocus
              class="w-full"
            />
          </UFormField>

          <UFormField label="Code" required :error="formErrors.code || undefined" description="Unique identifier (snake_case)">
            <UInput
              v-model="form.code"
              placeholder="the_fool"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Entity Type" description="Which domain entity to create">
            <USelect
              v-model="form.entity_type"
              :items="entityTypeOptions"
              class="w-full"
            />
          </UFormField>

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
          <UButton
            label="Create"
            icon="i-lucide-plus"
            :disabled="!form.name.trim() || !form.code.trim()"
            @click="validateAndSubmit"
          />
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
      <template #body>
        <div v-if="slideoverEntity" class="space-y-5">
          <!-- Coverage indicator -->
          <div class="p-3 rounded-lg bg-muted/20 border border-default">
            <p class="text-xs font-medium text-muted mb-2">
              Translation Coverage
            </p>
            <EntityEditorialIndicator
              :editorial-state="slideoverEntity.editorial_state"
              :translation-coverage="slideoverCoverage"
            />
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
                  <UBadge color="neutral" variant="outline" size="xs">
                    {{ t.lang.toUpperCase() }}
                  </UBadge>
                  <span class="text-xs font-medium">
                    {{ t.lang === 'en' ? 'English (base)' : t.lang === 'fr' ? 'French' : 'Spanish' }}
                  </span>
                </div>
                <UBadge
                  :color="t.has_translation && !t.is_fallback ? 'success' : 'warning'"
                  variant="soft"
                  size="xs"
                  :aria-label="`${t.lang.toUpperCase()}: ${t.has_translation && !t.is_fallback ? 'complete' : 'missing'}`"
                >
                  {{ t.has_translation && !t.is_fallback ? 'Complete' : 'Needs translation' }}
                </UBadge>
              </div>

              <!-- Translation form (mock) for missing languages -->
              <div v-if="!t.has_translation || t.is_fallback" class="p-3 space-y-3">
                <UFormField :label="`Name (${t.lang.toUpperCase()})`" :description="`English: ${slideoverEntity.name}`">
                  <UInput
                    v-model="translationForm.name"
                    :placeholder="`${slideoverEntity.name} in ${t.lang.toUpperCase()}`"
                    class="w-full"
                  />
                </UFormField>

                <UFormField :label="`Description (${t.lang.toUpperCase()})`" hint="Optional">
                  <UInput
                    v-model="translationForm.description"
                    placeholder="Short description"
                    class="w-full"
                  />
                </UFormField>

                <div class="flex justify-end">
                  <UButton
                    :label="`Save ${t.lang.toUpperCase()}`"
                    size="xs"
                    icon="i-lucide-check"
                    :aria-label="`Save ${t.lang.toUpperCase()} translation for ${slideoverEntity.name}`"
                    @click="simulateAddTranslation(slideoverEntity!, t.lang)"
                  />
                </div>
              </div>

              <!-- Already complete -->
              <div v-else class="p-3">
                <p class="text-xs text-muted">
                  Translation complete. Edit in the full entity editor.
                </p>
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
    <div class="mt-6 p-4 rounded-lg bg-muted/30 border border-default">
      <p class="text-xs text-muted leading-relaxed">
        <strong>Integration:</strong> After <code class="text-xs">FormModal</code> create success,
        use <code class="text-xs">toast.add()</code> with an action that emits
        <code class="text-xs">'open-slideover'</code> on the new entity ID.
        <code class="text-xs">EntityBase</code> catches this and opens
        <code class="text-xs">EntitySlideover</code> with translation section active.
        Use <code class="text-xs">UFormField</code> for all form fields.
      </p>
    </div>
  </div>
</template>
