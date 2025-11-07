<!-- app/components/manage/Modal/Preview.vue -->
<script setup lang="ts">
import Origin from '~/components/card/Origin.vue'

type Props = {
  title: string
  img?: string
  description?: string
  shortText?: string
  cardInfo?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="flex items-center justify-center p-2">
    <Origin
      :title="props.title"
      :img="props.img"
      :description="props.description"
      :short-text="props.shortText"
      :card-info="props.cardInfo || ''"
    />
  </div>
</template>