<script setup lang="ts">
definePageMeta({ layout: 'default' })
const { t } = useI18n()
const name = ref('')
const description = ref('')
const website = ref('')
const contactEmail = ref('')
const preferredLanguage = ref('de')
const error = ref('')
const success = ref(false)
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/org/register', {
      method: 'POST',
      body: {
        name: name.value.trim(),
        description: description.value.trim() || undefined,
        website: website.value.trim() || undefined,
        contactEmail: contactEmail.value.trim(),
        preferredLanguage: preferredLanguage.value,
      },
    })
    success.value = true
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || t('orgRegister.error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-lg">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">{{ t('orgRegister.title') }}</h1>
    <div v-if="success" class="p-6 rounded-xl bg-emerald-50 border border-emerald-200">
      <p class="text-emerald-700 font-medium">{{ t('orgRegister.successTitle') }}</p>
      <p class="text-sm text-emerald-600 mt-1">
        {{ t('orgRegister.successHint') }}
      </p>
      <NuxtLink to="/org/dashboard" class="mt-4 inline-block text-amber-600 hover:underline">
        {{ t('orgRegister.toDashboard') }}
      </NuxtLink>
    </div>
    <form v-else class="p-6 rounded-xl bg-white border border-slate-200 shadow-sm" @submit.prevent="submit">
      <div v-if="error" class="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{{ error }}</div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgRegister.name') }}</label>
        <input
          v-model="name"
          type="text"
          required
          class="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500"
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgRegister.description') }}</label>
        <textarea
          v-model="description"
          rows="3"
          class="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500"
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgRegister.website') }}</label>
        <input
          v-model="website"
          type="url"
          :placeholder="t('register.websitePlaceholder')"
          class="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500"
        />
      </div>
      <div class="mb-6">
        <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgRegister.contactEmail') }}</label>
        <input
          v-model="contactEmail"
          type="email"
          required
          class="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500"
        />
      </div>
      <div class="mb-6">
        <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgRegister.preferredLanguage') }}</label>
        <select
          v-model="preferredLanguage"
          class="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 bg-white"
        >
          <option value="de">Deutsch</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
          <option value="it">Italiano</option>
          <option value="pl">Polski</option>
        </select>
      </div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium disabled:opacity-50"
      >
        {{ loading ? t('orgRegister.submitting') : t('orgRegister.submit') }}
      </button>
    </form>
  </div>
</template>
