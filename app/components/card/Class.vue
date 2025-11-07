<!-- app/components/card/Class.vue -->
<!-- /app/components/card/Class.vue -->
<script setup lang="ts">
import { ref } from 'vue'

type Props = {
  typeLabel: string        // Tipo de carta / entidad
  name: string             // Nombre de la entidad
  shortText?: string       // Texto corto / subtítulo
  description?: string     // Descripción larga
  img?: string             // Imagen de cabecera
}

const props = defineProps<Props>()

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
    class="w-[360px] h-[504px] min-w-[360px] overflow-hidden flex text-black flex-col bg-white relative shadow-lg border-3 border-orange-300 rounded-[20px]"
    :aria-label="props.name"
    role="article"
  >
    <!-- Header visual (imagen + dominios + íconos) -->
    <div class="relative h-[150px] shrink grow max-h-[55%] bg-background">
      <!-- Imagen de fondo -->
      <div class="absolute inset-0 overflow-hidden">
        <img
          :src="props.img || fallbackSrc"
          :alt="props.name"
          class="w-full h-full object-cover object-top pointer-events-none select-none"
          draggable="false"
          loading="lazy"
          decoding="async"
          @error="onImgError"
        >
      </div>

      <!-- Capa 4: Divider inferior -->
      <img
        class="absolute -bottom-[21px] z-20 h-auto min-h-[79px] object-contain w-full"
        src="/img/divider/new_class_divider.png"
        alt=""
        aria-hidden="true"
      >

      <!-- Capa 5: Cinta con gradiente y título (tipo de carta) -->
      <div
        class="absolute bottom-[9px] left-1/2 -translate-x-1/2 h-[30px] w-[180px] z-30
               flex items-center justify-center
               [clip-path:polygon(8%_0,92%_0,100%_50%,92%_100%,8%_100%,0_50%)]"
      >
        <p class="text-[12px] uppercase text-white tracking-[0.5px] font-bold text-center px-2 truncate">
          {{ props.typeLabel }}
        </p>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="p-3 pt-2 w-full">
      <!-- Nombre -->
      <div class="text-center leading-[21px]">
        <p class="pt-2 text-[20px] uppercase font-aller-display tracking-wide font-semibold">
          {{ props.name }}
        </p>
        <!-- short_text -->
        <p
          v-if="props.shortText"
          class="mt-0.5 italic text-[13px] font-semibold tracking-[-0.03em]  leading-tight"
        >
          {{ props.shortText }}
        </p>
      </div>

      <!-- Descripción -->
      <div v-if="props.description" class="flex flex-col items-justify w-full px-1.5 pt-1 pb-1">
        <p class="text-[13px] tracking-[-0.015em] leading-[17px]">
          {{ props.description }}
        </p>
      </div>

    </div>
  </article>
</template>