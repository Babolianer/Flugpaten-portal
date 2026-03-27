<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const { t } = useI18n()
const token = computed(() => (route.query.token as string) || '')
const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (password.value !== passwordConfirm.value) {
    error.value = t('resetPassword.passwordMismatch')
    return
  }
  if (password.value.length < 8) {
    error.value = t('resetPassword.passwordTooShort')
    return
  }
  loading.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token: token.value, password: password.value },
    })
    success.value = true
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || t('resetPassword.error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-8 sm:py-12">
    <div class="w-full max-w-md min-w-0">
      <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 text-center">{{ t('resetPassword.title') }}</h1>

      <div v-if="!token" class="p-5 sm:p-8 rounded-xl bg-white shadow-lg border border-slate-200">
        <p class="text-slate-600 mb-4">{{ t('resetPassword.noToken') }}</p>
        <NuxtLink to="/auth/forgot-password" class="text-amber-600 hover:underline">{{ t('forgotPassword.title') }}</NuxtLink>
      </div>

      <form
        v-else-if="!success"
        class="p-5 sm:p-8 rounded-xl bg-white shadow-lg border border-slate-200"
        @submit.prevent="submit"
      >
        <div v-if="error" class="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
          {{ error }}
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resetPassword.newPassword') }}</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            :placeholder="t('resetPassword.passwordPlaceholder')"
          />
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resetPassword.confirmPassword') }}</label>
          <input
            v-model="passwordConfirm"
            type="password"
            required
            minlength="8"
            class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            :placeholder="t('resetPassword.passwordPlaceholder')"
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium disabled:opacity-50 transition-colors min-h-[48px]"
        >
          {{ loading ? t('resetPassword.saving') : t('resetPassword.submit') }}
        </button>
      </form>

      <div v-else class="p-5 sm:p-8 rounded-xl bg-white shadow-lg border border-slate-200 text-center">
        <p class="text-green-600 font-medium mb-4">{{ t('resetPassword.success') }}</p>
        <NuxtLink
          to="/login"
          class="inline-block px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium"
        >
          {{ t('nav.login') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
