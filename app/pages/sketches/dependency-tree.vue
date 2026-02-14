<!--
  /pages/sketches/dependency-tree.vue
  POC: Dependency Tree View — hierarchical entity dependency visualization

  OBJECTIVE:
  Tree-style view showing entity dependencies as a collapsible hierarchy.
  Root = selected entity, children = dependencies (facets, skills, world, base_card).
  Each node shows status, version, blockers. Expand/collapse for deep trees.

  SUCCESS CRITERIA:
  - Clear tree hierarchy with indentation
  - Expand/collapse nodes
  - Status + version + blockers on each node
  - Health summary at top (all deps ready / some blocked)
  - Click node to select and see details

  INTEGRATION INTO /manage:
  1. Tab in EntitySlideover "Dependencies" or Studio Dependencies tab
  2. Data from entity detail + related entities
  3. Health computed from dependency statuses
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

definePageMeta({ layout: 'default' })

const toast = useToast()

// --- Tree node type ---
interface TreeNode {
  id: string
  label: string
  type: string
  status: EditorialStatus
  version_semver: string | null
  release_stage: ReleaseStage | null
  blockers: string[]
  relation: string
  children: TreeNode[]
  expanded: boolean
}

// --- Mock dependency trees ---
const trees: Record<string, TreeNode> = {
  fool: {
    id: 'bc1', label: 'The Fool', type: 'base_card', status: 'published', version_semver: '2.0.0', release_stage: 'release', blockers: [], relation: 'root', expanded: true,
    children: [
      {
        id: 'a1', label: 'Major Arcana', type: 'arcana', status: 'published', version_semver: '3.0.0', release_stage: 'release', blockers: [], relation: 'belongs_to', expanded: true,
        children: [],
      },
      {
        id: 'f1', label: 'Innocence', type: 'facet', status: 'published', version_semver: '1.0.0', release_stage: 'release', blockers: [], relation: 'has_facet', expanded: true,
        children: [
          { id: 'sk1', label: 'Journey', type: 'skill', status: 'draft', version_semver: '0.1.0', release_stage: 'dev', blockers: ['No effects defined', 'Entity is still in draft'], relation: 'has_skill', expanded: false, children: [] },
        ],
      },
      {
        id: 'wc1', label: 'Fool of Ether', type: 'world_card', status: 'draft', version_semver: '0.1.0', release_stage: 'dev', blockers: ['No effects defined', 'No image assigned'], relation: 'world_card_override', expanded: true,
        children: [
          { id: 'w1', label: 'Ethereal Realm', type: 'world', status: 'published', version_semver: '1.0.0', release_stage: 'release', blockers: [], relation: 'belongs_to_world', expanded: false, children: [] },
        ],
      },
    ],
  },
  magician: {
    id: 'bc2', label: 'The Magician', type: 'base_card', status: 'approved', version_semver: '1.3.0', release_stage: 'candidate', blockers: [], relation: 'root', expanded: true,
    children: [
      { id: 'a1', label: 'Major Arcana', type: 'arcana', status: 'published', version_semver: '3.0.0', release_stage: 'release', blockers: [], relation: 'belongs_to', expanded: false, children: [] },
      {
        id: 'f2', label: 'Wisdom', type: 'facet', status: 'approved', version_semver: '1.2.0', release_stage: 'candidate', blockers: [], relation: 'has_facet', expanded: true,
        children: [
          { id: 'sk2', label: 'Illusion', type: 'skill', status: 'review', version_semver: '0.3.0', release_stage: 'beta', blockers: ['No image assigned'], relation: 'has_skill', expanded: false, children: [] },
        ],
      },
      {
        id: 'wc2', label: 'Magician of Shadow', type: 'world_card', status: 'pending_review', version_semver: '0.2.0', release_stage: 'alfa', blockers: ['Missing translations: ES'], relation: 'world_card_override', expanded: true,
        children: [
          { id: 'w2', label: 'Shadow Domain', type: 'world', status: 'approved', version_semver: '1.1.0', release_stage: 'candidate', blockers: [], relation: 'belongs_to_world', expanded: false, children: [] },
        ],
      },
    ],
  },
}

const selectedTree = ref<string>('fool')
const treeOptions = [
  { label: 'The Fool (base_card)', value: 'fool' },
  { label: 'The Magician (base_card)', value: 'magician' },
]

const rootNode = computed(() => trees[selectedTree.value] ?? trees.fool!)

