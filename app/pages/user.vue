<!-- app/pages/user.vue -->
<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <UCard>
      <template #header>
        <div class="space-y-1">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ $t('domains.user.profileTitle') }}
          </h1>
          <p class="text-sm text-neutral-600 dark:text-neutral-300">
            {{ $t('domains.user.profileDescription') }}
          </p>
        </div>
      </template>

      <div v-if="pending" class="space-y-4">
        <USkeleton class="h-6 w-1/3" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
      </div>

      <div v-else-if="error" class="text-sm text-error-600 dark:text-error-400">
        {{ errorMessage }}
      </div>

      <div v-else-if="user" class="space-y-6">
        <section class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            <UAvatar :src="avatarSrc" :name="user.username" size="3xl" />
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <UFileUpload
                v-if="!user.image"
                v-model="avatarFile"
                accept="image/png,image/jpeg,image/webp,image/avif"
                :disabled="avatarUploading"
                :ui="{
                  base: 'border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-3 text-sm transition-colors cursor-pointer hover:border-primary-500 dark:hover:border-primary-500',
                  icon: 'text-neutral-400',
                  label: 'text-sm'
                }"
              />
              <UButton
                v-else
                color="neutral"
                variant="soft"
                size="xs"
                :loading="avatarUploading"
                @click="removeAvatar"
              >
                {{ $t('domains.user.avatarRemove') }}
              </UButton>
            </div>
          </div>
          <p v-if="!user.image" class="text-xs text-neutral-500 dark:text-neutral-400">
            {{ $t('domains.user.avatarHint') }}
          </p>
          <p v-if="avatarError" class="text-xs text-error-600 dark:text-error-400">
            {{ avatarError }}
          </p>
        </section>

        <section class="space-y-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t('domains.user.infoHeading') }}
            </h2>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              {{ user.email }} · {{ user.username }}
            </p>
            <div class="flex flex-wrap gap-2 pt-2">
              <UBadge :color="statusColor(user.status)" size="sm">
                {{ statusLabel(user.status) }}
              </UBadge>
              <ClientOnly>
                <UBadge size="sm" color="info">
                  {{ formatDate(user.created_at) }}
                </UBadge>

                <template v-if="user.roles && user.roles.length">
                  <UBadge
                    v-for="role in user.roles"
                    :key="role.id"
                    size="sm"
                    color="primary"
                  >
                    {{ role.name }}
                  </UBadge>
                </template>
                <span v-else class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ $t('domains.user.noRoles') }}
                </span>
              </ClientOnly>
            </div>
          </div>

          <div class="flex justify-end">
            <UButton
              color="neutral"
              variant="soft"
              :loading="loggingOut"
              @click="handleLogout"
            >
              {{ $t('navigation.menu.logout') }}
            </UButton>
          </div>

          <USeparator />

          <ClientOnly>
            <UForm :state="accountForm" class="space-y-4" @submit.prevent="saveAccount">
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField :label="$t('domains.user.email')" required>
                  <UInput v-model="accountForm.email" type="email" required />
                </UFormField>
                <UFormField :label="$t('domains.user.username')" required>
                  <UInput v-model="accountForm.username" required />
                </UFormField>
              </div>
              <div class="flex justify-end gap-2">
                <UButton
                  type="submit"
                  :label="$t('ui.actions.save')"
                  :loading="accountSaving"
                  color="primary"
                />
              </div>
            </UForm>
          </ClientOnly>
        </section>

        <USeparator />

        <section class="space-y-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t('domains.user.passwordHeading') }}
            </h2>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              {{ $t('domains.user.passwordRequirements') }}
            </p>
          </div>
          <UForm :state="passwordForm" class="space-y-4" @submit.prevent="savePassword">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField :label="$t('domains.user.password')" required>
                <UInput v-model="passwordForm.password" type="password" required />
              </UFormField>
              <UFormField :label="$t('domains.user.confirmPassword')" required>
                <UInput v-model="passwordForm.confirmPassword" type="password" required />
              </UFormField>
            </div>
            <p v-if="passwordError" class="text-xs text-error-600 dark:text-error-400">
              {{ passwordError }}
            </p>
            <div class="flex justify-end gap-2">
              <UButton
                type="submit"
                :label="$t('domains.user.updatePassword')"
                :loading="passwordSaving"
              />
            </div>
          </UForm>
        </section>

        <USeparator />

        <section class="space-y-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Permissions
            </h2>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Efectivos desde roles/asignaciones
            </p>
            <ClientOnly>
              <div class="flex flex-wrap gap-2 pt-2">
                <template v-if="user.permissions && Object.values(user.permissions).some(Boolean)">
                  <template v-for="(v, key) in user.permissions" :key="key">
                    <UBadge
                      v-if="v"
                      size="sm"
                      color="primary"
                    >
                      {{ key }}
                    </UBadge>
                  </template>
                </template>
                <span
                  v-else
                  class="text-xs text-neutral-500 dark:text-neutral-400"
                >
                  No permissions
                </span>
              </div>
            </ClientOnly>
          </div>
        </section>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n, useToast } from '#imports'

