<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const email = ref('')
const password = ref('')
const displayName = ref('')
const role = ref<'USER' | 'ORG_USER'>('USER')
const termsAndPrivacyAccepted = ref(false)
const newsletterOptIn = ref(false)
const showTermsModal = ref(false)
const showPrivacyModal = ref(false)
const preferredLanguage = ref('')
const redirectTo = computed(() => (route.query.redirect as string) || '/dashboard')
const orgDescription = ref('')
const orgWebsite = ref('')
const orgContactEmail = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (role.value === 'ORG_USER') {
      await $fetch('/api/auth/register-org', {
        method: 'POST',
        body: {
          email: email.value,
          password: password.value,
          displayName: displayName.value.trim(),
          description: orgDescription.value.trim() || undefined,
          website: orgWebsite.value.trim() || undefined,
          contactEmail: orgContactEmail.value.trim(),
          termsAccepted: termsAndPrivacyAccepted.value,
          privacyAccepted: termsAndPrivacyAccepted.value,
          newsletterOptIn: newsletterOptIn.value,
          preferredLanguage: preferredLanguage.value,
        },
      })
      await navigateTo('/org/dashboard?registered=1')
    } else {
      await $fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        body: {
          email: email.value,
          password: password.value,
          role: 'USER',
          displayName: displayName.value,
          termsAccepted: termsAndPrivacyAccepted.value,
          privacyAccepted: termsAndPrivacyAccepted.value,
          newsletterOptIn: newsletterOptIn.value,
          preferredLanguage: preferredLanguage.value,
        },
      })
      await navigateTo(redirectTo.value)
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || t('register.error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-8 sm:py-12">
    <div class="w-full max-w-md min-w-0">
      <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 text-center">{{ t('register.title') }}</h1>
      <form
        class="p-5 sm:p-8 rounded-xl bg-white shadow-lg border border-slate-200"
        @submit.prevent="submit"
      >
        <div v-if="error" class="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
          {{ error }}
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('register.iAm') }}</label>
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <label class="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input v-model="role" type="radio" value="USER" class="w-4 h-4" />
              <span>{{ t('register.rolePatron') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input v-model="role" type="radio" value="ORG_USER" class="w-4 h-4" />
              <span>{{ t('register.roleOrg') }}</span>
            </label>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            {{ t('register.displayName') }}<span class="text-red-600"> *</span>
          </label>
          <input
            v-model="displayName"
            type="text"
            required
            :placeholder="role === 'ORG_USER' ? t('register.displayNamePlaceholderOrg') : t('register.displayNamePlaceholder')"
            class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            {{ t('register.email') }}<span class="text-red-600"> *</span>
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            {{ t('register.password') }}<span class="text-red-600"> *</span>
          </label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            {{ t('register.preferredLanguage') }}<span class="text-red-600"> *</span>
          </label>
          <select
            v-model="preferredLanguage"
            required
            class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="" disabled>{{ t('register.preferredLanguagePlaceholder') }}</option>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
            <option value="it">Italiano</option>
            <option value="pl">Polski</option>
          </select>
        </div>
        <template v-if="role === 'ORG_USER'">
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.description') }}</label>
            <textarea
              v-model="orgDescription"
              rows="3"
              class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              :placeholder="t('register.descriptionPlaceholder')"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.website') }}</label>
            <input
              v-model="orgWebsite"
              type="url"
              :placeholder="t('register.websitePlaceholder')"
              class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-slate-700 mb-1">
              {{ t('register.contactEmail') }}<span class="text-red-600"> *</span>
            </label>
            <input
              v-model="orgContactEmail"
              type="email"
              :required="role === 'ORG_USER'"
              class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              :placeholder="t('register.contactEmailPlaceholder')"
            />
          </div>
        </template>
        <div class="mb-4 space-y-3">
          <label class="flex items-start gap-2 cursor-pointer">
            <input v-model="termsAndPrivacyAccepted" type="checkbox" class="mt-1 w-4 h-4 rounded border-slate-300 shrink-0" />
            <span class="text-sm text-slate-700">
              {{ t('register.termsAndPrivacyCheckboxPrefix') }}
              <button type="button" class="text-amber-600 hover:underline" @click.prevent="showTermsModal = true">{{ t('register.termsLink') }}</button>
              {{ t('register.termsAndPrivacyCheckboxMiddle') }}
              <button type="button" class="text-amber-600 hover:underline" @click.prevent="showPrivacyModal = true">{{ t('register.privacyLink') }}</button>
              {{ t('register.termsAndPrivacyCheckboxSuffix') }}
            </span>
          </label>
          <label class="flex items-start gap-2 cursor-pointer">
            <input v-model="newsletterOptIn" type="checkbox" class="mt-1 w-4 h-4 rounded border-slate-300 shrink-0" />
            <span class="text-sm text-slate-700">{{ t('register.newsletterCheckbox') }}</span>
          </label>
        </div>
        <button
          type="submit"
          :disabled="loading || !termsAndPrivacyAccepted || !preferredLanguage"
          class="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium disabled:opacity-50 transition-colors min-h-[48px]"
        >
          {{ loading ? t('register.submitting') : t('register.submit') }}
        </button>
        <p class="mt-4 text-center text-sm text-slate-600">
          {{ t('register.alreadyRegistered') }}
          <NuxtLink :to="'/login?redirect=' + encodeURIComponent(redirectTo)" class="text-amber-600 hover:underline">{{ t('nav.login') }}</NuxtLink>
        </p>
      </form>
      <p v-if="role === 'ORG_USER'" class="mt-4 text-center text-xs text-slate-500">
        {{ t('register.orgHint') }}
      </p>
    </div>

    <!-- Modal: AGB kurz -->
    <Teleport to="body">
      <div v-if="showTermsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
        <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col relative">
          <button
            type="button"
            class="absolute top-3 right-3 inline-flex items-center justify-center h-10 w-10 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Schließen"
            @click="showTermsModal = false"
          >
            <span class="text-2xl leading-none">×</span>
          </button>
          <div class="p-6 overflow-y-auto flex-1">
            <h3 class="text-lg font-bold text-slate-900 mb-3">{{ t('terms.title') }}</h3>
            <p class="text-sm text-slate-700 whitespace-pre-line mb-4">{{ t('terms.shortSummary') }}</p>
            <NuxtLink
              to="/nutzungsbedingungen"
              class="inline-flex items-center text-amber-600 hover:underline font-medium text-sm"
              @click="showTermsModal = false"
            >
              {{ t('register.modalFullText') }} →
            </NuxtLink>
          </div>
          <div class="p-4 border-t border-slate-200">
            <button type="button" class="w-full py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50" @click="showTermsModal = false">
              {{ t('register.modalClose') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Datenschutz kurz -->
    <Teleport to="body">
      <div v-if="showPrivacyModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
        <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col relative">
          <button
            type="button"
            class="absolute top-3 right-3 inline-flex items-center justify-center h-10 w-10 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Schließen"
            @click="showPrivacyModal = false"
          >
            <span class="text-2xl leading-none">×</span>
          </button>
          <div class="p-6 overflow-y-auto flex-1">
            <h3 class="text-lg font-bold text-slate-900 mb-3">{{ t('privacy.title') }}</h3>
            <p class="text-sm text-slate-700 whitespace-pre-line mb-4">{{ t('privacy.shortSummary') }}</p>
            <NuxtLink
              to="/datenschutz"
              class="inline-flex items-center text-amber-600 hover:underline font-medium text-sm"
              @click="showPrivacyModal = false"
            >
              {{ t('register.modalFullText') }} →
            </NuxtLink>
          </div>
          <div class="p-4 border-t border-slate-200">
            <button type="button" class="w-full py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50" @click="showPrivacyModal = false">
              {{ t('register.modalClose') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
