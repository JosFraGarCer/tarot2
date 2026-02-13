<!--
  /pages/sketches/image-system.vue
  POC 9: Image upload, gallery, versioning prototype

  OBJECTIVE:
  Prototype how card images are uploaded, previewed, versioned and selected.
  Clean dark theme with subtle fantasy aesthetic.

  SECTIONS:
  1. Image Upload — drag & drop, preview, replace, remove, metadata
  2. Image Gallery — grid, filter by entity type, select for card, mark primary
  3. Image Versioning — history, revert, side-by-side compare

  SUCCESS CRITERIA:
  - Drag & drop upload works (mock)
  - Gallery grid is visually appealing (dark, fantasy vibes)
  - Version history shows timestamps and allows revert
  - Side-by-side comparison is clear
  - All interactions are accessible

  INTEGRATION INTO /manage:
  1. Upload component → EntitySlideover image section
  2. Gallery → new /manage/gallery route or modal picker
  3. Versioning → EntitySlideover image history tab
  4. entity.image_url field updated on select/upload
  5. editorial_state changes do NOT affect image directly
  6. Connect to useImageUpload composable
-->
<script setup lang="ts">
import { ref, computed, reactive } from 'vue'

definePageMeta({ layout: 'default' })

const toast = useToast()

// --- Types ---
interface MockImage {
  id: number
  url: string
  filename: string
  size: string
  ratio: string
  uploaded_by: string
  uploaded_at: string
  entity_type: string
  entity_name: string
  is_primary: boolean
  version: number
}

interface ImageVersion {
  version: number
  url: string
  uploaded_by: string
  uploaded_at: string
  size: string
}

// --- Mock gallery images ---
const ENTITY_TYPES = ['base_card', 'arcana', 'facet', 'world', 'skill']
const CARD_NAMES = ['The Fool', 'The Magician', 'High Priestess', 'The Empress', 'The Emperor', 'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit', 'Wheel of Fortune', 'Justice']
const UPLOADERS = ['alice', 'bob', 'carol', 'dave']

function generateMockImages(count: number): MockImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    url: `https://picsum.photos/seed/tarot${i}/400/600`,
    filename: `card_${i + 1}.webp`,
    size: `${Math.floor(Math.random() * 500 + 100)}KB`,
    ratio: '2:3',
    uploaded_by: UPLOADERS[i % UPLOADERS.length],
    uploaded_at: new Date(Date.now() - i * 86400000 * Math.random() * 30).toISOString(),
    entity_type: ENTITY_TYPES[i % ENTITY_TYPES.length],
    entity_name: CARD_NAMES[i % CARD_NAMES.length],
    is_primary: i % 4 === 0,
    version: Math.floor(Math.random() * 3) + 1,
  }))
}

const galleryImages = ref<MockImage[]>(generateMockImages(12))

// --- Mock version history for selected image ---
function generateVersionHistory(image: MockImage): ImageVersion[] {
  return Array.from({ length: image.version }, (_, i) => ({
    version: i + 1,
    url: `https://picsum.photos/seed/tarot${image.id}v${i}/400/600`,
    uploaded_by: UPLOADERS[(image.id + i) % UPLOADERS.length],
    uploaded_at: new Date(Date.now() - (image.version - i) * 86400000 * 7).toISOString(),
    size: `${Math.floor(Math.random() * 500 + 100)}KB`,
  }))
}

// --- Active section ---
type ActiveSection = 'upload' | 'gallery' | 'versioning'
const activeSection = ref<ActiveSection>('upload')

const sectionTabs = [
  { value: 'upload', label: 'Upload', icon: 'i-lucide-upload' },
  { value: 'gallery', label: 'Gallery', icon: 'i-lucide-grid-3x3' },
  { value: 'versioning', label: 'Versioning', icon: 'i-lucide-history' },
]

// --- Upload section ---
const uploadState = reactive({
  isDragging: false,
  previewUrl: null as string | null,
  filename: '',
  metadata: null as { size: string; ratio: string; uploaded_by: string } | null,
})

function simulateUpload() {
  const seed = Date.now()
  uploadState.previewUrl = `https://picsum.photos/seed/${seed}/400/600`
  uploadState.filename = `upload_${seed}.webp`
  uploadState.metadata = {
    size: `${Math.floor(Math.random() * 500 + 200)}KB`,
    ratio: '2:3',
    uploaded_by: 'current_user',
  }
  toast.add({ title: 'Image uploaded', description: uploadState.filename, color: 'success', icon: 'i-lucide-image' })
}

