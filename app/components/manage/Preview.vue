<!-- app/components/manage/Modal/Preview.vue -->
<script setup lang="ts">
import Origin from '~/components/card/Origin.vue'

type Props = {
  title: string
  img?: string
  description?: string
  shortText?: string
  cardInfo?: string
  legacyEffects?: boolean
  effectsMarkdown?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  cardInfo: '',
  legacyEffects: false,
  effectsMarkdown: null,
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 p-3">
    <Origin
      :title="props.title"
      :img="props.img"
      :description="props.description"
      :short-text="props.shortText"
      :card-info="props.cardInfo"
      :legacy-effects="props.legacyEffects"
      :effects-markdown="props.effectsMarkdown"
    />
  </div>
</template>