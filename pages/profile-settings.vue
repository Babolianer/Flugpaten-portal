<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { user, fetchUser } = useAuth()
const { t } = useI18n()
const profile = ref<{
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
  displayName: '',
  city: '',
  countryCode: '',
  aboutMe: '',
  languages: '',
  preferredRoutes: '',
  frequentAirports: '',
})

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
    const res = await $fetch<{ profile: typeof profile.value; displayName?: string }>('/api/user/profile')
    profile.value = res.profile
    if (res.profile) {
      form.value.city = res.profile.city || ''
      form.value.countryCode = res.profile.countryCode || ''
      form.value.aboutMe = res.profile.aboutMe || ''
      form.value.languages = (res.profile.languages || []).join(', ')
      form.value.preferredRoutes = (res.profile.preferredRoutes || []).join(', ')
      form.value.frequentAirports = (res.profile.frequentAirports || []).join(', ')
    }
    form.value.displayName = res.displayName ?? user.value?.displayName ?? ''
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
        displayName: form.value.displayName?.trim() || undefined,
        city: form.value.city?.trim() || null,
        countryCode: form.value.countryCode?.trim() || null,
        aboutMe: form.value.aboutMe?.trim() || null,
        languages: parseList(form.value.languages),
        preferredRoutes: parseList(form.value.preferredRoutes),
        frequentAirports: parseList(form.value.frequentAirports),
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
</script>

<template>
  <div class="container mx-auto w-4/5 max-w-full px-4 sm:px-6 py-6 sm:py-8">
    <div class="max-w-xl">
      <div class="mb-6">
        <NuxtLink to="/dashboard" class="text-sm text-slate-600 hover:text-slate-900">
          ← {{ t('dashboard.greetingSubtitle') }}
        </NuxtLink>
      </div>
      <h1 class="text-xl font-bold text-slate-900 mb-6">{{ t('profile.editTitle') }}</h1>

      <div v-if="message" :class="message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'" class="p-3 rounded-lg mb-4 text-sm">
        {{ message.text }}
      </div>

      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('register.displayName') }}</label>
          <input v-model="form.displayName" type="text" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" :placeholder="t('register.displayNamePlaceholder')" />
          <p class="text-xs text-slate-500 mt-1">{{ t('profile.displayNameHint') }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('profile.avatar') }}</label>
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-2 border-slate-300 shrink-0">
              <img v-if="profile?.avatarUrl" :src="profile.avatarUrl" :alt="user?.displayName" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-2xl text-slate-500">
                {{ user?.displayName?.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div>
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
                class="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                @click="avatarInputRef?.click()"
              >
                {{ avatarUploading ? t('profile.uploading') : t('profile.uploadAvatar') }}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('profile.city') }}</label>
          <input v-model="form.city" type="text" class="w-full border border-slate-300 rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('profile.countryCode') }}</label>
          <input v-model="form.countryCode" type="text" placeholder="DE" maxlength="10" class="w-full border border-slate-300 rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('profile.aboutMe') }}</label>
          <textarea v-model="form.aboutMe" rows="4" class="w-full border border-slate-300 rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('profile.languages') }}</label>
          <input v-model="form.languages" type="text" placeholder="de, en" class="w-full border border-slate-300 rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('profile.frequentAirports') }}</label>
          <input v-model="form.frequentAirports" type="text" placeholder="MUC, FRA, ZRH" class="w-full border border-slate-300 rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('profile.preferredRoutes') }}</label>
          <input v-model="form.preferredRoutes" type="text" placeholder="MUC-FCO, FRA-LIS" class="w-full border border-slate-300 rounded px-3 py-2" />
        </div>

        <div class="flex gap-4">
          <button
            type="button"
            :disabled="saving"
            class="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium disabled:opacity-50"
            @click="save"
          >
            {{ saving ? t('profile.saving') : t('profile.save') }}
          </button>
          <NuxtLink v-if="user" :to="`/user/${user.id}`" class="px-6 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 inline-block">
            {{ t('profile.viewProfile') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
