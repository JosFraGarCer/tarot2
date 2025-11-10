<!-- app/components/admin/users/ManageUsers.vue -->
<template>
  <div class="px-4 py-6">
    <ClientOnly>
      <template #fallback>
        <div class="space-y-4">
          <USkeleton class="h-8 w-64" />
          <USkeleton class="h-64 w-full" />
        </div>
      </template>
      <template #default>
        <UCard>
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ tt('features.admin.usersTitle', 'Users') }}
                </h1>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {{ tt('features.admin.usersSubtitle', 'Invite, update or disable staff accounts and roles.') }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <ViewControls
                  v-model="manageViewMode"
                  class="shrink-0"
                  :template-options="cartaTemplateOptions"
                  storage-key="admin-users"
                />
                <UButton
                  color="neutral"
                  variant="soft"
                  icon="i-heroicons-arrow-path"
                  :loading="loading"
                  :label="tt('ui.actions.refresh', 'Refresh')"
                  @click="refresh"
                />
                <UButton
                  color="primary"
                  icon="i-heroicons-plus"
                  :label="tt('ui.actions.new', 'New user')"
                  @click="openCreate"
                />
              </div>
            </div>
          </template>

          <div class="flex flex-wrap items-center gap-3 mb-4">
            <UInput
              v-model="search"
              :placeholder="tt('ui.actions.search', 'Search')"
              icon="i-heroicons-magnifying-glass"
              class="w-full sm:w-64"
            />
            <USelectMenu
              v-model="status"
              class="w-full sm:w-44"
              :items="statusOptions"
              value-key="value"
              option-attribute="label"
            />
            <USelectMenu
              v-model="roleId"
              class="w-full sm:w-60"
              :items="roleOptions"
              value-key="value"
              option-attribute="label"
              searchable
              clearable
              :loading="rolesPending"
              :placeholder="tt('features.admin.users.roleFilter', 'Filter by role')"
            />
          </div>

          <UserTable
            v-if="viewMode === 'table'"
            :crud="crud"
            :label="tt('features.admin.usersTitle', 'Users')"
            :columns="columns"
            @edit="openEdit"
            @delete="openDelete"
            @create="openCreate"
            @reset-filters="resetFilters"
          />
          <UserListClassic
            v-else-if="viewMode === 'classic'"
            :users="users"
            @edit="openEdit"
            @delete="openDelete"
          />
          <UserCardsGrid
            v-else-if="viewMode === 'card'"
            :users="users"
            @edit="openEdit"
            @delete="openDelete"
          />
          <UserCartaView
            v-else
            :users="users"
            @edit="openEdit"
            @delete="openDelete"
          />

          <PaginationControls
            class="mt-6"
            :page="pageForUi"
            :page-size="pageSizeForUi"
            :total-items="totalItemsForUi"
            :total-pages="totalPagesForUi"
            :has-server-pagination="true"
            :page-size-items="pageSizeItems"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </UCard>
      </template>
    </ClientOnly>

    <UModal v-model:open="modalOpen" :title="modalTitle">
      <template #body>
        <UForm class="space-y-4" @submit.prevent="saveUser">
          <UFormField :label="tt('common.username', 'Username')">
            <UInput class="w-full" v-model="form.username" autocomplete="off" />
          </UFormField>
          <UFormField :label="tt('common.email', 'Email')">
            <UInput class="w-full" v-model="form.email" type="email" autocomplete="off" />
          </UFormField>
          <UFormField :label="tt('common.password', 'Password')" :description="passwordDescription">
            <UInput class="w-full" v-model="form.password" type="password" autocomplete="new-password" />
          </UFormField>
          <div class="flex flex-wrap items-start gap-4">
            <UFormField :label="tt('common.roles', 'Roles')" class="w-full sm:flex-1">
              <USelectMenu
                 class="w-full"
                v-model="form.role_ids"
                :items="roleOptions"
                value-key="value"
                option-attribute="label"
                searchable
                multiple
                clearable
              />
            </UFormField>
            <UFormField :label="tt('ui.fields.status', 'Status')" class="w-full sm:w-48">
              <USelectMenu
               class="w-full"
                v-model="form.status"
                :items="statusValueOptions"
                value-key="value"
                option-attribute="label"
              />
            </UFormField>
          </div>
        </UForm>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" :disabled="saving" :label="tt('ui.actions.cancel', 'Cancel')" @click="closeModal" />
          <UButton color="primary" :loading="saving" :disabled="!canSubmit" :label="tt('ui.actions.save', 'Save')" @click="saveUser" />
        </div>
      </template>
    </UModal>

    <ConfirmDeleteModal
      :open="deleteOpen"
      :title="tt('features.admin.users.deleteTitle', 'Delete user')"
      :description="deleteDescription"
      :confirm-label="tt('ui.dialogs.confirm.deleteConfirm', 'Delete')"
      :cancel-label="tt('ui.actions.cancel', 'Cancel')"
      :loading="deleting"
      @update:open="value => (deleteOpen = value)"
      @confirm="confirmDelete"
      @cancel="() => (deleteOpen = false)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useDebounceFn, useStorage } from '@vueuse/core'
import { useI18n, useLazyAsyncData, useSeoMeta, useToast } from '#imports'
import { useAdminUsersCrud } from '@/composables/admin/useUsers'
import UserTable from '@/components/admin/users/UserTable.vue'
import UserListClassic from '@/components/admin/users/UserListClassic.vue'
import UserCardsGrid from '@/components/admin/users/UserCardsGrid.vue'
import UserCartaView from '@/components/admin/users/UserCartaView.vue'
import ViewControls from '@/components/manage/ViewControls.vue'
import PaginationControls from '@/components/common/PaginationControls.vue'
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal.vue'
import { useApiFetch } from '@/utils/fetcher'

const { t, te } = useI18n()
const toast = useToast()

function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

useSeoMeta({ title: `${tt('navigation.menu.admin', 'Admin')} · ${tt('features.admin.usersTitle', 'Users')}` })

const crud = useAdminUsersCrud()
const { filters, pagination, fetchList, create, update, remove } = crud

const loading = computed(() => crud.loading?.value ?? false)

const search = ref(filters.search ?? '')
const status = ref<string>((filters.status as string) ?? 'all')
const roleId = ref<number | undefined>(filters.role_id)

const statusOptions = computed(() => [
  { label: tt('ui.filters.all', 'All'), value: 'all' },
  { label: tt('system.status.active', 'Active'), value: 'active' },
  { label: tt('system.status.inactive', 'Inactive'), value: 'inactive' },
  { label: tt('system.status.suspended', 'Suspended'), value: 'suspended' },
  { label: tt('system.status.banned', 'Banned'), value: 'banned' },
  { label: tt('system.status.pending', 'Pending'), value: 'pending' },
])

const statusValueOptions = computed(() => [
  { label: tt('system.status.active', 'Active'), value: 'active' },
  { label: tt('system.status.inactive', 'Inactive'), value: 'inactive' },
  { label: tt('system.status.suspended', 'Suspended'), value: 'suspended' },
  { label: tt('system.status.banned', 'Banned'), value: 'banned' },
  { label: tt('system.status.pending', 'Pending'), value: 'pending' },
])

const { data: rolesData, pending: rolesPending, refresh: refreshRoles } = useLazyAsyncData('admin-roles', () =>
  useApiFetch('/role', { method: 'GET', params: { pageSize: 100 } }),
  { server: false },
)

const roleOptions = computed(() => {
  const raw = rolesData.value
  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.results)
        ? raw.results
        : []
  const allOption = { label: tt('ui.filters.all', 'All'), value: null }
  const mapped = rows.map((role: any) => ({ label: role?.name ?? `#${role?.id ?? ''}`, value: role?.id }))
  return [allOption, ...mapped]
})

