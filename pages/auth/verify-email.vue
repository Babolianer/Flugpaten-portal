<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const { t } = useI18n()
const token = computed(() => (route.query.token as string) || '')
const emailSentFailed = computed(() => route.query.emailSent === 'false')
const verified = ref<boolean | null>(null)
const error = ref('')
const loading = ref(false)
const resendLoading = ref(false)
const resendSuccess = ref(false)
const email = ref((route.query.email as string) || '')

onMounted(() => {
  if (token.value) {
    verifyToken()
  } else {
    verified.value = false
    error.value = t('verifyEmail.noToken')
  }
})

async function verifyToken() {
  if (!token.value) return
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/verify-email', { query: { token: token.value } })
    verified.value = true
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || t('verifyEmail.error')
    verified.value = false
  } finally {
    loading.value = false
  }
}

async function resendEmail() {
  if (!email.value?.trim()) return
  resendLoading.value = true
  resendSuccess.value = false
  error.value = ''
  try {
    await $fetch('/api/auth/resend-verification', { method: 'POST', body: { email: email.value.trim() } })
    resendSuccess.value = true
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || t('verifyEmail.resendError')
  } finally {
    resendLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-8 sm:py-12">
    <div class="w-full max-w-md min-w-0">
      <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 text-center">{{ t('verifyEmail.title') }}</h1>

      <div v-if="loading" class="p-8 rounded-xl bg-white shadow-lg border border-slate-200 text-center text-slate-600">
        {{ t('verifyEmail.checking') }}
      </div>

      <div v-else-if="verified === true" class="p-8 rounded-xl bg-white shadow-lg border border-slate-200 text-center">
        <p class="text-green-600 font-medium mb-4">{{ t('verifyEmail.success') }}</p>
        <NuxtLink
          to="/login?verified=1"
          class="inline-block px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium"
        >
          {{ t('verifyEmail.toLogin') }}
        </NuxtLink>
      </div>

      <div v-else class="p-5 sm:p-8 rounded-xl bg-white shadow-lg border border-slate-200 space-y-4">
        <div v-if="emailSentFailed" class="p-3 rounded bg-amber-50 text-amber-800 text-sm border border-amber-200">
          {{ t('verifyEmail.emailNotSentHint') }}
        </div>
        <p v-if="!token" class="text-slate-600">{{ t('verifyEmail.instruction') }}</p>
        <div v-else-if="error" class="p-3 rounded bg-red-50 text-red-700 text-sm">
          {{ error }}
        </div>
        <p v-if="!token || error" class="text-sm text-slate-600">{{ t('verifyEmail.resendHint') }}</p>
        <div v-if="!token || error" class="flex flex-col gap-2">
          <input
            v-model="email"
            type="email"
            :placeholder="t('register.email')"
            class="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            :disabled="resendLoading || !email?.trim()"
            @click="resendEmail"
            class="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium disabled:opacity-50"
          >
            {{ resendLoading ? t('verifyEmail.sending') : t('verifyEmail.resend') }}
          </button>
        </div>
        <p v-if="resendSuccess" class="text-sm text-green-600">{{ t('verifyEmail.resendSuccess') }}</p>
        <NuxtLink to="/login" class="block text-center text-sm text-amber-600 hover:underline">
          {{ t('nav.login') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
