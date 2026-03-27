<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { user, fetchUser } = useAuth()
const { t } = useI18n()
const profile = ref<{
  firstName: string | null
  lastName: string | null
  city: string | null
  countryCode: string | null
  aboutMe: string | null
  languages: string[]
  preferredRoutes: string[]
  frequentAirports: string[]
  avatarUrl: string | null
} | null>(null)
const saving = ref(false)
const avatarUploading = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const avatarInputRef = ref<HTMLInputElement | null>(null)

const form = ref({
  firstName: '',
  lastName: '',
  phone: '',
  city: '',
  countryCode: '',
  aboutMe: '',
  languages: '',
  preferredRoutes: '',
  frequentAirports: '',
  preferredLanguage: 'de',
})

const languageOptions = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pl', label: 'Polski' },
]

onMounted(async () => {
  await fetchUser()
  if (!user.value) {
    await navigateTo('/login')
    return
  }
  if (user.value.role === 'ORG_USER') {
    await navigateTo('/org/dashboard')
    return
  }
  if (user.value.role === 'ADMIN') {
    await navigateTo('/admin')
    return
  }
  try {
    const res = await $fetch<{
      profile: typeof profile.value
      displayName?: string
      phone?: string | null
      preferredLanguage?: string
    }>('/api/user/profile')
    profile.value = res.profile
    if (res.profile) {
      form.value.firstName = res.profile.firstName ?? ''
      form.value.lastName = res.profile.lastName ?? ''
      form.value.city = res.profile.city || ''
      form.value.countryCode = res.profile.countryCode || ''
      form.value.aboutMe = res.profile.aboutMe || ''
      form.value.languages = (res.profile.languages || []).join(', ')
      form.value.preferredRoutes = (res.profile.preferredRoutes || []).join(', ')
      form.value.frequentAirports = (res.profile.frequentAirports || []).join(', ')
    }
    form.value.phone = res.phone ?? (user.value as { phone?: string | null })?.phone ?? ''
    form.value.preferredLanguage = res.preferredLanguage || (user.value?.preferredLanguage as string) || 'de'
  } catch {
    message.value = { type: 'error', text: t('profile.loadError') }
  }
})

function parseList(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

async function save() {
  saving.value = true
  message.value = null
  try {
    await $fetch('/api/user/profile', {
      method: 'PATCH',
      body: {
        firstName: form.value.firstName?.trim() || null,
        lastName: form.value.lastName?.trim() || null,
        phone: form.value.phone?.trim() || null,
        city: form.value.city?.trim() || null,
        countryCode: form.value.countryCode?.trim() || null,
        aboutMe: form.value.aboutMe?.trim() || null,
        languages: parseList(form.value.languages),
        preferredRoutes: parseList(form.value.preferredRoutes),
        frequentAirports: parseList(form.value.frequentAirports),
        preferredLanguage: form.value.preferredLanguage || 'de',
      },
    })
    message.value = { type: 'success', text: t('profile.saved') }
    await fetchUser()
  } catch {
    message.value = { type: 'error', text: t('profile.saveError') }
  } finally {
    saving.value = false
  }
}

async function onAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  avatarUploading.value = true
  message.value = null
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await $fetch<{ avatarUrl: string }>('/api/user/profile/avatar', {
      method: 'POST',
      body: formData,
    })
    if (profile.value) profile.value.avatarUrl = res.avatarUrl
    message.value = { type: 'success', text: t('profile.avatarSaved') }
  } catch {
    message.value = { type: 'error', text: t('profile.avatarError') }
  } finally {
    avatarUploading.value = false
    input.value = ''
  }
}