const columns = computed(() => [
  {
    accessorKey: 'email',
    header: tt('common.email', 'Email'),
  },
  {
    accessorKey: 'roles',
    header: tt('common.roles', 'Roles'),
    cell: ({ row }: any) => {
      const roles = Array.isArray(row.raw?.roles) ? row.raw.roles : []
      return roles.map((role: any) => role?.name).filter(Boolean).join(', ')
    },
  },
  {
    accessorKey: 'status',
    header: tt('ui.fields.status', 'Status'),
  },
  {
    accessorKey: 'created_at',
    header: tt('ui.misc.createdAt', 'Created at'),
  },
])

const pageForUi = computed(() => pagination.value?.page ?? 1)
const pageSizeForUi = computed(() => pagination.value?.pageSize ?? 20)
const totalItemsForUi = computed(() => pagination.value?.totalItems ?? (crud.items?.value?.length ?? 0))
const totalPagesForUi = computed(() => {
  const size = Math.max(1, pageSizeForUi.value)
  return Math.max(1, Math.ceil((totalItemsForUi.value || 0) / size))
})
const pageSizeItems = computed(() => [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
])

type AdminViewMode = 'table' | 'classic' | 'card' | 'carta'
type ManageViewMode = 'tabla' | 'classic' | 'tarjeta' | 'carta'

const mapAdminToManage = (mode: AdminViewMode): ManageViewMode => {
  switch (mode) {
    case 'card':
      return 'tarjeta'
    case 'table':
      return 'tabla'
    case 'classic':
      return 'classic'
    case 'carta':
    default:
      return 'carta'
  }
}

