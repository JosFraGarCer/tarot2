<!-- app/components/AppHeader/AppHeaderDesktop.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { en, es } from '@nuxt/ui/locale'
import { useI18n } from 'vue-i18n'
import { useLocalePath, useSwitchLocalePath } from '#i18n'
import { useAuth } from '~/composables/auth/useAuth'
import { useNavigationMenu } from '~/composables/common/useNavigationMenu'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { user, logout } = useAuth()

// Unified, reactive menu
const navigationItems = useNavigationMenu()

/** User dropdown */
const itemsUser = computed(() => [
  [
    { label: t('nav.userProfile'), icon: 'i-heroicons-user', to: localePath('/user') }
  ],
  [
    {
      label: t('nav.logout'),
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
    <NuxtLink
      :to="localePath('/')"
      class="font-semibold text-lg tracking-tight hover:opacity-80"
    >
      {{ $t('app.title') }}
    </NuxtLink>

    <!-- Navegación principal -->
    <UNavigationMenu :items="navigationItems" class="flex-1 justify-center" />

    <!-- Lado derecho -->
    <div class="flex items-center gap-4">
      <!-- Selector de idioma (UI style) -->
      <ULocaleSelect
        :model-value="locale"
        :locales="[en, es]"
        size="sm"
        variant="ghost"
        class="w-28"
        :aria-label="$t('nav.changeLanguage')"
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
