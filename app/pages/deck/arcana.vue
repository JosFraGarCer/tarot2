<!-- app/pages/deck/arcana.vue -->
<template>
  <DeckEntityPage entity="arcana" title-key="nav.arcana" label-key="arcana.title" />
</template>

<script setup lang="ts">
import DeckEntityPage from '@/components/deck/DeckEntityPage.vue'

definePageMeta({ layout: 'default' })
</script>
