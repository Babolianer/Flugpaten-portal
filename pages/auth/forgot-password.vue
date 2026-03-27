<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()
const email = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  success.value = false
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value.trim() },
    })
    success.value = true
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || t('forgotPassword.error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-8 sm:py-12">
    <div class="w-full max-w-md min-w-0">
      <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 text-center">{{ t('forgotPassword.title') }}</h1>
      <p class="text-slate-600 text-sm mb-6 text-center">{{ t('forgotPassword.description') }}</p>

      <form
        v-if="!success"
        class="p-5 sm:p-8 rounded-xl bg-white shadow-lg border border-slate-200"
        @submit.prevent="submit"
      >
        <div v-if="error" class="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
          {{ error }}
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('login.email') }}</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            :placeholder="t('register.email')"
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium disabled:opacity-50 transition-colors min-h-[48px]"
        >
          {{ loading ? t('forgotPassword.sending') : t('forgotPassword.submit') }}
        </button>
        <p class="mt-4 text-center text-sm text-slate-600">
          <NuxtLink to="/login" class="text-amber-600 hover:underline">{{ t('forgotPassword.backToLogin') }}</NuxtLink>
        </p>
      </form>

      <div v-else class="p-5 sm:p-8 rounded-xl bg-white shadow-lg border border-slate-200 text-center">
        <p class="text-green-600 font-medium mb-4">{{ t('forgotPassword.success') }}</p>
        <NuxtLink
          to="/login"
          class="inline-block px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium"
        >
          {{ t('forgotPassword.toLogin') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
