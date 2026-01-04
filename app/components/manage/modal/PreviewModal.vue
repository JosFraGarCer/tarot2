<!-- app/components/manage/modal/PreviewModal.vue -->
<!-- app/components/manage/Modal/PreviewModal.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import Preview from '~/components/manage/Preview.vue'

const props = defineProps<{
  open: boolean
  title: string
  img?: string
  shortText?: string
  description?: string
  cardInfo?: string
  legacyEffects?: boolean
  effectsMarkdown?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v)
})

const close = () => emit('update:open', false)
</script>

<template>
  <UModal v-model:open="isOpen" description="preview" :title="title">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-base font-semibold">{{ title }}</h3>
        <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="xs" @click="close" />
      </div>
    </template>
    <template #body>
      <div class="min-w-[360px] flex justify-center">
        <Preview
          :title="title"
          :img="img"
          :short-text="shortText"
          :description="description"
          :card-info="cardInfo || ''"
          :legacy-effects="legacyEffects"
          :effects-markdown="effectsMarkdown"
        />
      </div>
    </template>
  </UModal>
</template>
