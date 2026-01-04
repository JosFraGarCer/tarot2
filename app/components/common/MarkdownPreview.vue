<!-- app/components/common/MarkdownPreview.vue -->
<script setup lang="ts">
/* eslint-disable vue/no-v-html -- Markdown rendered to safe HTML */
import MarkdownIt from 'markdown-it'
import { computed } from 'vue'

const props = defineProps<{
  content?: string
  inline?: boolean
}>()

// Instancia Markdown-it básica y segura
const md = new MarkdownIt({
  breaks: true,      // salto de línea = <br>
  html: false,       // no permitir HTML crudo
  linkify: true,     // autolinks
  typographer: true, // comillas y guiones tipográficos
})

// Computar preview renderizada
const rendered = computed(() =>
  props.inline
    ? md.renderInline(props.content || '')
    : md.render(props.content || '')
)
</script>

<template>
  <div
    class="w-full prose max-w-none text-sm leading-relaxed dark:prose-invert"
    v-html="rendered"
  />
</template>
