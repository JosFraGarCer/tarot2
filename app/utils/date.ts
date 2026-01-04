// app/utils/date.ts

export function formatDate(input?: string | Date | null): string {
  try {
    if (!input) return ''
    const date = typeof input === 'string' ? new Date(input) : input
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return typeof input === 'string' ? input : ''
  }
}
