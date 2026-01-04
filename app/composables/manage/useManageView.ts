// app/composables/manage/useManageView.ts
// /app/composables/useManageView.ts

import { useState, watch } from '#imports'
import { useCardTemplates } from '~/composables/common/useCardTemplates'

export type ManageViewMode = 'tarjeta' | 'classic' | 'carta' | 'tabla'
export type ManageTemplateKey = 'Class' | 'Origin'

function isManageViewMode(value: string | null): value is ManageViewMode {
  return value === 'tarjeta' || value === 'classic' || value === 'carta' || value === 'tabla'
}

function isManageTemplateKey(value: string | null): value is ManageTemplateKey {
  return value === 'Class' || value === 'Origin'
}

export function useManageView(options: { storageKey?: string } = {}) {
  const storageKey = options.storageKey ?? 'manage'

  const viewMode = useState<ManageViewMode>(`${storageKey}:viewMode`, () => 'tarjeta')
  const templateKey = useState<ManageTemplateKey>(`${storageKey}:templateKey`, () => 'Class')
  const { templateOptions } = useCardTemplates()

  if (import.meta.client) {
    const storedMode = localStorage.getItem(`${storageKey}.mode`)
    if (isManageViewMode(storedMode) && storedMode !== viewMode.value) {
      viewMode.value = storedMode
    }

    const storedTemplate = localStorage.getItem(`${storageKey}.template`)
    if (isManageTemplateKey(storedTemplate) && storedTemplate !== templateKey.value) {
      templateKey.value = storedTemplate
    }

    watch(viewMode, (mode) => {
      localStorage.setItem(`${storageKey}.mode`, mode)
    })

    watch(templateKey, (tpl) => {
      localStorage.setItem(`${storageKey}.template`, tpl)
    })
  }

  return {
    viewMode,
    templateKey,
    templateOptions
  }
}
