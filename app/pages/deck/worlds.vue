<!-- app/pages/deck/worlds.vue -->
<template>
  <DeckEntityPage
    entity="world"
    title-key="nav.worlds"
    label-key="world.title"
    description-key="deck.worldsDescription"
  />
</template>

<script setup lang="ts">
import DeckEntityPage from '@/components/deck/DeckEntityPage.vue'

definePageMeta({ layout: 'default' })
</script>
