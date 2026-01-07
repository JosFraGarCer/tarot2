<!-- 
  Component: BaseSlideover
  Purpose: Orchestrates EntitySlideover using EntityBaseContext
-->
<template>
  <EntitySlideover
    v-if="ctx.slideoverOpen.value"
    :id="ctx.slideoverEntityId.value"
    :open="ctx.slideoverOpen.value"
    @update:open="ctx.setSlideoverOpen"
    :kind="ctx.resolvedSlideoverKind.value"
    :neighbors="ctx.slideoverNeighbors.value"
    @close="ctx.setSlideoverOpen(false)"
    @saved="ctx.handleEntitySaved"
    @navigate="ctx.handleSlideoverNavigate"
  />
</template>

<script setup lang="ts">
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import EntitySlideover from '~/components/manage/EntitySlideover.vue'

const ctx = useEntityBase()
</script>
