import { ref } from 'vue'

export function useEntityRelations() {
  const arcanaOptions = ref<Array<{ label: string; value: string | number }>>([
    { label: 'Major', value: 'major' },
    { label: 'Minor', value: 'minor' },
  ])
  const cardTypeOptions = ref<Array<{ label: string; value: string | number }>>([
    { label: 'Type A', value: 'A' },
    { label: 'Type B', value: 'B' },
  ])
  const facetOptions = ref<Array<{ label: string; value: string | number }>>([
    { label: 'General', value: 'general' },
  ])

  async function loadAll() {
    // In a real app, fetch options here. Keeping synchronous defaults for now.
    return true
  }

  return { arcanaOptions, cardTypeOptions, facetOptions, loadAll }
}
