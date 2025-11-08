<!-- app/pages/deck/index.vue -->
<template>
  <DeckEntityPage
    entity="cardType"
    title-key="nav.cardTypes"
    label-key="card-types.title"
    description-key="deck.cardTypesDescription"
  />
</template>

<script setup lang="ts">
import DeckEntityPage from '@/components/deck/DeckEntityPage.vue'

definePageMeta({ layout: 'default' })
</script>
