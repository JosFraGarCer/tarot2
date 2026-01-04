// app/composables/manage/useTranslationActions.ts
// /app/composables/manage/useTranslationActions.ts
import { useI18n } from '#imports'
import { useApiFetch } from '~/utils/fetcher'

export function useTranslationActions(resourcePath: string) {
  const { locale } = useI18n()
  const $fetch = useApiFetch

  async function upsert(id: number, fields: { name: string; short_text?: string | null; description?: string | null }, lang?: string) {
    const localeVal = typeof locale === 'string' ? locale : (locale.value as string)
    const res = await $fetch(`${resourcePath}/${id}`, {
      method: 'PATCH',
      params: { lang: lang ?? localeVal },
      body: fields,
    })
    return res
  }

  // Prefer dedicated endpoint if backend provides it (recommended):
  // DELETE `${resourcePath}/${id}/translation?lang=xx`
  async function deleteTranslation(id: number, lang?: string) {
    // Fallback approach if no translation DELETE exists: clear the translation fields
    return upsert(id, { name: '', short_text: null, description: null }, lang)
  }

  return { upsert, deleteTranslation }
}
