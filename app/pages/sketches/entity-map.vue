<!--
  /pages/sketches/entity-map.vue
  POC 12: Entity relationship graph visualization

  OBJECTIVE:
  Visualize relationships between base_card, world_card, facet, arcana, skill
  using a lightweight SVG node graph. Click to highlight, hover for summary,
  toggle relationship types.

  SUCCESS CRITERIA:
  - Clear node graph with labeled nodes and edges
  - Click node → highlight connected nodes + edges
  - Hover → show entity summary tooltip
  - Toggle relationship types on/off
  - Dark theme, clear labels
  - No heavy external libraries (pure SVG)

  INTEGRATION INTO /manage:
  1. New route: /manage/map or tab in dashboard
  2. Nodes fetched from entity list endpoints
  3. Relations fetched from /api/relations or derived from FK fields:
     - world_card belongs_to world (via world_id)
     - world_card references base_card (via base_card_id)
     - base_card has_many facets (via facet assignments)
     - base_card belongs_to arcana (via arcana_id)
     - base_card has_many skills (via skill assignments)
  4. Click node navigates to /manage/:entity/:id or opens EntitySlideover
  5. Filter by world, arcana, entity type
  6. Could use a force-directed layout library in production (e.g. d3-force)
     but this sketch uses a static circular layout for simplicity
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  editorialStatusMeta,
  releaseStageDot,
  releaseStageLabel,
  type EditorialStatus,
  type ReleaseStage,
} from '~/components/sketches/mockData'
import SketchCrossNav from '~/components/sketches/SketchCrossNav.vue'

definePageMeta({ layout: 'default' })

const toast = useToast()

// --- Types ---
interface GraphNode {
  id: string
  label: string
  type: 'base_card' | 'world_card' | 'facet' | 'arcana' | 'skill' | 'world'
  status: EditorialStatus
  x: number
  y: number
  description: string
  version_semver: string | null
  release_stage: ReleaseStage | null
  blockers: string[]
  translationHealth: 'complete' | 'partial' | 'none'
}

interface GraphEdge {
  from: string
  to: string
  relation: string
  type: 'belongs_to' | 'has_many' | 'references'
}

// --- Node type colors ---
const nodeTypeColors: Record<string, { fill: string; stroke: string; text: string }> = {
  base_card: { fill: '#7c3aed', stroke: '#a78bfa', text: '#e9d5ff' },
  world_card: { fill: '#2563eb', stroke: '#60a5fa', text: '#dbeafe' },
  facet: { fill: '#059669', stroke: '#34d399', text: '#d1fae5' },
  arcana: { fill: '#d97706', stroke: '#fbbf24', text: '#fef3c7' },
  skill: { fill: '#dc2626', stroke: '#f87171', text: '#fee2e2' },
  world: { fill: '#0891b2', stroke: '#22d3ee', text: '#cffafe' },
}

// --- Mock graph data (static circular layout) ---
const SVG_W = 900
const SVG_H = 650
const CX = SVG_W / 2
const CY = SVG_H / 2

function circlePos(index: number, total: number, radius: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) }
}

