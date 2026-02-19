<script setup lang="ts">
definePageMeta({ layout: false })

const { t } = useI18n()

const orgDisplayName = ref('')
const orgEmail = ref('')
const orgPassword = ref('')
const orgDescription = ref('')
const orgWebsite = ref('')
const orgContactEmail = ref('')
const orgError = ref('')
const orgLoading = ref(false)
const orgSuccess = ref(false)

async function registerOrg() {
  orgError.value = ''
  orgSuccess.value = false
  orgLoading.value = true
  try {
    await $fetch('/api/auth/register-org', {
      method: 'POST',
      body: {
        email: orgEmail.value,
        password: orgPassword.value,
        displayName: orgDisplayName.value.trim(),
        description: orgDescription.value.trim() || undefined,
        website: orgWebsite.value.trim() || undefined,
        contactEmail: orgContactEmail.value.trim(),
        maintenancePreRegister: true,
      },
    })
    orgSuccess.value = true
  } catch (e: unknown) {
    orgError.value = (e as { data?: { message?: string } })?.data?.message || t('register.error')
  } finally {
    orgLoading.value = false
  }
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
        <h1 class="text-xl font-bold text-slate-900 mb-2">{{ t('maintenance.orgHeading') }}</h1>
        <p class="text-slate-600 text-sm mb-6">
          {{ t('maintenance.orgPreRegisterHint') }}
        </p>
        <form v-if="!orgSuccess" @submit.prevent="registerOrg" class="space-y-4">
          <div v-if="orgError" class="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
            {{ orgError }}
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.displayNamePlaceholderOrg') }}</label>
            <input
              v-model="orgDisplayName"
              type="text"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              :placeholder="t('register.displayNamePlaceholderOrg')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.email') }}</label>
            <input
              v-model="orgEmail"
              type="email"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.password') }}</label>
            <input
              v-model="orgPassword"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              :placeholder="t('maintenance.passwordPlaceholder')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.description') }}</label>
            <textarea
              v-model="orgDescription"
              rows="2"
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              :placeholder="t('register.descriptionPlaceholder')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.website') }}</label>
            <input
              v-model="orgWebsite"
              type="url"
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              :placeholder="t('register.websitePlaceholder')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.contactEmail') }}</label>
            <input
              v-model="orgContactEmail"
              type="email"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              :placeholder="t('register.contactEmailPlaceholder')"
            />
          </div>
          <button
            type="submit"
            :disabled="orgLoading"
            class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {{ orgLoading ? t('register.submitting') : t('maintenance.orgPreRegisterSubmit') }}
          </button>
        </form>
        <div v-else class="p-4 rounded-xl bg-green-50 text-green-800 text-sm border border-green-200">
          {{ t('maintenance.orgSuccess') }}
        </div>
      </div>
    </div>
  </div>
</template>
