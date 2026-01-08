<!-- app/components/AppHeader/AppHeaderDesktop.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { en, es } from '@nuxt/ui/locale'
import { useI18n } from 'vue-i18n'
import { useLocalePath, useSwitchLocalePath } from '#i18n'
import { useAuth } from '~/composables/auth/useAuth'
import { useNavigationMenu } from '~/composables/common/useNavigationMenu'
import NotificationHistory from '~/components/common/NotificationHistory.vue'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { user, logout } = useAuth()

// Unified, reactive menu
const navigationItems = useNavigationMenu()

/** User dropdown */
const itemsUser = computed(() => [
  [
    { label: t('navigation.menu.userProfile'), icon: 'i-heroicons-user', to: localePath('/user') }
  ],
  [
    {
      label: t('navigation.menu.logout'),
      icon: 'i-heroicons-arrow-left-on-rectangle',
      onSelect: async (e: Event) => {
        e?.preventDefault?.()
        await logout()
      }
    }
  ]
])
</script>

<template>
  <header
    class="hidden md:flex items-center justify-between gap-8 h-16 px-8 border-b bg-background/80 z-10 backdrop-blur"
  >
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <NuxtLink
        :to="localePath('/')"
        class="group flex items-center gap-2 focus:outline-none"
      >
        <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-primary shadow-sm group-hover:scale-105 transition-transform">
          <span class="text-white font-bold text-xl">T</span>
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-base leading-tight tracking-tight text-neutral-900 dark:text-neutral-50 group-hover:text-primary transition-colors">
            {{ $t('app.brand.title') }}
          </span>
          <span class="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 leading-none">
            v2.0
          </span>
        </div>
      </NuxtLink>
    </div>

    <!-- Navegación principal -->
    <UNavigationMenu :items="navigationItems" class="flex-1 justify-center">
      <template #item-label="{ item }">
        <div class="flex flex-col">
          <span class="text-sm font-medium">{{ item.label }}</span>
          <span v-if="item.description" class="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
            {{ item.description }}
          </span>
        </div>
      </template>
    </UNavigationMenu>

    <!-- Lado derecho -->
    <div class="flex items-center gap-3 pl-4 border-l border-neutral-200 dark:border-neutral-800">
      <!-- Historial de Notificaciones -->
      <NotificationHistory />

      <!-- Selector de idioma (UI style) -->
      <ULocaleSelect
        :model-value="locale"
        :locales="[en, es]"
        size="sm"
        variant="ghost"
        class="w-32"
        :aria-label="$t('navigation.menu.changeLanguage')"
        @update:model-value="(code) => { const path = switchLocalePath(code as any); if (path) navigateTo(path) }"
      />

      <!-- Menú usuario -->
      <ClientOnly>
        <UDropdownMenu
          v-if="user"
          :items="itemsUser"
          :content="{ align: 'end', sideOffset: 8 }"
          aria-label="User menu"
        >
            <UAvatar
              v-if="user.image"
              :src="user.image.startsWith('http') ? user.image : `/img/${user.image}`"
              :alt="user.username"
              size="md"
              class="cursor-pointer"
            />
            <UBadge v-else>
              {{ user.username || 'User' }}
            </UBadge>
        </UDropdownMenu>
        <template #fallback>
          <div class="h-8 w-8 rounded-md bg-muted" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>
  </header>
</template>
