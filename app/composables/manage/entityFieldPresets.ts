// app/composables/manage/entityFieldPresets.ts
export type FieldConfig = {
  label: string
  type?: 'text' | 'select' | 'toggle' | 'upload' | 'effects'
  rows?: number
  placeholder?: string
  required?: boolean
  hidden?: boolean
  disabled?: boolean
  relation?: 'arcana' | 'card_type' | 'facet'
}

export const entityFieldPresets: Record<string, Record<string, FieldConfig>> = {
  // Example: cards
  card: {
    name: { label: 'Name', placeholder: 'Name', required: true },
    short_text: { label: 'Short text', rows: 2, placeholder: 'Short text' },
    description: { label: 'Description', rows: 4, placeholder: 'Description' },
    arcana_id: { label: 'Arcana', type: 'select', relation: 'arcana' },
    card_type_id: { label: 'Card Type', type: 'select', relation: 'card_type' },
    facet_id: { label: 'Facet', type: 'select', relation: 'facet' },
    image: { label: 'Image', type: 'upload' },
    status: { label: 'Status', type: 'select' },
    is_active: { label: 'Active', type: 'toggle' },
  },
  // Example: card_type
  card_type: {
    name: { label: 'Name', placeholder: 'Name', required: true },
    description: { label: 'Description', rows: 4 },
  },
  // Fallback minimal set for unknown entities
  entity: {
    name: { label: 'Name', placeholder: 'Name', required: true },
    description: { label: 'Description', rows: 3 },
  },
}
