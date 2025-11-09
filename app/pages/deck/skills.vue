<!-- app/pages/deck/skills.vue -->
<template>
  <DeckEntityPage
    entity="skill"
    title-key="navigation.menu.skills"
    label-key="domains.skill.title"
    description-key="deck.skillsDescription"
  />
</template>

<script setup lang="ts">
import DeckEntityPage from '@/components/deck/DeckEntityPage.vue'

definePageMeta({ layout: 'default' })
</script>
