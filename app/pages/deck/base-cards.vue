<!-- app/pages/deck/index.vue -->
<template>
  <DeckEntityPage
    entity="baseCard"
    title-key="nav.baseCards"
    label-key="base_card.title"
    description-key="deck.baseCardsDescription"
  />
</template>

<script setup lang="ts">
import DeckEntityPage from '@/components/deck/DeckEntityPage.vue'

definePageMeta({ layout: 'default' })
</script>
