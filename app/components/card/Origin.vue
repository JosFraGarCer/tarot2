<!-- app/components/card/Origin.vue -->
<!-- /app/components/card/Origin.vue -->
<script setup lang="ts">
import { ref } from 'vue'

type OriginProps = {
  title: string
  img?: string
  description?: string
  shortText?: string
  cardInfo?: string
}

const props = withDefaults(defineProps<OriginProps>(), {
  cardInfo: ''
})

const cardRef = ref<HTMLElement>()
const fallbackSrc = '/img/default.avif'
const onImgError = (e: Event) => {
  const el = e.target as HTMLImageElement
  if (el && el.src !== window.location.origin + fallbackSrc) {
    el.src = fallbackSrc
  }
}
</script>

<template>
  <article
    ref="cardRef"
    class="w-[360px] h-[504px] overflow-hidden flex flex-col bg-white relative shadow-lg border-3 border-orange-300 rounded-[20px]"
    role="article"
    :aria-label="props.title"
  >
    <div class="relative flex-1 min-h-0 flex flex-col bg-blue w-full overflow-y-auto overflow-x-hidden">
      <div class="relative h-[105px] shrink grow max-h-[55%] bg-background">
        <div class="absolute inset-0 overflow-hidden">
          <img
            :src="props.img || fallbackSrc"
            :alt="props.title"
            class="w-full h-full object-cover object-top pointer-events-none select-none"
            draggable="false"
            loading="lazy"
            decoding="async"
            @error="onImgError"
          >
        </div>
        <img
          class="absolute -bottom-[23px] z-40 h-auto min-h-[79px] object-contain w-full"
          src="/img/divider/ancestry_divider.png"
        >
        <div
          class="absolute bottom-[4px] z-50 font-normal w-24 right-[46px]"
        >
          <p class="flex text-[12px] uppercase text-black justify-center tracking-[2px] font-bold">
            {{ props.cardInfo }}
          </p>
        </div>
        <div class="absolute -bottom-[32px] left-4 z-50 font-semibold">
          <p class="text-[22px]  uppercase text-black uppercase font-aller-display">{{ props.title }}</p>
        </div>
      </div>

      <div
        class="flex flex-col justify-start relative overflow-hidden px-[11px] scrollbar-none z-40 text-[14px] sm:text-base font-aller text-black pt-1"
      >
        <!-- short_text -->
        <div v-if="props.shortText" class="w-full px-1.5 pt-7">
          <p class="italic text-[14px] tracking-[-0.015em] leading-[17px]">
            {{ props.shortText }} 
          </p>
        </div>
        <div class="flex flex-col items-start">
          <div
            v-if="props.description"
            class="w-full px-1.5 pt-2 pb-1">
            <p class="italic text-[14.5px] font-medium font-aller tracking-[-0.015em] leading-[17px]">
              {{ props.description }}
            </p>
          </div>
        </div>

      </div>
    </div>
    </article>
</template>