function replaceUpload() {
  simulateUpload()
  toast.add({ title: 'Image replaced', color: 'neutral', icon: 'i-lucide-refresh-cw' })
}

function removeUpload() {
  uploadState.previewUrl = null
  uploadState.filename = ''
  uploadState.metadata = null
  toast.add({ title: 'Image removed', color: 'neutral', icon: 'i-lucide-image-off' })
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  uploadState.isDragging = true
}

function onDragLeave() {
  uploadState.isDragging = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  uploadState.isDragging = false
  simulateUpload()
}

// --- Gallery section ---
const galleryFilter = ref<string>('')
const galleryEntityTypes = computed(() => {
  const types = new Set(galleryImages.value.map(i => i.entity_type))
  return [{ label: 'All types', value: '' }, ...Array.from(types).map(t => ({ label: t, value: t }))]
})

const filteredGallery = computed(() => {
  if (!galleryFilter.value) return galleryImages.value
  return galleryImages.value.filter(i => i.entity_type === galleryFilter.value)
})

const selectedImage = ref<MockImage | null>(null)

function selectImage(image: MockImage) {
  selectedImage.value = image
  toast.add({ title: `Selected: ${image.entity_name}`, description: image.filename, color: 'primary', icon: 'i-lucide-check' })
}

function togglePrimary(image: MockImage) {
  const idx = galleryImages.value.findIndex(i => i.id === image.id)
  if (idx === -1) return
  // Unmark all others of same entity
  galleryImages.value.forEach((img, j) => {
    if (img.entity_name === image.entity_name) {
      galleryImages.value[j] = { ...img, is_primary: img.id === image.id ? !img.is_primary : false }
    }
  })
  toast.add({ title: image.is_primary ? 'Unmarked as primary' : 'Marked as primary', color: 'success', icon: 'i-lucide-star' })
}

// --- Versioning section ---
const versioningImage = ref<MockImage | null>(null)
const versionHistory = ref<ImageVersion[]>([])
const compareMode = ref(false)
const compareVersionA = ref<ImageVersion | null>(null)
const compareVersionB = ref<ImageVersion | null>(null)

function openVersioning(image: MockImage) {
  versioningImage.value = image
  versionHistory.value = generateVersionHistory(image)
  compareMode.value = false
  compareVersionA.value = null
  compareVersionB.value = null
  activeSection.value = 'versioning'
}

function revertToVersion(version: ImageVersion) {
  if (!versioningImage.value) return
  const idx = galleryImages.value.findIndex(i => i.id === versioningImage.value!.id)
  if (idx !== -1) {
    galleryImages.value[idx] = {
      ...galleryImages.value[idx],
      url: version.url,
      version: version.version,
    }
  }
  toast.add({ title: `Reverted to v${version.version}`, color: 'success', icon: 'i-lucide-undo-2' })
}

