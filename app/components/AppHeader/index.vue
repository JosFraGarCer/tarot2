<!-- app/components/AppHeader/index.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import AppHeaderDesktop from '~/components/AppHeader/AppHeaderDesktop.vue'
import AppHeaderMobile from '~/components/AppHeader/AppHeaderMobile.vue'

// Decide el header en cliente usando matchMedia (md = 768px)
const isMdUp = ref(false)
onMounted(() => {
  const mq = window.matchMedia('(min-width: 768px)')
  const apply = () => { isMdUp.value = mq.matches }
  apply()
  mq.addEventListener('change', apply)
  onBeforeUnmount(() => mq.removeEventListener('change', apply))
})
</script>

<template>
  <ClientOnly>
    <component :is="isMdUp ? AppHeaderDesktop : AppHeaderMobile" />
  </ClientOnly>
</template>