const outerNodes: Omit<GraphNode, 'x' | 'y'>[] = [
  { id: 'bc1', label: 'The Fool', type: 'base_card', status: 'published', description: 'Major Arcana 0. Journey begins.', version_semver: '2.0.0', release_stage: 'release', blockers: [], translationHealth: 'complete' },
  { id: 'bc2', label: 'The Magician', type: 'base_card', status: 'approved', description: 'Major Arcana 1. Manifestation.', version_semver: '1.3.0', release_stage: 'candidate', blockers: [], translationHealth: 'complete' },
  { id: 'bc3', label: 'High Priestess', type: 'base_card', status: 'review', description: 'Major Arcana 2. Intuition.', version_semver: '1.1.0', release_stage: 'beta', blockers: ['Missing translations: FR'], translationHealth: 'partial' },
  { id: 'wc1', label: 'Fool of Ether', type: 'world_card', status: 'draft', description: 'The Fool in the Ethereal Realm.', version_semver: '0.1.0', release_stage: 'dev', blockers: ['No effects defined', 'No image assigned'], translationHealth: 'none' },
  { id: 'wc2', label: 'Magician of Shadow', type: 'world_card', status: 'pending_review', description: 'The Magician in Shadow Domain.', version_semver: '0.2.0', release_stage: 'alfa', blockers: ['Missing translations: ES'], translationHealth: 'partial' },
  { id: 'f1', label: 'Innocence', type: 'facet', status: 'published', description: 'Core facet: purity and new beginnings.', version_semver: '1.0.0', release_stage: 'release', blockers: [], translationHealth: 'complete' },
  { id: 'f2', label: 'Wisdom', type: 'facet', status: 'approved', description: 'Core facet: knowledge and insight.', version_semver: '1.2.0', release_stage: 'candidate', blockers: [], translationHealth: 'complete' },
  { id: 'a1', label: 'Major Arcana', type: 'arcana', status: 'published', description: 'The 22 trump cards.', version_semver: '3.0.0', release_stage: 'release', blockers: [], translationHealth: 'complete' },
  { id: 'sk1', label: 'Journey', type: 'skill', status: 'draft', description: 'Skill: traversal and exploration.', version_semver: '0.1.0', release_stage: 'dev', blockers: ['No effects defined', 'Entity is still in draft'], translationHealth: 'none' },
  { id: 'sk2', label: 'Illusion', type: 'skill', status: 'review', description: 'Skill: deception and misdirection.', version_semver: '0.3.0', release_stage: 'beta', blockers: ['No image assigned'], translationHealth: 'partial' },
  { id: 'w1', label: 'Ethereal Realm', type: 'world', status: 'published', description: 'A world of light and spirit.', version_semver: '1.0.0', release_stage: 'release', blockers: [], translationHealth: 'complete' },
  { id: 'w2', label: 'Shadow Domain', type: 'world', status: 'approved', description: 'A world of darkness and mystery.', version_semver: '1.1.0', release_stage: 'candidate', blockers: [], translationHealth: 'complete' },
]

const nodes = ref<GraphNode[]>(
  outerNodes.map((n, i) => {
    const pos = circlePos(i, outerNodes.length, 240)
    return { ...n, ...pos }
  }),
)

const edges = ref<GraphEdge[]>([
  { from: 'bc1', to: 'a1', relation: 'belongs to', type: 'belongs_to' },
  { from: 'bc2', to: 'a1', relation: 'belongs to', type: 'belongs_to' },
  { from: 'bc3', to: 'a1', relation: 'belongs to', type: 'belongs_to' },
  { from: 'wc1', to: 'bc1', relation: 'references', type: 'references' },
  { from: 'wc1', to: 'w1', relation: 'belongs to', type: 'belongs_to' },
  { from: 'wc2', to: 'bc2', relation: 'references', type: 'references' },
  { from: 'wc2', to: 'w2', relation: 'belongs to', type: 'belongs_to' },
  { from: 'bc1', to: 'f1', relation: 'has facet', type: 'has_many' },
  { from: 'bc3', to: 'f2', relation: 'has facet', type: 'has_many' },
  { from: 'bc1', to: 'sk1', relation: 'has skill', type: 'has_many' },
  { from: 'bc2', to: 'sk2', relation: 'has skill', type: 'has_many' },
])

// --- Interaction state ---
const selectedNodeId = ref<string | null>(null)
const hoveredNodeId = ref<string | null>(null)

// --- Relation type toggles ---
const showBelongsTo = ref(true)
const showHasMany = ref(true)
const showReferences = ref(true)

const visibleEdges = computed(() =>
  edges.value.filter(e => {
    if (e.type === 'belongs_to' && !showBelongsTo.value) return false
    if (e.type === 'has_many' && !showHasMany.value) return false
    if (e.type === 'references' && !showReferences.value) return false
    return true
  }),
)

// --- Selection logic ---
const connectedNodeIds = computed(() => {
  if (!selectedNodeId.value) return new Set<string>()
  const ids = new Set<string>()
  ids.add(selectedNodeId.value)
  for (const e of visibleEdges.value) {
    if (e.from === selectedNodeId.value) ids.add(e.to)
    if (e.to === selectedNodeId.value) ids.add(e.from)
  }
  return ids
})

const connectedEdgeKeys = computed(() => {
  if (!selectedNodeId.value) return new Set<string>()
  const keys = new Set<string>()
  for (const e of visibleEdges.value) {
    if (e.from === selectedNodeId.value || e.to === selectedNodeId.value) {
      keys.add(`${e.from}-${e.to}`)
    }
  }
  return keys
})

function isNodeDimmed(node: GraphNode): boolean {
  if (!selectedNodeId.value) return false
  return !connectedNodeIds.value.has(node.id)
}