function startCompare() {
  if (versionHistory.value.length < 2) return
  compareMode.value = true
  compareVersionA.value = versionHistory.value[versionHistory.value.length - 1]
  compareVersionB.value = versionHistory.value[versionHistory.value.length - 2]
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
          <h1 class="text-lg font-bold tracking-tight">Image System</h1>
          <UBadge color="primary" variant="subtle" size="xs">Studio</UBadge>
        </div>

        <!-- Section tabs -->
        <div class="flex items-center rounded-md border border-default overflow-hidden">
          <button
            v-for="tab in sectionTabs"
            :key="tab.value"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
            :class="activeSection === tab.value ? 'bg-primary text-white' : 'text-muted hover:text-primary'"
            :aria-label="tab.label"
            :aria-pressed="activeSection === tab.value"
            @click="activeSection = tab.value as ActiveSection"
          >
            <UIcon :name="tab.icon" class="text-sm" />
            {{ tab.label }}
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 p-6 max-w-6xl mx-auto w-full">
      <!-- ===== UPLOAD SECTION ===== -->
      <div v-if="activeSection === 'upload'" class="space-y-6">
        <div>
          <h2 class="text-sm font-semibold mb-1">Image Upload</h2>
          <p class="text-xs text-muted">Drag & drop or click to upload a card image.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Drop zone -->
          <div
            class="relative rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center min-h-80"
            :class="uploadState.isDragging ? 'border-primary bg-primary/5' : uploadState.previewUrl ? 'border-default' : 'border-default hover:border-primary/40'"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <!-- Preview -->
            <template v-if="uploadState.previewUrl">
              <img
                :src="uploadState.previewUrl"
                :alt="uploadState.filename"
                class="w-full h-full object-contain rounded-lg max-h-96"
              >
              <!-- Overlay actions -->
              <div class="absolute bottom-3 right-3 flex gap-1.5">
                <UButton
                  icon="i-lucide-refresh-cw"
                  size="xs"
                  variant="solid"
                  color="neutral"
                  aria-label="Replace image"
                  @click="replaceUpload"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  size="xs"
                  variant="solid"
                  color="error"
                  aria-label="Remove image"
                  @click="removeUpload"
                />
              </div>
            </template>

            <!-- Empty state -->
            <template v-else>
              <UIcon name="i-lucide-image-plus" class="text-5xl text-muted/40 mb-3" />
              <p class="text-sm text-muted mb-1">Drop image here</p>
              <p class="text-xs text-muted/60 mb-4">or click to browse</p>
              <UButton
                label="Choose File"
                icon="i-lucide-upload"
                size="sm"
                variant="soft"
                aria-label="Choose image file to upload"
                @click="simulateUpload"
              />
            </template>
          </div>

          <!-- Metadata panel -->
          <div class="space-y-4">
            <div class="rounded-xl border border-default p-4 space-y-3">
              <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Image Metadata</h3>

              <template v-if="uploadState.metadata">
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted">Filename</span>
                    <span class="font-medium font-mono">{{ uploadState.filename }}</span>
                  </div>
                  <USeparator />
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted">Size</span>
                    <span class="font-medium">{{ uploadState.metadata.size }}</span>
                  </div>
                  <USeparator />
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted">Aspect Ratio</span>
                    <UBadge color="neutral" variant="outline" size="xs">{{ uploadState.metadata.ratio }}</UBadge>
                  </div>
                  <USeparator />
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted">Uploaded by</span>
                    <span class="font-medium">{{ uploadState.metadata.uploaded_by }}</span>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="py-6 text-center">
                  <UIcon name="i-lucide-image-off" class="text-2xl text-muted/30 mb-2" />
                  <p class="text-xs text-muted/60">No image uploaded yet</p>
                </div>
              </template>
            </div>

            <!-- Guidelines -->
            <div class="rounded-xl border border-default p-4 bg-muted/5">
              <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Guidelines</h3>
              <ul class="space-y-1.5 text-xs text-muted">
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="text-success shrink-0 mt-0.5" />
                  <span>Recommended ratio: 2:3 (tarot standard)</span>
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="text-success shrink-0 mt-0.5" />
                  <span>Max size: 5MB, formats: WebP, PNG, JPG</span>
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="text-success shrink-0 mt-0.5" />
                  <span>Min resolution: 800×1200px</span>
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-info" class="text-primary shrink-0 mt-0.5" />
                  <span>Editorial state changes do not affect images</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== GALLERY SECTION ===== -->
      <div v-if="activeSection === 'gallery'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold mb-1">Image Gallery</h2>
            <p class="text-xs text-muted">{{ filteredGallery.length }} images</p>
          </div>
          <div class="flex items-center gap-3">
            <USelect
              :model-value="galleryFilter"
              :items="galleryEntityTypes"
              placeholder="All types"
              size="xs"
              class="w-36"
              aria-label="Filter gallery by entity type"
              @update:model-value="galleryFilter = $event"
            />
          </div>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="image in filteredGallery"
            :key="image.id"
            class="group relative rounded-xl border border-default overflow-hidden cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg"
            :class="{ 'ring-2 ring-primary': selectedImage?.id === image.id }"
            role="button"
            :aria-label="`Select image: ${image.entity_name}`"
            tabindex="0"
            @click="selectImage(image)"
            @keydown.enter="selectImage(image)"
          >
            <!-- Image -->
            <div class="relative" style="aspect-ratio: 2 / 3;">
              <img
                :src="image.url"
                :alt="`${image.entity_name} card image`"
                class="w-full h-full object-cover"
                loading="lazy"
              >

              <!-- Primary star -->
              <button
                class="absolute top-2 right-2 p-1 rounded-full transition-colors"
                :class="image.is_primary ? 'bg-warning/90 text-white' : 'bg-black/40 text-white/60 opacity-0 group-hover:opacity-100'"
                :aria-label="image.is_primary ? 'Unmark as primary' : 'Mark as primary'"
                @click.stop="togglePrimary(image)"
              >
                <UIcon :name="image.is_primary ? 'i-lucide-star' : 'i-lucide-star'" class="text-sm" />
              </button>

              <!-- Version badge -->
              <div class="absolute top-2 left-2">
                <button
                  class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/50 text-white/80 hover:bg-black/70 transition-colors"
                  :aria-label="`View version history for ${image.entity_name}`"
                  @click.stop="openVersioning(image)"
                >
                  v{{ image.version }}
                </button>
              </div>

              <!-- Selected overlay -->
              <div
                v-if="selectedImage?.id === image.id"
                class="absolute inset-0 bg-primary/20 flex items-center justify-center"
              >
                <UIcon name="i-lucide-check-circle" class="text-3xl text-white drop-shadow-lg" />
              </div>
            </div>

            <!-- Info -->
            <div class="p-2.5 space-y-1">
              <p class="text-xs font-medium truncate">{{ image.entity_name }}</p>
              <div class="flex items-center justify-between">
                <UBadge color="neutral" variant="outline" size="xs">{{ image.entity_type }}</UBadge>
                <span class="text-[10px] text-muted">{{ image.size }}</span>
              </div>
              <p class="text-[10px] text-muted">{{ image.uploaded_by }} · {{ new Date(image.uploaded_at).toLocaleDateString() }}</p>
            </div>
          </div>
        </div>

        <!-- Empty gallery -->
        <div v-if="!filteredGallery.length" class="rounded-xl border border-dashed border-default p-12 text-center">
          <UIcon name="i-lucide-image-off" class="text-4xl text-muted/30 mb-3" />
          <p class="text-sm text-muted">No images match the current filter.</p>
        </div>
      </div>

      <!-- ===== VERSIONING SECTION ===== -->
      <div v-if="activeSection === 'versioning'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold mb-1">Image Versioning</h2>
            <p class="text-xs text-muted">
              {{ versioningImage ? `${versioningImage.entity_name} — ${versionHistory.length} versions` : 'Select an image from the gallery to view its history' }}
            </p>
          </div>
          <div v-if="versioningImage && versionHistory.length >= 2" class="flex gap-2">
            <UButton
              :label="compareMode ? 'Exit Compare' : 'Compare Versions'"
              :icon="compareMode ? 'i-lucide-x' : 'i-lucide-columns-2'"
              size="xs"
              :variant="compareMode ? 'solid' : 'soft'"
              :color="compareMode ? 'error' : 'primary'"
              aria-label="Toggle version comparison mode"
              @click="compareMode ? compareMode = false : startCompare()"
            />
          </div>
        </div>

        <!-- No image selected -->
        <div v-if="!versioningImage" class="rounded-xl border border-dashed border-default p-12 text-center">
          <UIcon name="i-lucide-history" class="text-4xl text-muted/30 mb-3" />
          <p class="text-sm text-muted mb-3">No image selected for versioning.</p>
          <UButton
            label="Go to Gallery"
            icon="i-lucide-grid-3x3"
            size="sm"
            variant="soft"
            @click="activeSection = 'gallery'"
          />
        </div>

        <!-- Compare mode -->
        <div v-else-if="compareMode && compareVersionA && compareVersionB" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- Version A -->
            <div class="rounded-xl border border-default overflow-hidden">
              <div class="px-3 py-2 bg-muted/10 border-b border-default flex items-center justify-between">
                <span class="text-xs font-medium">Version {{ compareVersionA.version }}</span>
                <span class="text-[10px] text-muted">{{ new Date(compareVersionA.uploaded_at).toLocaleDateString() }}</span>
              </div>
              <div style="aspect-ratio: 2 / 3;">
                <img
                  :src="compareVersionA.url"
                  :alt="`Version ${compareVersionA.version}`"
                  class="w-full h-full object-cover"
                >
              </div>
              <div class="px-3 py-2 text-xs text-muted">
                {{ compareVersionA.uploaded_by }} · {{ compareVersionA.size }}
              </div>
            </div>

            <!-- Version B -->
            <div class="rounded-xl border border-default overflow-hidden">
              <div class="px-3 py-2 bg-muted/10 border-b border-default flex items-center justify-between">
                <span class="text-xs font-medium">Version {{ compareVersionB.version }}</span>
                <span class="text-[10px] text-muted">{{ new Date(compareVersionB.uploaded_at).toLocaleDateString() }}</span>
              </div>
              <div style="aspect-ratio: 2 / 3;">
                <img
                  :src="compareVersionB.url"
                  :alt="`Version ${compareVersionB.version}`"
                  class="w-full h-full object-cover"
                >
              </div>
              <div class="px-3 py-2 text-xs text-muted">
                {{ compareVersionB.uploaded_by }} · {{ compareVersionB.size }}
              </div>
            </div>
          </div>

          <!-- Version selectors -->
          <div class="flex items-center justify-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted">Left:</span>
              <div class="flex gap-1">
                <button
                  v-for="v in versionHistory"
                  :key="`a-${v.version}`"
                  class="px-2 py-1 rounded text-xs transition-colors"
                  :class="compareVersionA?.version === v.version ? 'bg-primary text-white' : 'bg-muted/20 text-muted hover:text-primary'"
                  :aria-label="`Compare left: version ${v.version}`"
                  @click="compareVersionA = v"
                >
                  v{{ v.version }}
                </button>
              </div>
            </div>
            <UIcon name="i-lucide-arrow-left-right" class="text-muted" />
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted">Right:</span>
              <div class="flex gap-1">
                <button
                  v-for="v in versionHistory"
                  :key="`b-${v.version}`"
                  class="px-2 py-1 rounded text-xs transition-colors"
                  :class="compareVersionB?.version === v.version ? 'bg-primary text-white' : 'bg-muted/20 text-muted hover:text-primary'"
                  :aria-label="`Compare right: version ${v.version}`"
                  @click="compareVersionB = v"
                >
                  v{{ v.version }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Version list -->
        <div v-else-if="versioningImage" class="space-y-4">
          <!-- Current image -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="rounded-xl border border-default overflow-hidden">
              <div style="aspect-ratio: 2 / 3;">
                <img
                  :src="versioningImage.url"
                  :alt="`Current version of ${versioningImage.entity_name}`"
                  class="w-full h-full object-cover"
                >
              </div>
              <div class="p-3">
                <p class="text-xs font-medium">{{ versioningImage.entity_name }}</p>
                <p class="text-[10px] text-muted">Current: v{{ versioningImage.version }}</p>
              </div>
            </div>

            <!-- Version timeline -->
            <div class="md:col-span-2 space-y-3">
              <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Version History</h3>
              <div
                v-for="(v, idx) in versionHistory"
                :key="v.version"
                class="flex items-center gap-4 p-3 rounded-lg border border-default transition-colors hover:border-primary/30"
                :class="{ 'bg-primary/5 border-primary/30': v.version === versioningImage.version }"
              >
                <!-- Timeline dot -->
                <div class="flex flex-col items-center gap-1 shrink-0">
                  <div
                    class="w-3 h-3 rounded-full border-2"
                    :class="v.version === versioningImage.version ? 'border-primary bg-primary' : 'border-default bg-muted/20'"
                  />
                  <div v-if="idx < versionHistory.length - 1" class="w-px h-6 bg-default" />
                </div>

                <!-- Thumbnail -->
                <img
                  :src="v.url"
                  :alt="`Version ${v.version}`"
                  class="w-10 h-14 rounded object-cover shrink-0 bg-muted/20"
                  loading="lazy"
                >

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-medium">Version {{ v.version }}</span>
                    <UBadge
                      v-if="v.version === versioningImage.version"
                      color="primary"
                      variant="soft"
                      size="xs"
                    >
                      Current
                    </UBadge>
                  </div>
                  <p class="text-[10px] text-muted mt-0.5">
                    {{ v.uploaded_by }} · {{ new Date(v.uploaded_at).toLocaleDateString() }} · {{ v.size }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex gap-1 shrink-0">
                  <UButton
                    v-if="v.version !== versioningImage.version"
                    label="Revert"
                    icon="i-lucide-undo-2"
                    size="xs"
                    variant="ghost"
                    color="primary"
                    :aria-label="`Revert to version ${v.version}`"
                    @click="revertToVersion(v)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Integration notes -->
    <div class="border-t border-default p-4 bg-muted/10">
      <p class="text-xs text-muted text-center max-w-3xl mx-auto leading-relaxed">
        <strong>Integration:</strong> Upload component → <code class="text-xs">EntitySlideover</code> image section.
        Gallery → <code class="text-xs">/manage/gallery</code> route or modal picker.
        Versioning → image history tab. Connect to <code class="text-xs">useImageUpload</code>.
        Entity <code class="text-xs">image_url</code> field updated on select/upload.
        Editorial state changes do not affect images.
      </p>
    </div>
  </div>
</template>
