<!-- app/pages/login.vue -->
<template>
  <div class="max-w-md mx-auto py-10">
    <UCard>
      <template #header>
        <div class="space-y-2 text-center">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ $t('auth.loginTitle') }}
          </h1>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ $t('auth.loginDescription') }}
          </p>
        </div>
      </template>

      <UForm :state="form" class="space-y-5" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <UFormField :label="$t('auth.identifierLabel')" required>
            <UInput
              v-model="form.identifier"
              :placeholder="$t('auth.identifierPlaceholder')"
              autocomplete="username"
              required
            />
          </UFormField>

          <UFormField :label="$t('auth.passwordLabel')" required>
            <UInput
              v-model="form.password"
              type="password"
              :placeholder="$t('auth.passwordPlaceholder')"
              autocomplete="current-password"
              required
            />
          </UFormField>
        </div>

        <p v-if="errorMessage" class="text-xs text-error-600 dark:text-error-400">
          {{ errorMessage }}
        </p>

        <UButton
          block
          type="submit"
          color="primary"
          :loading="loading"
        >
          {{ $t('auth.loginButton') }}
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '#imports'
import { useAuth } from '@/composables/auth/useAuth'

definePageMeta({
  layout: 'default'
})

const { t } = useI18n()
const router = useRouter()
const { login, user, error, loading, isAuthenticated } = useAuth()

const form = reactive({
  identifier: '',
  password: ''
})

const errorMessage = computed(() => error.value || '')

// Si ya está logueado, redirige automáticamente
watch(isAuthenticated, (logged) => {
  if (logged) {
    router.push('/user')
  }
})

async function handleSubmit() {
  if (!form.identifier.trim() || !form.password.trim()) {
    return
  }

  try {
    await login(form.identifier, form.password)
  } catch (err) {
    console.warn('Login failed:', err)
  }
}
</script>