// --- Flatten tree for counting ---
function flattenNodes(node: TreeNode): TreeNode[] {
  return [node, ...node.children.flatMap(c => flattenNodes(c))]
}

const allNodes = computed(() => flattenNodes(rootNode.value))
const blockedCount = computed(() => allNodes.value.filter(n => n.blockers.length > 0).length)
const totalCount = computed(() => allNodes.value.length)
const healthStatus = computed(() => {
  if (blockedCount.value === 0) return 'ok'
  if (blockedCount.value < totalCount.value / 2) return 'warning'
  return 'blocked'
})

// --- Selected node for detail panel ---
const selectedNodeId = ref<string | null>(null)

function findNode(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node
  for (const child of node.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return findNode(rootNode.value, selectedNodeId.value)
})

function toggleExpand(node: TreeNode) {
  node.expanded = !node.expanded
}

function selectNode(node: TreeNode) {
  selectedNodeId.value = selectedNodeId.value === node.id ? null : node.id
}

// --- Relation labels ---
function relationLabel(rel: string): string {
  const map: Record<string, string> = {
    root: 'Root Entity',
    belongs_to: 'belongs to',
    has_facet: 'has facet',
    has_skill: 'has skill',
    world_card_override: 'world card',
    belongs_to_world: 'in world',
  }
  return map[rel] ?? rel
}

// --- Node type colors ---
function nodeTypeColor(type: string): string {
  const map: Record<string, string> = {
    base_card: 'text-violet-400',
    world_card: 'text-blue-400',
    facet: 'text-emerald-400',
    arcana: 'text-amber-400',
    skill: 'text-rose-400',
    world: 'text-cyan-400',
  }
  return map[type] ?? 'text-muted'
}

// --- Flatten tree for rendering ---
interface FlatNode {
  node: TreeNode
  depth: number
}

function flattenVisible(node: TreeNode, depth: number): FlatNode[] {
  const result: FlatNode[] = [{ node, depth }]
  if (node.expanded) {
    for (const child of node.children) {
      result.push(...flattenVisible(child, depth + 1))
    }
  }
  return result
}

const flatNodes = computed(() => flattenVisible(rootNode.value, 0))
</script>

