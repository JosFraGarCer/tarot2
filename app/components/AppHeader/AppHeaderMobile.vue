<!-- app/components/AppHeader/AppHeaderMobile.vue -->
<script setup lang="ts">
import { en, es } from '@nuxt/ui/locale'
import { useI18n } from 'vue-i18n'
import { useLocalePath, useSwitchLocalePath } from '#i18n'
import { useAuth } from '~/composables/auth/useAuth'
import { useNavigationMenu } from '~/composables/common/useNavigationMenu'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { user, logout } = useAuth()

// Unified, reactive nav items
const navItems = useNavigationMenu()
</script>

<template>
  <!-- Header móvil con slideover -->
  <UHeader
    :toggle="{ icon: 'i-heroicons-bars-3', color: 'neutral', variant: 'ghost' }"
    toggle-side="left"
    mode="slideover"
    :menu="{ side: 'left' }"
    class="md:hidden"
  >
    <!-- Título -->
    <template #title>
      <NuxtLink :to="localePath('/')" class="font-semibold text-lg tracking-tight hover:opacity-80">
        {{ $t('app.title') }}
      </NuxtLink>
    </template>

    <!-- Cuerpo del menú -->
    <template #body>
      <div class="flex h-full flex-col">
        <!-- Navegación vertical -->
        <UNavigationMenu orientation="vertical" :items="navItems" class="-mx-2.5" />

        <!-- 🌐 Selector de idioma -->
        <div class="mt-4 px-2.5 border-t border-default/50 pt-4">
          <ULocaleSelect
            :model-value="locale"
            :locales="[en, es]"
            size="sm"
            variant="ghost"
            class="w-full"
            :aria-label="$t('nav.changeLanguage')"
            @update:model-value="(code) => {
              const path = switchLocalePath(code as any)
              if (path) navigateTo(path)
            }"
          />
        </div>

        <!-- 👤 Usuario -->
        <div v-if="user" class="mt-auto pt-4 border-t border-default/50">
          <div class="flex items-center justify-between px-2.5">
            <div class="flex items-center gap-3">
              <UAvatar
                v-if="user.image"
                :src="user.image.startsWith('http') ? user.image : `/img/${user.image}`"
                :alt="user.username"
                size="md"
              />
              <div class="text-sm">
                <p class="font-medium">{{ user.username }}</p>
              </div>
            </div>
          </div>

          <div class="mt-2 grid gap-1 px-2.5">
            <ULink :to="localePath('/user')" class="px-2 py-2 rounded-md text-sm hover:bg-elevated/50">
              {{ t('nav.userProfile') }}
            </ULink>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              class="justify-start"
              icon="i-heroicons-arrow-left-on-rectangle"
              @click="logout"
            >
              {{ t('nav.logout') }}
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UHeader>
</template>