function isEdgeDimmed(edge: GraphEdge): boolean {
  if (!selectedNodeId.value) return false
  return !connectedEdgeKeys.value.has(`${edge.from}-${edge.to}`)
}

function getNode(id: string): GraphNode | undefined {
  return nodes.value.find(n => n.id === id)
}

function selectNode(node: GraphNode) {
  if (selectedNodeId.value === node.id) {
    selectedNodeId.value = null
  } else {
    selectedNodeId.value = node.id
    toast.add({ title: node.label, description: `${node.type} · ${editorialStatusMeta(node.status).label}`, color: 'neutral', icon: 'i-lucide-circle-dot' })
  }
}

// --- Tooltip ---
const tooltipNode = computed(() => {
  const id = hoveredNodeId.value
  if (!id) return null
  return nodes.value.find(n => n.id === id) ?? null
})

// --- Edge path ---
function edgePath(edge: GraphEdge): string {
  const from = getNode(edge.from)
  const to = getNode(edge.to)
  if (!from || !to) return ''
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
}

// --- Translation halo color ---
function translationHaloColor(health: GraphNode['translationHealth']): string {
  if (health === 'complete') return '#22c55e'
  if (health === 'partial') return '#f59e0b'
  return '#ef4444'
}

// --- Edge health color (based on worst endpoint status) ---
function edgeHealthColor(edge: GraphEdge): string {
  const fromNode = getNode(edge.from)
  const toNode = getNode(edge.to)
  if (!fromNode || !toNode) return '#666'
  const badStatuses = ['draft', 'rejected', 'archived']
  const warnStatuses = ['pending_review', 'review', 'changes_requested', 'translation_review']
  const fromBad = badStatuses.includes(fromNode.status)
  const toBad = badStatuses.includes(toNode.status)
  const fromWarn = warnStatuses.includes(fromNode.status)
  const toWarn = warnStatuses.includes(toNode.status)
  if (fromBad || toBad) return '#ef4444'
  if (fromWarn || toWarn) return '#f59e0b'
  return '#22c55e'
}

// --- Edge style ---
const colorEdgesByHealth = ref(false)

function edgeStroke(edge: GraphEdge): string {
  if (colorEdgesByHealth.value) return edgeHealthColor(edge)
  if (edge.type === 'belongs_to') return '#6366f1'
  if (edge.type === 'has_many') return '#22c55e'
  if (edge.type === 'references') return '#f59e0b'
  return '#666'
}

function edgeDash(edge: GraphEdge): string {
  if (edge.type === 'references') return '6 3'
  return 'none'
}

// --- Zoom controls ---
const zoomLevel = ref(1)
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
function zoomIn() { zoomLevel.value = Math.min(MAX_ZOOM, zoomLevel.value + 0.15) }
function zoomOut() { zoomLevel.value = Math.max(MIN_ZOOM, zoomLevel.value - 0.15) }
function zoomReset() { zoomLevel.value = 1 }

// --- Entity type filter ---
const entityTypeFilter = ref<string>('')
const entityTypeOptions = [
  { label: 'All types', value: '' },
  { label: 'base_card', value: 'base_card' },
  { label: 'world_card', value: 'world_card' },
  { label: 'facet', value: 'facet' },
  { label: 'arcana', value: 'arcana' },
  { label: 'skill', value: 'skill' },
  { label: 'world', value: 'world' },
]

const visibleNodes = computed(() => {
  if (!entityTypeFilter.value) return nodes.value
  return nodes.value.filter(n => n.type === entityTypeFilter.value)
})

const visibleNodeIds = computed(() => new Set(visibleNodes.value.map(n => n.id)))

