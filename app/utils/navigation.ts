// app/utils/navigation.ts
import type { Permissions } from '@/types/permissions'

export type NavItem = {
  id?: string
  labelKey: string
  descriptionKey?: string
  to: string
  children?: Array<{ labelKey: string; descriptionKey?: string; to: string; visible?: (p: Permissions, role?: string) => boolean }>
  visible?: (p: Permissions, role?: string) => boolean
}

export const navigationMap: NavItem[] = [
  // 🏠 Home
  { id: 'home', labelKey: 'navigation.menu.home', descriptionKey: 'navigation.description.home', to: '/', visible: () => true },

  // 📦 Deck
  {
    id: 'deck',
    labelKey: 'navigation.menu.deck',
    descriptionKey: 'navigation.description.deck',
    to: '/deck',
    children: [
      { labelKey: 'navigation.menu.cardTypes', descriptionKey: 'navigation.description.cardTypes', to: '/deck/card-types' },
      { labelKey: 'navigation.menu.baseCards', descriptionKey: 'navigation.description.baseCards', to: '/deck/base-cards' },
      { labelKey: 'navigation.menu.worlds', descriptionKey: 'navigation.description.worlds', to: '/deck/worlds' },
      { labelKey: 'navigation.menu.arcana', descriptionKey: 'navigation.description.arcana', to: '/deck/arcana' },
      { labelKey: 'navigation.menu.facets', descriptionKey: 'navigation.description.facets', to: '/deck/facets' },
      { labelKey: 'navigation.menu.skills', descriptionKey: 'navigation.description.skills', to: '/deck/skills' }
    ],
    visible: () => true
  },

  // ⚙️ Manage
  {
    id: 'manage',
    labelKey: 'navigation.menu.manage',
    descriptionKey: 'navigation.description.manage',
    to: '/manage',
    visible: (p, _role) =>
      Boolean(
        p.canAccessManage ||
        p.canEditContent ||
        p.canReview ||
        p.canPublish ||
        p.canTranslate
      )
  },

  // 🧭 Admin
  {
    id: 'admin',
    labelKey: 'navigation.menu.admin',
    descriptionKey: 'navigation.description.admin',
    to: '/admin',
    children: [
      {
        labelKey: 'navigation.menu.manageUsers',
        descriptionKey: 'navigation.description.manageUsers',
        to: '/admin/users',
        visible: (p, role) => Boolean(
          p.canManageUsers || (role && ['admin'].includes(role))
        )
      },
      {
        labelKey: 'navigation.menu.database',
        descriptionKey: 'navigation.description.database',
        to: '/admin/database',
        visible: (p, role) => Boolean(role === 'admin')
      },
      {
        labelKey: 'navigation.menu.versions',
        descriptionKey: 'navigation.description.versions',
        to: '/admin/versions',
        visible: (p, role) => Boolean(role === 'admin')
      },
      {
        labelKey: 'navigation.menu.feedback',
        descriptionKey: 'navigation.description.feedback',
        to: '/admin/feedback',
        visible: (p, role) => Boolean(
          p.canResolveFeedback || (role && ['admin', 'staff', 'reviewer'].includes(role))
        )
      }
    ],
    // El menú “Admin” solo aparece si el usuario puede ver al menos uno de los hijos
    visible: (p, role) => Boolean(
      p.canAccessAdmin ||
      p.canManageUsers ||
      role === 'admin' ||
      (role && ['staff', 'reviewer'].includes(role))
    )
  }
]
