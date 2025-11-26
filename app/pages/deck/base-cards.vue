<!-- app/pages/deck/base-cards.vue -->
<!-- app/pages/deck/index.vue -->
<template>
  <DeckEntityPage
    entity="baseCard"
    title-key="navigation.menu.baseCards"
    label-key="domains.baseCard.title"
    description-key="deck.baseCardsDescription"
  />
</template>

<script setup lang="ts">
import DeckEntityPage from '@/components/deck/DeckEntityPage.vue'

definePageMeta({ layout: 'default' })
</script>
