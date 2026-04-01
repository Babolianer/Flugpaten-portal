<script setup lang="ts">
definePageMeta({ layout: false })

const { t } = useI18n()
const registerRole = ref<'USER' | 'ORG_USER'>('USER')

const userDisplayName = ref('')
const userEmail = ref('')
const userPassword = ref('')
const userPreferredLanguage = ref('')
const userError = ref('')
const userLoading = ref(false)
const userSuccess = ref(false)

const orgDisplayName = ref('')
const orgEmail = ref('')
const orgPassword = ref('')
const orgDescription = ref('')
const orgWebsite = ref('')
const orgContactEmail = ref('')
const preferredLanguage = ref('')
const termsAndPrivacyAccepted = ref(false)
const newsletterOptIn = ref(false)
const showTermsModal = ref(false)
const showPrivacyModal = ref(false)
const orgError = ref('')
const orgLoading = ref(false)
const orgSuccess = ref(false)

async function registerUser() {
  userError.value = ''
  userSuccess.value = false
  userLoading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: userEmail.value,
        password: userPassword.value,
        role: 'USER',
        displayName: userDisplayName.value.trim(),
        termsAccepted: termsAndPrivacyAccepted.value,
        privacyAccepted: termsAndPrivacyAccepted.value,
        newsletterOptIn: newsletterOptIn.value,
        preferredLanguage: userPreferredLanguage.value,
      },
    })
    userSuccess.value = true
  } catch (e: unknown) {
    userError.value = (e as { data?: { message?: string } })?.data?.message || t('register.error')
  } finally {
    userLoading.value = false
  }
}

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
        preferredLanguage: preferredLanguage.value,
        maintenancePreRegister: true,
        termsAccepted: termsAndPrivacyAccepted.value,
        privacyAccepted: termsAndPrivacyAccepted.value,
        newsletterOptIn: newsletterOptIn.value,
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
        <div class="mb-5 flex gap-2 rounded-lg border border-slate-200 p-1 bg-slate-50">
          <button
            type="button"
            class="flex-1 py-2 rounded-md text-sm font-medium"
            :class="registerRole === 'USER' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-800'"
            @click="registerRole = 'USER'"
          >
            Flugpate
          </button>
          <button
            type="button"
            class="flex-1 py-2 rounded-md text-sm font-medium"
            :class="registerRole === 'ORG_USER' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-800'"
            @click="registerRole = 'ORG_USER'"
          >
            Organisation
          </button>
        </div>

        <template v-if="registerRole === 'USER'">
          <h1 class="text-xl font-bold text-slate-900 mb-2">{{ t('register.rolePatron') }}</h1>
          <p class="text-slate-600 text-sm mb-6">
            Registrierung ist möglich. Während Wartungsmodus wird dein Konto nach Admin-Freigabe aktiviert.
          </p>
          <form v-if="!userSuccess" @submit.prevent="registerUser" class="space-y-4">
            <div v-if="userError" class="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">{{ userError }}</div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.displayName') }} *</label>
              <input v-model="userDisplayName" type="text" required class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.email') }} *</label>
              <input v-model="userEmail" type="email" required class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.password') }} *</label>
              <input v-model="userPassword" type="password" minlength="8" required class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.preferredLanguage') }} *</label>
              <select v-model="userPreferredLanguage" required class="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition">
                <option value="" disabled>{{ t('register.preferredLanguagePlaceholder') }}</option>
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="it">Italiano</option>
                <option value="pl">Polski</option>
              </select>
            </div>
            <div class="space-y-3">
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
            <button type="submit" :disabled="userLoading || !termsAndPrivacyAccepted || !userPreferredLanguage" class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition disabled:opacity-50 shadow-md hover:shadow-lg">
              {{ userLoading ? t('register.submitting') : t('register.submit') }}
            </button>
          </form>
          <div v-else class="p-4 rounded-xl bg-green-50 text-green-800 text-sm border border-green-200">
            Registrierung erfolgreich. Dein Konto wartet auf Freigabe durch den Admin.
          </div>
        </template>

        <template v-else>
        <h1 class="text-xl font-bold text-slate-900 mb-2">{{ t('maintenance.orgHeading') }}</h1>
        <p class="text-slate-600 text-sm mb-6">
          {{ t('maintenance.orgPreRegisterHint') }}
        </p>
        <form v-if="!orgSuccess" @submit.prevent="registerOrg" class="space-y-4">
          <div v-if="orgError" class="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
            {{ orgError }}
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              {{ t('register.displayNamePlaceholderOrg') }}<span class="text-red-600"> *</span>
            </label>
            <input
              v-model="orgDisplayName"
              type="text"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              :placeholder="t('register.displayNamePlaceholderOrg')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              {{ t('register.email') }}<span class="text-red-600"> *</span>
            </label>
            <input
              v-model="orgEmail"
              type="email"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              {{ t('register.password') }}<span class="text-red-600"> *</span>
            </label>
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
            <label class="block text-sm font-medium text-slate-700 mb-1">
              {{ t('register.contactEmail') }}<span class="text-red-600"> *</span>
            </label>
            <input
              v-model="orgContactEmail"
              type="email"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              :placeholder="t('register.contactEmailPlaceholder')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              {{ t('register.preferredLanguage') }}<span class="text-red-600"> *</span>
            </label>
            <select
              v-model="preferredLanguage"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
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
          <div class="space-y-3">
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
            :disabled="orgLoading || !termsAndPrivacyAccepted || !preferredLanguage"
            class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {{ orgLoading ? t('register.submitting') : t('maintenance.orgPreRegisterSubmit') }}
          </button>
        </form>
        <div v-else class="p-4 rounded-xl bg-green-50 text-green-800 text-sm border border-green-200">
          {{ t('maintenance.orgSuccess') }}
        </div>
        </template>
      </div>
    </div>

    <!-- Modal: AGB kurz -->
    <Teleport to="body">
      <div v-if="showTermsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
        <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col relative">
          <button
            type="button"
            class="absolute top-3 right-3 inline-flex items-center justify-center h-10 w-10 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            :aria-label="t('common.close')"
            @click="showTermsModal = false"
          >
            <span class="text-2xl leading-none">×</span>
          </button>
          <div class="p-6 overflow-y-auto flex-1">
            <h3 class="text-lg font-bold text-slate-900 mb-3">{{ t('terms.title') }}</h3>
            <p class="text-sm text-slate-700 whitespace-pre-line mb-4">{{ t('terms.shortSummary') }}</p>
            <NuxtLink to="/nutzungsbedingungen" class="inline-flex items-center text-amber-600 hover:underline font-medium text-sm" @click="showTermsModal = false">
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
            :aria-label="t('common.close')"
            @click="showPrivacyModal = false"
          >
            <span class="text-2xl leading-none">×</span>
          </button>
          <div class="p-6 overflow-y-auto flex-1">
            <h3 class="text-lg font-bold text-slate-900 mb-3">{{ t('privacy.title') }}</h3>
            <p class="text-sm text-slate-700 whitespace-pre-line mb-4">{{ t('privacy.shortSummary') }}</p>
            <NuxtLink to="/datenschutz" class="inline-flex items-center text-amber-600 hover:underline font-medium text-sm" @click="showPrivacyModal = false">
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