const filteredEdges = computed(() =>
  visibleEdges.value.filter(e => visibleNodeIds.value.has(e.from) && visibleNodeIds.value.has(e.to)),
)
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
          <h1 class="text-lg font-bold tracking-tight">Entity Map</h1>
          <UBadge color="primary" variant="subtle" size="xs">Studio</UBadge>
        </div>

        <div class="flex items-center gap-3">
          <!-- Entity type filter -->
          <USelect
            :model-value="entityTypeFilter"
            :items="entityTypeOptions"
            size="xs"
            class="w-36"
            aria-label="Filter by entity type"
            @update:model-value="entityTypeFilter = $event"
          />

          <!-- Relation toggles -->
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-1 text-xs cursor-pointer">
              <UCheckbox v-model="showBelongsTo" aria-label="Show belongs_to relations" />
              <span class="text-indigo-400">belongs_to</span>
            </label>
            <label class="flex items-center gap-1 text-xs cursor-pointer">
              <UCheckbox v-model="showHasMany" aria-label="Show has_many relations" />
              <span class="text-green-400">has_many</span>
            </label>
            <label class="flex items-center gap-1 text-xs cursor-pointer">
              <UCheckbox v-model="showReferences" aria-label="Show references relations" />
              <span class="text-amber-400">references</span>
            </label>
          </div>

          <!-- Color by health toggle -->
          <label class="flex items-center gap-1 text-xs cursor-pointer">
            <UCheckbox v-model="colorEdgesByHealth" aria-label="Color edges by dependency health" />
            <span class="text-muted">Health edges</span>
          </label>

          <!-- Clear selection -->
          <UButton
            v-if="selectedNodeId"
            label="Clear"
            icon="i-lucide-x"
            size="xs"
            variant="ghost"
            color="neutral"
            aria-label="Clear node selection"
            @click="selectedNodeId = null"
          />
        </div>
      </div>
    </header>

    <SketchCrossNav current-view="" />

    <!-- Graph area -->
    <main class="flex-1 flex overflow-hidden">
      <!-- SVG graph -->
      <div class="flex-1 overflow-auto flex items-center justify-center p-4 relative">
        <!-- Zoom controls -->
        <div class="absolute top-4 right-4 z-10 flex flex-col gap-1">
          <UButton icon="i-lucide-zoom-in" size="xs" variant="soft" color="neutral" aria-label="Zoom in" @click="zoomIn" />
          <UButton icon="i-lucide-zoom-out" size="xs" variant="soft" color="neutral" aria-label="Zoom out" @click="zoomOut" />
          <UButton icon="i-lucide-maximize-2" size="xs" variant="soft" color="neutral" aria-label="Reset zoom" @click="zoomReset" />
          <span class="text-[9px] text-muted text-center tabular-nums">{{ Math.round(zoomLevel * 100) }}%</span>
        </div>
        <svg
          :viewBox="`0 0 ${SVG_W} ${SVG_H}`"
          class="max-w-4xl transition-transform duration-150"
          :style="{ width: `${100 * zoomLevel}%` }"
          role="img"
          aria-label="Entity relationship graph"
        >
          <!-- Edges -->
          <g>
            <path
              v-for="edge in filteredEdges"
              :key="`${edge.from}-${edge.to}`"
              :d="edgePath(edge)"
              fill="none"
              :stroke="edgeStroke(edge)"
              :stroke-width="isEdgeDimmed(edge) ? 0.5 : 1.5"
              :stroke-dasharray="edgeDash(edge)"
              :opacity="isEdgeDimmed(edge) ? 0.15 : 0.6"
              class="transition-all duration-200"
            />
            <!-- Edge labels -->
            <text
              v-for="edge in filteredEdges"
              :key="`label-${edge.from}-${edge.to}`"
              :x="((getNode(edge.from)?.x ?? 0) + (getNode(edge.to)?.x ?? 0)) / 2"
              :y="((getNode(edge.from)?.y ?? 0) + (getNode(edge.to)?.y ?? 0)) / 2 - 6"
              text-anchor="middle"
              class="text-[8px] fill-current transition-opacity duration-200"
              :opacity="isEdgeDimmed(edge) ? 0.1 : 0.5"
            >
              {{ edge.relation }}
            </text>
          </g>

          <!-- Nodes -->
          <g
            v-for="node in visibleNodes"
            :key="node.id"
            class="cursor-pointer"
            :opacity="isNodeDimmed(node) ? 0.2 : 1"
            style="transition: opacity 0.2s;"
            @click="selectNode(node)"
            @mouseenter="hoveredNodeId = node.id"
            @mouseleave="hoveredNodeId = null"
          >
            <!-- Translation halo ring -->
            <circle
              :cx="node.x"
              :cy="node.y"
              :r="selectedNodeId === node.id ? 35 : 29"
              fill="none"
              :stroke="translationHaloColor(node.translationHealth)"
              :stroke-width="2"
              :stroke-dasharray="node.translationHealth === 'partial' ? '4 2' : node.translationHealth === 'none' ? '2 2' : 'none'"
              :opacity="isNodeDimmed(node) ? 0.15 : 0.7"
              class="transition-all duration-200"
            />

            <!-- Node circle -->
            <circle
              :cx="node.x"
              :cy="node.y"
              :r="selectedNodeId === node.id ? 30 : 24"
              :fill="nodeTypeColors[node.type]?.fill ?? '#666'"
              :stroke="selectedNodeId === node.id ? '#fff' : (nodeTypeColors[node.type]?.stroke ?? '#999')"
              :stroke-width="selectedNodeId === node.id ? 3 : 1.5"
              class="transition-all duration-200"
            />

            <!-- Status dot -->
            <circle
              :cx="node.x + 16"
              :cy="node.y - 16"
              r="5"
              :fill="editorialStatusMeta(node.status).color === 'success' ? '#22c55e' : editorialStatusMeta(node.status).color === 'warning' ? '#f59e0b' : editorialStatusMeta(node.status).color === 'error' ? '#ef4444' : editorialStatusMeta(node.status).color === 'primary' ? '#6366f1' : '#888'"
              stroke="#1a1a2e"
              stroke-width="2"
            />

            <!-- Node label -->
            <text
              :x="node.x"
              :y="node.y + 40"
              text-anchor="middle"
              class="text-[10px] font-medium fill-current"
              :fill="nodeTypeColors[node.type]?.text ?? '#ccc'"
            >
              {{ node.label }}
            </text>

            <!-- Type label -->
            <text
              :x="node.x"
              :y="node.y + 52"
              text-anchor="middle"
              class="text-[8px] fill-current opacity-50"
            >
              {{ node.type }}
            </text>

            <!-- Node icon text (first letter) -->
            <text
              :x="node.x"
              :y="node.y + 5"
              text-anchor="middle"
              class="text-sm font-bold"
              :fill="nodeTypeColors[node.type]?.text ?? '#ccc'"
            >
              {{ node.label.charAt(0) }}
            </text>
          </g>
        </svg>
      </div>

      <!-- Info panel (when node selected) -->
      <aside
        v-if="selectedNodeId && getNode(selectedNodeId)"
        class="w-72 border-l border-default bg-default overflow-y-auto shrink-0 p-4 space-y-4"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold">{{ getNode(selectedNodeId)!.label }}</h3>
          <UButton icon="i-lucide-x" size="xs" variant="ghost" color="neutral" aria-label="Close panel" @click="selectedNodeId = null" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-2 flex-wrap">
            <UBadge color="neutral" variant="outline" size="xs">{{ getNode(selectedNodeId)!.type }}</UBadge>
            <UBadge
              :color="editorialStatusMeta(getNode(selectedNodeId)!.status).color"
              :variant="editorialStatusMeta(getNode(selectedNodeId)!.status).variant"
              :icon="editorialStatusMeta(getNode(selectedNodeId)!.status).icon"
              size="xs"
            >
              {{ editorialStatusMeta(getNode(selectedNodeId)!.status).label }}
            </UBadge>
            <template v-if="getNode(selectedNodeId)!.version_semver">
              <UBadge color="neutral" variant="outline" size="xs">
                v{{ getNode(selectedNodeId)!.version_semver }}
              </UBadge>
              <span :class="`inline-block w-2 h-2 rounded-full ${releaseStageDot(getNode(selectedNodeId)!.release_stage)}`" :title="releaseStageLabel(getNode(selectedNodeId)!.release_stage)" />
            </template>
          </div>

          <p class="text-xs text-muted leading-relaxed">{{ getNode(selectedNodeId)!.description }}</p>

          <!-- Blockers -->
          <div v-if="getNode(selectedNodeId)!.blockers.length" class="space-y-1">
            <h4 class="text-xs font-semibold text-warning uppercase tracking-wider">Blockers</h4>
            <div
              v-for="(reason, idx) in getNode(selectedNodeId)!.blockers"
              :key="idx"
              class="flex items-start gap-1.5 text-[10px] text-warning"
            >
              <UIcon name="i-lucide-alert-triangle" class="shrink-0 mt-0.5 text-[10px]" />
              <span>{{ reason }}</span>
            </div>
          </div>

          <!-- Connected entities -->
          <div class="space-y-2">
            <h4 class="text-xs font-semibold text-muted uppercase tracking-wider">Connections</h4>
            <div
              v-for="edge in filteredEdges.filter(e => e.from === selectedNodeId || e.to === selectedNodeId)"
              :key="`conn-${edge.from}-${edge.to}`"
              class="flex items-center gap-2 text-xs"
            >
              <div
                class="w-2 h-2 rounded-full shrink-0"
                :style="{ backgroundColor: edgeStroke(edge) }"
              />
              <span class="text-muted">{{ edge.relation }}</span>
              <button
                class="font-medium hover:text-primary transition-colors"
                :aria-label="`Select ${getNode(edge.from === selectedNodeId ? edge.to : edge.from)?.label}`"
                @click="selectedNodeId = edge.from === selectedNodeId ? edge.to : edge.from"
              >
                {{ getNode(edge.from === selectedNodeId ? edge.to : edge.from)?.label }}
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-2 space-y-2">
            <UButton
              label="Open in Studio"
              icon="i-lucide-external-link"
              size="xs"
              variant="soft"
              class="w-full justify-start"
              aria-label="Open entity in Studio editor"
              @click="toast.add({ title: `Open ${getNode(selectedNodeId!)!.label} in Studio`, color: 'neutral' })"
            />
            <UButton
              label="View Details"
              icon="i-lucide-eye"
              size="xs"
              variant="ghost"
              color="neutral"
              class="w-full justify-start"
              aria-label="View entity details"
              @click="toast.add({ title: `View ${getNode(selectedNodeId!)!.label} details`, color: 'neutral' })"
            />
          </div>
        </div>
      </aside>
    </main>

    <!-- Tooltip (hover) -->
    <Teleport to="body">
      <div
        v-if="tooltipNode && !selectedNodeId"
        class="fixed z-50 pointer-events-none px-3 py-2 rounded-lg border border-default bg-default shadow-lg max-w-xs"
        :style="{ left: `${tooltipNode.x / SVG_W * 100}%`, top: '40%' }"
      >
        <p class="text-xs font-semibold">{{ tooltipNode.label }}</p>
        <div class="flex items-center gap-1.5 mt-0.5">
          <span class="text-[10px] text-muted">{{ tooltipNode.type }}</span>
          <span class="text-[10px] text-muted">·</span>
          <span class="text-[10px] text-muted">{{ editorialStatusMeta(tooltipNode.status).label }}</span>
          <template v-if="tooltipNode.version_semver">
            <span class="text-[10px] text-muted">·</span>
            <span class="text-[10px] text-muted tabular-nums">v{{ tooltipNode.version_semver }}</span>
            <span :class="`inline-block w-1.5 h-1.5 rounded-full ${releaseStageDot(tooltipNode.release_stage)}`" />
          </template>
        </div>
        <p class="text-[10px] text-muted mt-1">{{ tooltipNode.description }}</p>
        <div v-if="tooltipNode.blockers.length" class="mt-1 flex items-center gap-1 text-[10px] text-warning">
          <span>⚠</span>
          <span>{{ tooltipNode.blockers.length }} blocker{{ tooltipNode.blockers.length > 1 ? 's' : '' }}</span>
        </div>
      </div>
    </Teleport>

    <!-- Legend + integration notes -->
    <div class="border-t border-default p-4 bg-muted/10">
      <div class="max-w-4xl mx-auto flex items-start justify-between gap-6">
        <!-- Legend -->
        <div class="flex flex-wrap gap-4">
          <div
            v-for="(colors, type) in nodeTypeColors"
            :key="type"
            class="flex items-center gap-1.5"
          >
            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: colors.fill }" />
            <span class="text-[10px] text-muted">{{ type }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-6 h-0.5 bg-indigo-400" />
            <span class="text-[10px] text-muted">belongs_to</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-6 h-0.5 bg-green-400" />
            <span class="text-[10px] text-muted">has_many</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-6 h-0.5 bg-amber-400 border-dashed border-t" />
            <span class="text-[10px] text-muted">references</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full border-2 border-emerald-500" />
            <span class="text-[10px] text-muted">translations OK</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full border-2 border-amber-400 border-dashed" />
            <span class="text-[10px] text-muted">partial</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full border-2 border-red-500 border-dotted" />
            <span class="text-[10px] text-muted">missing</span>
          </div>
        </div>

        <!-- Integration note -->
        <p class="text-xs text-muted leading-relaxed text-right shrink-0 max-w-sm">
          <strong>Integration:</strong> Relations from FK fields (world_id, base_card_id, arcana_id)
          and assignment tables. Use <code class="text-xs">d3-force</code> for production layout.
        </p>
      </div>
    </div>
  </div>
</template>