const mapManageToAdmin = (mode: ManageViewMode): AdminViewMode => {
  switch (mode) {
    case 'tarjeta':
      return 'card'
    case 'tabla':
      return 'table'
    case 'classic':
      return 'classic'
    case 'carta':
    default:
      return 'carta'
  }
}

const viewMode = useStorage<AdminViewMode>('admin-users:view-mode', 'table')

const manageViewMode = computed<ManageViewMode>({
  get: () => mapAdminToManage(viewMode.value),
  set: (mode) => {
    viewMode.value = mapManageToAdmin(mode)
  },
})

const cartaTemplateOptions: { label: string; value: string }[] = []

const initialized = ref(false)

const applyFilters = async () => {
  filters.search = search.value || undefined
  filters.status = status.value !== 'all' ? status.value : undefined
  filters.role_id = roleId.value ?? undefined
  pagination.value.page = 1
  await fetchList()
}

const debouncedFilters = useDebounceFn(async () => {
  if (!initialized.value) return
  await applyFilters()
}, 250)

watch([search, status, roleId], () => {
  debouncedFilters()
})

const refresh = async () => {
  await fetchList()
}

const handlePageChange = async (next: number) => {
  pagination.value.page = next
  await fetchList()
}

const handlePageSizeChange = async (next: number) => {
  pagination.value.pageSize = next
  pagination.value.page = 1
  await fetchList()
}

const resetFilters = async () => {
  search.value = ''
  status.value = 'all'
  roleId.value = undefined
  await applyFilters()
}

const users = computed(() => crud.items?.value ?? [])

onMounted(async () => {
  await refreshRoles()
  await fetchList()
  initialized.value = true
})

const modalOpen = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  username: '',
  email: '',
  password: '',
  role_ids: [] as number[],
  status: 'active',
})

const modalTitle = computed(() => editingId.value ? tt('features.admin.users.editTitle', 'Edit user') : tt('features.admin.users.createTitle', 'Create user'))

const passwordDescription = computed(() => editingId.value
  ? tt('features.admin.users.passwordOptional', 'Leave blank to keep current password.')
  : tt('features.admin.users.passwordRequired', 'Minimum 6 characters.'))

const canSubmit = computed(() => {
  if (!form.username.trim() || !form.email.trim() || !form.role_ids.length) return false
  if (!editingId.value && form.password.trim().length < 6) return false
  return true
})

const deleteOpen = ref(false)
const deleting = ref(false)
const userToDelete = ref<any>(null)

const deleteDescription = computed(() => tt('features.admin.users.deleteDescription', 'This action will permanently remove the user and revoke their access.'))

function resetForm() {
  form.username = ''
  form.email = ''
  form.password = ''
  form.role_ids = []
  form.status = 'active'
  // no is_active
}

function openCreate() {
  editingId.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row: any) {
  const user = row?.raw ?? row
  if (!user) return
  editingId.value = Number(user.id)
  form.username = user.username ?? ''
  form.email = user.email ?? ''
  form.password = ''
  form.role_ids = Array.isArray(user.roles) ? user.roles.map((role: any) => role?.id).filter((id: any) => typeof id === 'number') : []
  form.status = typeof user.status === 'string' ? user.status : 'active'
  // no is_active
  modalOpen.value = true
}

function closeModal() {
  if (saving.value) return
  modalOpen.value = false
}

function formatError(err: any): string {
  if (!err) return tt('ui.notifications.error', 'Error')
  const status = err?.statusCode || err?.status || err?.response?.status
  if (status === 400 || status === 422) return err?.data?.message || tt('errors.validation', 'Please review the fields and try again.')
  if (status === 403) return tt('errors.forbidden', 'You do not have permission to perform this action.')
  return err?.data?.message || err?.message || String(err)
}

const saveUser = async () => {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const basePayload: any = {
      username: form.username.trim(),
      email: form.email.trim(),
      status: form.status,
      role_ids: [...form.role_ids],
    }

    if (editingId.value) {
      if (form.password.trim().length >= 6) {
        basePayload.password = form.password.trim()
      }
      await update(editingId.value, basePayload)
      toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.admin.users.updated', 'User updated successfully'), color: 'success' })
    } else {
      basePayload.password = form.password.trim()
      await create(basePayload)
      toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.admin.users.created', 'User invited successfully'), color: 'success' })
    }

    modalOpen.value = false
    await fetchList()
  } catch (err: any) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: formatError(err), color: 'error' })
  } finally {
    saving.value = false
  }
}

function openDelete(row: any) {
  userToDelete.value = row?.raw ?? row
  if (!userToDelete.value) return
  deleteOpen.value = true
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  deleting.value = true
  try {
    await remove(userToDelete.value.id)
    toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('ui.notifications.deleteSuccess', 'Deleted successfully'), color: 'success' })
    deleteOpen.value = false
    userToDelete.value = null
    await fetchList()
  } catch (err: any) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: formatError(err), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
