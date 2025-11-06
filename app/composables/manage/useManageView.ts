// /app/composables/useManageView.ts

import { useState } from '#imports'
// import { useCardTemplates } from '~/composables/useCardTemplates'

export type ManageViewMode = 'tarjeta' | 'carta'
export type ManageTemplateKey = 'Class' | 'Origin'

export function useManageView() {
  const viewMode = useState<ManageViewMode>('manage:viewMode', () => 'tarjeta')
  const templateKey = useState<ManageTemplateKey>('manage:templateKey', () => 'Class')
  // const { templateOptions } = useCardTemplates()

  return {
    viewMode,
    templateKey,
    // templateOptions
  }
}