import { useUser } from '~/composables/useUser'
import { useAuth } from '@/composables/auth/useAuth'
import { getErrorMessage } from '@/utils/error'

// File input type - can be File, Event, FileList, or object with file property
type FileInput = File | Event | FileList | { file?: File | null } | null | undefined

definePageMeta({
  layout: 'default'
})

const { t } = useI18n()
const toast = useToast()
const { user, loading: pending, error, updateCurrentUser } = useUser()
const { logout, loggingOut } = useAuth()

const accountForm = reactive({
  email: user.value?.email ?? '',
  username: user.value?.username ?? ''
})

const passwordForm = reactive({
  password: '',
  confirmPassword: ''
})

const statusForm = reactive({
  status: user.value?.status ?? 'active'
})

const avatarUploading = ref(false)
const avatarError = ref('')
const avatarFile = ref<File | null>(null)

const extractFile = (input: FileInput): File | null => {
  if (!input) {
    return null
  }

  if (input instanceof File) {
    return input
  }

  if (input instanceof Event) {
    const event = input as DragEvent | InputEvent
    const dtFiles = (event as DragEvent).dataTransfer?.files
    if (dtFiles?.length) {
      return dtFiles.item(0)
    }

    const target = event.target as HTMLInputElement | null
    if (target?.files?.length) {
      return target.files.item(0)
    }
  }

  if (typeof input === 'object') {
    if (input instanceof FileList) {
      return input.item(0)
    }

    if ('files' in input && (input as { files?: FileList | File[] }).files) {
      const files = (input as { files?: FileList | File[] }).files
      if (files instanceof FileList) {
        return files.item(0)
      }
      if (Array.isArray(files)) {
        return extractFile(files)
      }
    }
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      const file = extractFile(item)
      if (file) {
        return file
      }
    }
    return null
  }

  if (typeof input === 'object' && 'file' in input) {
    const candidate = (input as { file?: File | null }).file
    return candidate instanceof File ? candidate : null
  }

  return null
}

const normalizeFileInput = (value: FileInput): File | null => extractFile(value)

watch(user, (value) => {
  if (!value) {
    return
  }
  accountForm.email = value.email
  accountForm.username = value.username
  statusForm.status = value.status
}, { immediate: true })

const accountSaving = ref(false)
const passwordSaving = ref(false)
const statusSaving = ref(false)
const statusSaved = ref(false)
const passwordError = ref('')

watch(avatarFile, async (file) => {
  if (!file || avatarUploading.value) {
    return
  }

  await handleAvatarUpload(file)
})

const errorMessage = computed(() => error.value ? getErrorMessage(error.value, t('ui.notifications.error')) : t('ui.notifications.error'))

const avatarSrc = computed(() => {
  const image = user.value?.image
  if (!image) return undefined
  // Si empieza por "img/" o "/img/", lo usamos directo
  if (image.startsWith('/img/')) return image
  if (image.startsWith('img/')) return `/${image}`
  // Si empieza por "avatars/", lo anteponemos correctamente
  if (image.startsWith('avatars/')) return `/img/${image}`
  // Fallback
  return `/img/${image}`
})


const statusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return t('domains.user.statusActive')
    case 'inactive':
      return t('domains.user.statusInactive')
    case 'suspended':
      return t('domains.user.statusSuspended')
    default:
      return status
  }
}

const statusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'neutral'
    case 'suspended':
      return 'warning'
    default:
      return 'neutral'
  }
}

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value))
  } catch {
    return value
  }
}

const saveAccount = async () => {
  if (!user.value) {
    return
  }

  accountSaving.value = true

  try {
    await updateCurrentUser({
      email: accountForm.email,
      username: accountForm.username
    })
    toast.add({
      title: t('ui.notifications.updateSuccess'),
      color: 'success'
    })
  } catch (err) {
    toast.add({
      title: t('ui.notifications.error'),
      description: (err as Error)?.message,
      color: 'error'
    })
  } finally {
    accountSaving.value = false
  }
}

const savePassword = async () => {
  if (!user.value) {
    return
  }

  if (!passwordForm.password || passwordForm.password.length < 8) {
    passwordError.value = t('domains.user.passwordRequirements')
    return
  }

  if (passwordForm.password !== passwordForm.confirmPassword) {
    passwordError.value = t('domains.user.passwordMismatch')
    return
  }

  passwordError.value = ''
  passwordSaving.value = true

  try {
    await updateCurrentUser({
      password: passwordForm.password
    })
    passwordForm.password = ''
    passwordForm.confirmPassword = ''
    toast.add({
      title: t('domains.user.updatePassword'),
      color: 'success'
    })
  } catch (err) {
    toast.add({
      title: t('ui.notifications.error'),
      description: (err as Error)?.message,
      color: 'error'
    })
  } finally {
    passwordSaving.value = false
  }
}

const _saveStatus = async () => {
  if (!user.value) {
    return
  }

  statusSaving.value = true
  statusSaved.value = false

  try {
    await updateCurrentUser({
      status: statusForm.status
    })
    statusSaved.value = true
    toast.add({
      title: t('domains.user.updateStatus'),
      color: 'success'
    })
  } catch (err) {
    toast.add({
      title: t('ui.notifications.error'),
      description: (err as Error)?.message,
      color: 'error'
    })
  } finally {
    statusSaving.value = false
    setTimeout(() => {
      statusSaved.value = false
    }, 2000)
  }
}

const handleAvatarUpload = async (payload: unknown) => {
  const file = normalizeFileInput(payload)

  if (!file) {
    avatarError.value = t('domains.user.avatarUploadError')
    return
  }

  avatarUploading.value = true
  avatarError.value = ''


  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch<{ success: boolean; url: string; path: string }>(`/api/uploads?type=avatars`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    if (!response?.success || !response.url || !response.path) {
      throw new Error(t('domains.user.avatarUploadError'))
    }

    const storedPath = response.path.startsWith('/img/') ? response.path.slice(5) : response.path

    await updateCurrentUser({ image: storedPath })

    toast.add({
      title: t('domains.user.avatarUpdated'),
      color: 'success'
    })
  } catch (err) {
    const message = getErrorMessage(err, t('domains.user.avatarUploadError'))
    avatarError.value = message
    toast.add({
      title: t('ui.notifications.error'),
      description: message,
      color: 'error'
    })
  } finally {
    avatarUploading.value = false
  }
}

const removeAvatar = async () => {
  if (!user.value?.image) {
    return
  }

  avatarUploading.value = true
  avatarError.value = ''

  try {
    await updateCurrentUser({ image: null })
    toast.add({
      title: t('domains.user.avatarRemoved'),
      color: 'success'
    })
  } catch (err) {
    const message = getErrorMessage(err, t('domains.user.avatarRemoveError'))
    avatarError.value = message
    toast.add({
      title: t('ui.notifications.error'),
      description: message,
      color: 'error'
    })
  } finally {
    avatarUploading.value = false
  }
}

const handleLogout = async () => {
  try {
    await logout()
  } catch (error) {
    toast.add({
      title: t('features.auth.logoutError'),
      description: (error as Error)?.message,
      color: 'error'
    })
  }
}
</script>
