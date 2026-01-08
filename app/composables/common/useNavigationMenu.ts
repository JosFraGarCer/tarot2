// app/composables/common/useNavigationMenu.ts
// /app/composables/useNavigationMenu.ts
import { computed } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useLocalePath } from '#i18n'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'
import { navigationMap } from '@/utils/navigation'

export function useNavigationMenu() {
  const { t, locale } = useI18n()
  const route = useRoute()
  const localePath = useLocalePath()
  const store = useUserStore()
  const { user } = storeToRefs(store)

  const safePath = (path: string) => {
    try {
      return localePath(path) || path
    } catch {
      return path
    }
  }

  return computed<NavigationMenuItem[]>(() => {
    // forzar reactividad con cambios de idioma
    void locale.value

    const isActive = (path: string) => {
      const target = safePath(path)
      return route.path === target || route.path.startsWith(target + '/')
    }

    // 🧭 Menú público si no hay usuario autenticado
    if (!user.value || Object.keys(user.value).length === 0) {
      return [
        { label: t('navigation.menu.home'), to: safePath('/'), active: isActive('/') },
        { label: t('navigation.menu.login'), to: safePath('/login'), active: isActive('/login') },
      ]
    }

    // 🧩 Permisos y rol actual
    const perms = user.value.permissions || {}
    const role = user.value.roles?.[0]?.name?.toLowerCase?.() || 'user'

    // 🗺️ Generar menú desde navigationMap
    const items: NavigationMenuItem[] = navigationMap
      .filter((item) => (item.visible ? item.visible(perms, role) : true))
      .map((item) => {
        const children = Array.isArray(item.children)
          ? item.children
              .filter((c) => !c.visible || c.visible(perms, role))
              .map((c) => ({
                label: t(c.labelKey),
                description: c.descriptionKey ? t(c.descriptionKey) : undefined,
                to: safePath(c.to),
                active: isActive(c.to),
              }))
          : undefined

        const active = isActive(item.to) || (children?.some((c) => c.active) ?? false)

        return {
          label: t(item.labelKey),
          to: safePath(item.to),
          type: children?.length ? 'trigger' : undefined,
          children,
          active,
          defaultOpen: active,
          activeClass: 'font-semibold underline underline-offset-8',
          inactiveClass: 'opacity-80 hover:opacity-100',
        }
      })

    // Añadir "Home" si no está presente
    const homeItem: NavigationMenuItem = {
      label: t('navigation.menu.home'),
      to: safePath('/'),
      active: isActive('/'),
      activeClass: 'font-semibold underline underline-offset-8',
      inactiveClass: 'opacity-80 hover:opacity-100',
    }

    const hasHome = items.some((i) => i.to === homeItem.to)
    return hasHome ? items : [homeItem, ...items]
  })
}
