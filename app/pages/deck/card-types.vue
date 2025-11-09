<!-- app/pages/deck/index.vue -->
<template>
  <DeckEntityPage
    entity="cardType"
    title-key="navigation.menu.cardTypes"
    label-key="domains.cardType.title"
    description-key="deck.cardTypesDescription"
  />
</template>

<script setup lang="ts">
import DeckEntityPage from '@/components/deck/DeckEntityPage.vue'

definePageMeta({ layout: 'default' })
</script>