const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all'
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-8 sm:py-12">
    <div class="container mx-auto px-4 sm:px-6 max-w-[800px]">
      <NuxtLink
        to="/dashboard"
        class="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('dashboard.greetingSubtitle') }}
      </NuxtLink>

      <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 tracking-tight">
        {{ t('profile.editTitle') }}
      </h1>

      <div
        v-if="message"
        :class="[
          'mb-6 rounded-xl px-4 py-3 text-sm font-medium',
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200',
        ]"
      >
        {{ message.text }}
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <!-- Profilbild – prominent oben -->
        <div class="p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100">
          <div
            class="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg ring-2 ring-slate-200 shrink-0"
          >
            <img
              v-if="profile?.avatarUrl"
              :src="profile.avatarUrl"
              :alt="user?.displayName"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-4xl sm:text-5xl text-slate-400 font-semibold">
              {{ user?.displayName?.charAt(0).toUpperCase() ?? '?' }}
            </div>
          </div>
          <div class="flex-1 text-center sm:text-left min-w-0">
            <h2 class="text-lg font-semibold text-slate-900 mb-1">{{ t('profile.avatar') }}</h2>
            <p class="text-sm text-slate-500 mb-4">{{ t('profile.avatarHint') }}</p>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="hidden"
              @change="onAvatarChange"
            />
            <button
              type="button"
              :disabled="avatarUploading"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-colors"
              @click="avatarInputRef?.click()"
            >
              <svg v-if="avatarUploading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ avatarUploading ? t('profile.uploading') : t('profile.uploadAvatar') }}
            </button>
          </div>
        </div>

        <div class="p-6 sm:p-8 space-y-8">
          <!-- Persönliche Infos -->
          <section>
            <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              {{ t('profile.sectionPersonal') }}
            </h3>
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('profile.firstName') }}</label>
                  <input v-model="form.firstName" type="text" :class="inputClass" :placeholder="t('profile.firstNamePlaceholder')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('profile.lastName') }}</label>
                  <input v-model="form.lastName" type="text" :class="inputClass" :placeholder="t('profile.lastNamePlaceholder')" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('profile.phone') }}</label>
                <input v-model="form.phone" type="tel" :class="inputClass" :placeholder="t('profile.phonePlaceholder')" />
                <p class="mt-1.5 text-xs text-slate-500">{{ t('profile.phoneHint') }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('profile.aboutMe') }}</label>
                <textarea v-model="form.aboutMe" rows="4" :class="inputClass" :placeholder="t('profile.aboutMePlaceholder')" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('profile.languages') }}</label>
                <input v-model="form.languages" type="text" :class="inputClass" placeholder="de, en, fr" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('profile.defaultLanguage') }}</label>
                <select v-model="form.preferredLanguage" :class="inputClass">
                  <option v-for="opt in languageOptions" :key="opt.code" :value="opt.code">
                    {{ opt.label }}
                  </option>
                </select>
                <p class="mt-1.5 text-xs text-slate-500">{{ t('profile.defaultLanguageHint') }}</p>
              </div>
            </div>
          </section>

          <!-- Standort -->
          <section>
            <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              {{ t('profile.sectionLocation') }}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('profile.city') }}</label>
                <input v-model="form.city" type="text" :class="inputClass" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('profile.countryCode') }}</label>
                <input v-model="form.countryCode" type="text" maxlength="10" :class="inputClass" placeholder="DE" />
              </div>
            </div>
          </section>

          <!-- Flugdetails -->
          <section>
            <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              {{ t('profile.sectionFlight') }}
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('profile.frequentAirports') }}</label>
                <input v-model="form.frequentAirports" type="text" :class="inputClass" placeholder="MUC, FRA, ZRH" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('profile.preferredRoutes') }}</label>
                <input v-model="form.preferredRoutes" type="text" :class="inputClass" placeholder="MUC-FCO, FRA-LIS" />
              </div>
            </div>
          </section>

          <!-- Buttons -->
          <div class="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-100">
            <NuxtLink
              v-if="user"
              :to="`/user/${user.id}`"
              class="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              {{ t('profile.viewProfile') }}
            </NuxtLink>
            <button
              type="button"
              :disabled="saving"
              class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold disabled:opacity-60 transition-colors shadow-sm"
              @click="save"
            >
              {{ saving ? t('profile.saving') : t('profile.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
