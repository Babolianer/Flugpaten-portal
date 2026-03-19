<script setup lang="ts">
definePageMeta({ layout: false })

const { t } = useI18n()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const { fetchUser, user } = useAuth()

// Admin-Bypass Modal
const showBypassModal = ref(false)
const bypassPassword = ref('')
const bypassError = ref('')
const bypassLoading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await fetchUser()
    const role = user.value?.role
    if (role === 'USER') {
      error.value = t('maintenance.loginUserNotAllowed')
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      return
    }
    if (role === 'ORG_USER') {
      const data = await $fetch<{ memberships?: { status: string }[] }>('/api/auth/me')
      const hasApprovedOrg = data.memberships?.some((m) => m.status === 'APPROVED')
      if (!hasApprovedOrg) {
        error.value = t('maintenance.loginOrgPending')
        await $fetch('/api/auth/logout', { method: 'POST' })
        user.value = null
        return
      }
    }
    if (role === 'ADMIN') {
      await navigateTo('/admin')
    } else if (role === 'ORG_USER') {
      await navigateTo('/org/dashboard')
    } else {
      await navigateTo('/')
    }
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || t('login.error')
  } finally {
    loading.value = false
  }
}

async function submitBypass() {
  bypassError.value = ''
  bypassLoading.value = true
  try {
    await $fetch('/api/auth/maintenance-login', {
      method: 'POST',
      body: { password: bypassPassword.value },
    })
    showBypassModal.value = false
    bypassPassword.value = ''
    await navigateTo('/register')
  } catch (e: unknown) {
    bypassError.value = (e as { data?: { message?: string } })?.data?.message || t('maintenance.bypassError')
  } finally {
    bypassLoading.value = false
  }
}

function openBypassModal() {
  bypassError.value = ''
  bypassPassword.value = ''
  showBypassModal.value = true
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-amber-50 via-white to-slate-50 flex flex-col items-center justify-center p-6">
    <div class="w-full max-w-md">
      <div class="mb-6">
        <NuxtLink to="/maintenance" class="text-sm text-slate-600 hover:text-amber-600 font-medium transition-colors inline-flex items-center gap-1">
          ← {{ t('maintenance.backToStart') }}
        </NuxtLink>
      </div>
      <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8">
        <h1 class="text-xl font-bold text-slate-900 mb-6">{{ t('login.title') }}</h1>
        <form @submit.prevent="submit" class="space-y-4">
          <div v-if="error" class="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
            {{ error }}
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('login.email') }}</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('login.password') }}</label>
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              :placeholder="t('maintenance.passwordPlaceholder')"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {{ loading ? t('login.submitting') : t('login.submit') }}
          </button>
        </form>
        <p class="mt-6 text-center text-sm text-slate-600">
          <NuxtLink to="/maintenance/register" class="text-amber-600 hover:text-amber-700 font-medium hover:underline">{{ t('login.noAccount') }} {{ t('nav.register') }}</NuxtLink>
        </p>

        <!-- Admin-Link (unten) -->
        <p class="mt-8 pt-6 border-t border-slate-200 text-center">
          <button
            type="button"
            class="text-sm text-slate-500 hover:text-slate-700 hover:underline"
            @click="openBypassModal"
          >
            {{ t('maintenance.adminLink') }}
          </button>
        </p>
      </div>
    </div>

    <!-- Admin-Bypass Modal -->
    <Teleport to="body">
      <div
        v-if="showBypassModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        @click.self="showBypassModal = false"
      >
        <div class="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm border border-slate-200 relative" role="dialog" aria-labelledby="bypass-title">
          <button
            type="button"
            class="absolute top-3 right-3 inline-flex items-center justify-center h-10 w-10 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            :aria-label="t('common.close')"
            @click="showBypassModal = false"
          >
            <span class="text-2xl leading-none">×</span>
          </button>
          <h2 id="bypass-title" class="text-base font-medium text-slate-800 mb-4">{{ t('maintenance.bypassTitle') }}</h2>
          <form @submit.prevent="submitBypass" class="space-y-4">
            <div v-if="bypassError" class="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
              {{ bypassError }}
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('maintenance.bypassLabel') }}</label>
              <input
                v-model="bypassPassword"
                type="password"
                required
                autocomplete="current-password"
                class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                :placeholder="t('maintenance.passwordPlaceholder')"
              />
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                @click="showBypassModal = false"
              >
                {{ t('orgDashboard.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="bypassLoading"
                class="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-50"
              >
                {{ bypassLoading ? '…' : t('maintenance.bypassSubmit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
