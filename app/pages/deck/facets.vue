<!-- app/pages/deck/facets.vue -->
<template>
  <DeckEntityPage
    entity="facet"
    title-key="navigation.menu.facets"
    label-key="domains.facet.title"
    description-key="deck.facetsDescription"
  />
</template>

<script setup lang="ts">
import DeckEntityPage from '@/components/deck/DeckEntityPage.vue'

definePageMeta({ layout: 'default' })
</script>
