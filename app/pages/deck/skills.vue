<!-- app/pages/deck/skills.vue -->
<template>
  <DeckEntityPage
    entity="skill"
    title-key="nav.skills"
    label-key="skills.title"
    description-key="deck.skillsDescription"
  />
</template>

<script setup lang="ts">
import DeckEntityPage from '@/components/deck/DeckEntityPage.vue'

definePageMeta({ layout: 'default' })
</script>
