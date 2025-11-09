<!-- app/pages/deck/arcana.vue -->
<template>
  <DeckEntityPage
    entity="arcana"
    title-key="navigation.menu.arcana"
    label-key="domains.arcana.title"
    description-key="deck.arcanaDescription"
  />
</template>

<script setup lang="ts">
import DeckEntityPage from '@/components/deck/DeckEntityPage.vue'

definePageMeta({ layout: 'default' })
</script>
