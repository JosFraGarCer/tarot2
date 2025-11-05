// app/utils/navigation.ts
import type { Permissions } from '@/types/permissions'

export type NavItem = {
  id?: string
  labelKey: string
  to: string
  children?: Array<{ labelKey: string; to: string; visible?: (p: Permissions, role?: string) => boolean }>
  visible?: (p: Permissions, role?: string) => boolean
}

export const navigationMap: NavItem[] = [
  // 🏠 Home
  { id: 'home', labelKey: 'nav.home', to: '/', visible: () => true },

  // 📦 Deck
  {
    id: 'deck',
    labelKey: 'nav.deck',
    to: '/deck',
    children: [
      { labelKey: 'nav.cardTypes', to: '/deck/card-types' },
      { labelKey: 'nav.baseCards', to: '/deck/base-cards' },
      { labelKey: 'nav.worlds', to: '/deck/worlds' },
      { labelKey: 'nav.arcana', to: '/deck/arcana' },
      { labelKey: 'nav.facets', to: '/deck/facets' },
      { labelKey: 'nav.skills', to: '/deck/skills' }
    ],
    visible: () => true
  },

  // ⚙️ Manage
  {
    id: 'manage',
    labelKey: 'nav.manage',
    to: '/manage',
    visible: (p, role) =>
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
    labelKey: 'nav.admin',
    to: '/admin',
    children: [
      {
        labelKey: 'nav.manageUsers',
        to: '/admin/users',
        visible: (p, role) => Boolean(
          p.canManageUsers || (role && ['admin'].includes(role))
        )
      },
      {
        labelKey: 'nav.database',
        to: '/admin/database',
        visible: (p, role) => Boolean(role === 'admin')
      },
      {
        labelKey: 'nav.versions',
        to: '/admin/versions',
        visible: (p, role) => Boolean(role === 'admin')
      },
      {
        labelKey: 'nav.feedback',
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
      ['staff', 'reviewer'].includes(role)
    )
  }
]
