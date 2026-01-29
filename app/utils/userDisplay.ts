// app/utils/userDisplay.ts
// Utility functions for user display
// Extracted from user.vue to reduce duplication

export function statusColor(status: string | undefined): string {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'neutral'
    case 'suspended':
      return 'warning'
    case 'banned':
      return 'error'
    case 'pending':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function statusLabel(status: string | undefined): string {
  switch (status) {
    case 'active':
      return 'Activo'
    case 'inactive':
      return 'Inactivo'
    case 'suspended':
      return 'Suspendido'
    case 'banned':
      return 'Baneado'
    case 'pending':
      return 'Pendiente'
    default:
      return status || 'Desconocido'
  }
}

export function formatDate(date: string | undefined): string {
  if (!date) return ''
  try {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return date
  }
}

export function formatDateTime(date: string | undefined): string {
  if (!date) return ''
  try {
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return date
  }
}

export function truncateText(text: string | null | undefined, maxLength = 100): string {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

export function formatRoleName(role: { name?: string | null }): string {
  return role.name || 'Sin rol'
}