<template>
  <div class="min-h-screen bg-default flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-default bg-default/95 backdrop-blur-sm">
      <div class="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
        <div class="flex items-center gap-3">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-lg font-bold tracking-tight">Dependency Tree</h1>
          <UBadge color="primary" variant="subtle" size="xs">Phase 3</UBadge>
        </div>

        <div class="flex items-center gap-3">
          <USelect
            v-model="selectedTree"
            :items="treeOptions"
            size="xs"
            class="w-56"
            aria-label="Select root entity"
          />
        </div>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <!-- Tree panel -->
      <main class="flex-1 p-6 overflow-y-auto">
        <!-- Health summary -->
        <div class="mb-6 flex items-center gap-3">
          <UIcon
            :name="healthStatus === 'ok' ? 'i-lucide-check-circle' : healthStatus === 'warning' ? 'i-lucide-alert-triangle' : 'i-lucide-circle-x'"
            :class="healthStatus === 'ok' ? 'text-emerald-500' : healthStatus === 'warning' ? 'text-amber-400' : 'text-red-500'"
            class="text-lg"
          />
          <span class="text-sm font-medium">
            {{ healthStatus === 'ok' ? 'All dependencies ready' : `${blockedCount} of ${totalCount} nodes have blockers` }}
          </span>
        </div>

        <!-- Tree (flat rendering) -->
        <div class="space-y-1">
          <div
            v-for="item in flatNodes"
            :key="item.node.id + '-' + item.depth"
            class="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-muted/20"
            :class="{ 'bg-primary/10 ring-1 ring-primary/30': selectedNodeId === item.node.id }"
            :style="{ paddingLeft: `${item.depth * 24 + 12}px` }"
            role="treeitem"
            :aria-expanded="item.node.children.length ? item.node.expanded : undefined"
            :aria-level="item.depth + 1"
            @click="selectNode(item.node)"
          >
            <!-- Expand/collapse -->
            <button
              v-if="item.node.children.length"
              class="text-muted hover:text-primary transition-colors shrink-0 w-4 text-center"
              :aria-label="item.node.expanded ? 'Collapse' : 'Expand'"
              @click.stop="toggleExpand(item.node)"
            >
              <span class="text-xs inline-block transition-transform" :class="{ '-rotate-90': !item.node.expanded }">▼</span>
            </button>
            <span v-else class="w-4 shrink-0" />

            <!-- Type label -->
            <span class="text-xs font-medium" :class="nodeTypeColor(item.node.type)">{{ item.node.type }}</span>

            <!-- Name -->
            <span class="text-sm font-medium">{{ item.node.label }}</span>

            <!-- Version -->
            <span v-if="item.node.version_semver" class="text-[10px] text-muted tabular-nums">v{{ item.node.version_semver }}</span>

            <!-- Status -->
            <UBadge
              :color="editorialStatusMeta(item.node.status).color"
              :variant="editorialStatusMeta(item.node.status).variant"
              size="xs"
            >
              {{ editorialStatusMeta(item.node.status).label }}
            </UBadge>

            <!-- Blockers -->
            <span
              v-if="item.node.blockers.length"
              class="text-[10px] text-warning"
              :title="item.node.blockers.join('\n')"
            >
              ⚠ {{ item.node.blockers.length }}
            </span>

            <!-- Relation label -->
            <span v-if="item.depth > 0" class="text-[9px] text-muted/50 ml-auto">{{ relationLabel(item.node.relation) }}</span>
          </div>
        </div>
      </main>

      <!-- Detail panel -->
      <aside
        v-if="selectedNode"
        class="w-72 border-l border-default bg-default overflow-y-auto shrink-0 p-4 space-y-4"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold">{{ selectedNode.label }}</h3>
          <UButton icon="i-lucide-x" size="xs" variant="ghost" color="neutral" aria-label="Close panel" @click="selectedNodeId = null" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-2 flex-wrap">
            <UBadge color="neutral" variant="outline" size="xs">{{ selectedNode.type }}</UBadge>
            <UBadge
              :color="editorialStatusMeta(selectedNode.status).color"
              :variant="editorialStatusMeta(selectedNode.status).variant"
              :icon="editorialStatusMeta(selectedNode.status).icon"
              size="xs"
            >
              {{ editorialStatusMeta(selectedNode.status).label }}
            </UBadge>
          </div>

          <div v-if="selectedNode.version_semver" class="flex items-center gap-2">
            <UBadge color="neutral" variant="outline" size="xs">v{{ selectedNode.version_semver }}</UBadge>
            <span v-if="selectedNode.release_stage" :class="`inline-block w-2 h-2 rounded-full ${releaseStageDot(selectedNode.release_stage)}`" />
            <span v-if="selectedNode.release_stage" class="text-xs text-muted">{{ releaseStageLabel(selectedNode.release_stage) }}</span>
          </div>

          <div class="text-xs text-muted">
            <span>Relation: </span>
            <strong>{{ relationLabel(selectedNode.relation) }}</strong>
          </div>

          <div v-if="selectedNode.blockers.length" class="space-y-1">
            <h4 class="text-xs font-semibold text-warning uppercase tracking-wider">Blockers</h4>
            <div
              v-for="(reason, idx) in selectedNode.blockers"
              :key="idx"
              class="flex items-start gap-1.5 text-[10px] text-warning"
            >
              <UIcon name="i-lucide-alert-triangle" class="shrink-0 mt-0.5 text-[10px]" />
              <span>{{ reason }}</span>
            </div>
          </div>

          <div v-if="selectedNode.children.length" class="text-xs text-muted">
            {{ selectedNode.children.length }} direct dependenc{{ selectedNode.children.length === 1 ? 'y' : 'ies' }}
          </div>

          <UButton
            label="Open in Studio"
            icon="i-lucide-external-link"
            size="xs"
            variant="soft"
            class="w-full justify-start"
            @click="toast.add({ title: `Open ${selectedNode.label} in Studio`, color: 'neutral' })"
          />
        </div>
      </aside>
    </div>

    <!-- Integration notes -->
    <div class="border-t border-default p-4 bg-muted/10">
      <p class="text-xs text-muted text-center max-w-3xl mx-auto leading-relaxed">
        <strong>Integration:</strong> Tree built from entity detail + FK relations.
        <code class="text-xs">facet.arcana_id</code>, <code class="text-xs">skill.facet_id</code>,
        <code class="text-xs">world_card.world_id + base_card_id</code>.
        Health summary feeds into publish readiness checklist.
      </p>
    </div>
  </div>
</template>

