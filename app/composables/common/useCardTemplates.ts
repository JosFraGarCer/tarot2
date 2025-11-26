// app/composables/common/useCardTemplates.ts
// app/composables/useCardTemplates.ts
import { computed } from 'vue'
import CardClass from '~/components/card/Class.vue'
import CardOrigin from '~/components/card/Origin.vue'

export type CardTemplateKey = 'Class' | 'Origin'

const registry: Record<CardTemplateKey, any> = {
  Class: CardClass,
  Origin: CardOrigin
}

export const useCardTemplates = () => {
  const templateOptions = computed(() => [
    { label: 'Class', value: 'Class' as CardTemplateKey },
    { label: 'Origin', value: 'Origin' as CardTemplateKey }
  ])

  const resolveTemplate = (key: CardTemplateKey) => registry[key]

  return { templateOptions, resolveTemplate }
}
