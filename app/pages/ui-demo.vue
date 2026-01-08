<template>
  <UIPrototype />
</template>

<script setup lang="ts">
import UIPrototype from '~/components/manage/UIPrototype.vue'

definePageMeta({
  layout: false // Desactivamos el layout global para que el prototipo maneje su propio layout
})
</script>
