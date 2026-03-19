<script setup lang="ts">
const { t } = useI18n()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const route = useRoute()
const redirect = computed(() => (route.query.redirect as string) || '/dashboard')
const { fetchUser, user } = useAuth()

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await fetchUser()
    const target = redirect.value
    const role = user.value?.role
    if (role === 'ADMIN' && (target === '/dashboard' || !route.query.redirect)) {
      await navigateTo('/admin')
    } else if (role === 'ORG_USER' && (target === '/dashboard' || !route.query.redirect)) {
      await navigateTo('/org/dashboard')
    } else {
      await navigateTo(target)
    }
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || t('login.error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-8 sm:py-12">
    <div class="w-full max-w-md min-w-0">
      <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 text-center">{{ t('login.title') }}</h1>
      <form
        class="p-5 sm:p-8 rounded-xl bg-white shadow-lg border border-slate-200"
        @submit.prevent="submit"
      >
        <div v-if="error" class="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
          {{ error }}
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('login.email') }}</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('login.password') }}</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium disabled:opacity-50 transition-colors min-h-[48px]"
        >
          {{ loading ? t('login.submitting') : t('login.submit') }}
        </button>
        <p class="mt-4 text-center text-sm text-slate-600">
          {{ t('login.noAccount') }}
          <NuxtLink :to="redirect ? '/register?redirect=' + encodeURIComponent(redirect) : '/register'" class="text-amber-600 hover:underline">{{ t('nav.register') }}</NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>
