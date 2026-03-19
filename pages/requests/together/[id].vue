<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

const id = route.params.id as string

interface GroupRequest {
  id: string
  title: string
  status: string
  earliestDate: string
  latestDate: string
  originAirport: string
  destAirport: string
  animalCanFlyInCargo?: boolean
  animalCanFlyInCabin?: boolean
}

interface Request {
  id: string
  status: string
  group?: {
    id: string
    title: string
    requests: GroupRequest[]
  } | null
}

const { data, error } = await useFetch<{ request: Request }>(`/api/requests/${id}`)
if (error.value) throw createError({ statusCode: 404, message: 'Request not found' })

const request = computed(() => data.value?.request ?? null)
const group = computed(() => request.value?.group ?? null)
const groupRequests = computed(() => group.value?.requests ?? [])

const { data: me } = await useFetch<{ user: { id: string; role: string; email?: string; phone?: string | null } }>(
  '/api/auth/me',
)
const isLoggedInAsPatron = computed(() => !!me.value?.user && ['USER', 'ADMIN'].includes(me.value.user.role))

const message = ref('')
const applied = ref(false)
const loading = ref(false)
const uploadFile = ref<File | null>(null)

const computedMinTravelers = computed(() => {
  const cabinCount = (groupRequests.value ?? []).reduce((sum, r) => sum + (r.animalCanFlyInCabin ? 1 : 0), 0)
  // Mindestens 1 Person, auch wenn alle Tiere nur Frachtraum brauchen.
  return Math.max(1, cabinCount)
})

const form = reactive({
  // Reisende müssen in der Gruppe aufgeteilt werden (mind. Anzahl durch Passagierkabine).
  travelers: [{ vorname: '', nachname: '' }] as Array<{ vorname: string; nachname: string }>,
  anzahlPersonen: 1,
  abflughafen: '',
  ankunftsflughafen: '',
  fluggesellschaft: '',
  reiseVon: '',
  reiseBis: '',
  email: '',
  telefon: '',
  handy: '',
  datenschutz: false,
})

// Synchronisiere Reisenden-Anzahl automatisch mit der Mindestanzahl.
watch(
  computedMinTravelers,
  (min) => {
    form.anzahlPersonen = min
    if (!form.travelers || form.travelers.length === 0) {
      form.travelers = Array.from({ length: min }, () => ({ vorname: '', nachname: '' }))
      return
    }
    if (form.travelers.length > min) form.travelers = form.travelers.slice(0, min)
    if (form.travelers.length < min) {
      const add = min - form.travelers.length
      form.travelers.push(...Array.from({ length: add }, () => ({ vorname: '', nachname: '' })))
    }
  },
  { immediate: true },
)

const { data: profileForApply, execute: fetchProfileForApply } = useFetch<{
  profile: { firstName?: string | null; lastName?: string | null } | null
  phone?: string | null
}>(`/api/user/profile`, { immediate: false })

watch(
  () => isLoggedInAsPatron.value,
  (loggedIn) => {
    if (loggedIn) fetchProfileForApply()
  },
  { immediate: true },
)

watch(profileForApply, (data) => {
  if (!isLoggedInAsPatron.value) return
  if (data?.profile?.firstName != null) form.travelers[0].vorname = data.profile.firstName
  if (data?.profile?.lastName != null) form.travelers[0].nachname = data.profile.lastName
  if (data?.phone != null) form.telefon = data.phone
  if (me.value?.user?.email != null) form.email = me.value.user.email
}, { immediate: true })

const canTogetherApply = computed(() => {
  if (!request.value?.group || request.value.group.requests.length <= 1) return false
  if (!isLoggedInAsPatron.value) return false
  if (request.value?.status !== 'OPEN') return false
  return request.value.group.requests.every((r) => r.status === 'OPEN')
})

const canSubmit = computed(() => {
  return (
    message.value.trim().length > 0 &&
    form.datenschutz &&
    form.travelers.length === form.anzahlPersonen &&
    form.travelers.every((t) => t.vorname.trim().length > 0 && t.nachname.trim().length > 0) &&
    form.abflughafen.trim().length > 0 &&
    form.ankunftsflughafen.trim().length > 0 &&
    form.fluggesellschaft.trim().length > 0 &&
    !!form.reiseVon &&
    !!form.reiseBis &&
    !!form.email
  )
})

async function applyTogether() {
  if (!request.value) return
  if (!canTogetherApply.value) return
  if (!message.value.trim() || !form.datenschutz) return

  loading.value = true
  try {
    const applicationData = {
      // Für Kompatibilität: setze vorname/nachname auf den ersten Reisenden.
      vorname: form.travelers[0]?.vorname ?? '',
      nachname: form.travelers[0]?.nachname ?? '',
      anzahlPersonen: form.anzahlPersonen,
      reisende: form.travelers,
      abflughafen: form.abflughafen,
      ankunftsflughafen: form.ankunftsflughafen,
      fluggesellschaft: form.fluggesellschaft,
      reiseVon: form.reiseVon,
      reiseBis: form.reiseBis,
      email: form.email,
      telefon: form.telefon,
      handy: form.handy,
    }

    const body = new FormData()
    body.append('message', message.value.trim())
    body.append('applicationData', JSON.stringify(applicationData))
    if (uploadFile.value) body.append('file', uploadFile.value)

    await $fetch(`/api/requests/${id}/apply`, { method: 'POST', body })
    applied.value = true
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || t('request.applyError'))
  } finally {
    loading.value = false
  }
}

const backToMapUrl = computed(() => `/map`)
</script>

<template>
  <div v-if="request" class="w-full min-h-screen bg-slate-50 overflow-x-hidden">
    <div class="w-full border-b border-slate-200 bg-white">
      <div class="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <NuxtLink :to="backToMapUrl" class="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium text-sm sm:text-base min-h-[44px]">
          {{ t('request.backToMap') }}
        </NuxtLink>
        <h1 class="mt-2 sm:mt-3 text-xl sm:text-2xl font-bold text-slate-900 break-words">
          {{ t('request.togetherApplyTitle') }}
        </h1>
        <p v-if="group?.title" class="text-sm text-slate-600 mt-1">
          {{ group.title }}
        </p>
        <p class="text-sm text-slate-500 mt-2">
          {{ t('request.togetherApplyIntro') }}
        </p>
      </div>
    </div>

    <div class="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pb-12 pt-8">
      <section v-if="group && groupRequests.length > 1" class="mb-8">
        <div class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 class="text-base sm:text-lg font-semibold text-slate-900">
              {{ t('request.togetherFlights') }}
            </h2>
          </div>
          <div class="p-4 sm:p-6 space-y-3">
            <div
              v-for="gr in groupRequests"
              :key="gr.id"
              class="rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <div class="font-medium text-slate-900 truncate">{{ gr.title }}</div>
                  <div class="text-xs text-slate-600 mt-0.5 truncate">{{ gr.originAirport }} → {{ gr.destAirport }}</div>
                </div>
                <div class="text-[11px] text-slate-500 whitespace-nowrap">
                  {{ new Date(gr.earliestDate).toLocaleDateString() }} – {{ new Date(gr.latestDate).toLocaleDateString() }}
                </div>
              </div>
              <NuxtLink
                :to="`/requests/${gr.id}`"
                class="inline-flex items-center mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                {{ t('request.viewDetails') }} →
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <div v-if="!isLoggedInAsPatron" class="rounded-xl bg-amber-50 border border-amber-200 shadow-sm p-6">
        <h2 class="font-semibold text-slate-900 text-lg">{{ t('request.togetherApplyTitle') }}</h2>
        <p class="text-sm text-slate-600 mt-2">{{ t('request.applyLoginRequired') }}</p>
        <div class="mt-4 flex flex-col sm:flex-row gap-3">
          <NuxtLink
            :to="`/login?redirect=${encodeURIComponent(`/requests/together/${id}`)}`"
            class="inline-flex justify-center items-center px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium transition-colors min-h-[44px]"
          >
            {{ t('nav.login') }}
          </NuxtLink>
          <NuxtLink
            :to="`/register?redirect=${encodeURIComponent(`/requests/together/${id}`)}`"
            class="inline-flex justify-center items-center px-5 py-2.5 rounded-lg border-2 border-amber-500 text-amber-700 hover:bg-amber-50 font-medium transition-colors min-h-[44px]"
          >
            {{ t('nav.register') }}
          </NuxtLink>
        </div>
      </div>

      <div v-else-if="applied" class="rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm p-6">
        <p class="text-emerald-700 font-medium">{{ t('request.applicationSent') }}</p>
        <p class="text-sm text-emerald-600 mt-1">{{ t('request.orgWillContact') }}</p>
      </div>

      <div v-else class="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
        <h2 class="font-semibold text-slate-900 text-lg">{{ t('request.togetherApplyTitle') }}</h2>
        <p class="text-sm text-slate-600 mt-2">{{ t('request.applyIntro') }}</p>

        <form class="space-y-4 mt-6" @submit.prevent="applyTogether">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.travelersCount') }}</label>
            <input
              :value="form.anzahlPersonen"
              type="number"
              min="1"
              disabled
              class="w-24 cursor-not-allowed opacity-70 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500"
            />
            <p class="text-xs text-slate-500 mt-1">
              {{ t('request.minimumTravelers', { count: form.anzahlPersonen }) }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="(traveler, idx) in form.travelers" :key="idx" class="contents">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('request.firstName') }} {{ idx + 1 }}
                </label>
                <input
                  v-model="traveler.vorname"
                  type="text"
                  required
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('request.lastName') }} {{ idx + 1 }}
                </label>
                <input
                  v-model="traveler.nachname"
                  type="text"
                  required
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.originAirport') }} *</label>
              <input v-model="form.abflughafen" type="text" required :placeholder="t('request.originPlaceholder')" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.destAirport') }} *</label>
              <input v-model="form.ankunftsflughafen" type="text" required :placeholder="t('request.destPlaceholder')" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.airline') }} *</label>
            <input v-model="form.fluggesellschaft" type="text" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.travelFrom') }} *</label>
              <input v-model="form.reiseVon" type="date" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.travelTo') }} *</label>
              <input v-model="form.reiseBis" type="date" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.emailRequired') }}</label>
            <input v-model="form.email" type="email" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.phone') }}</label>
            <input v-model="form.telefon" type="tel" :placeholder="t('request.phonePlaceholder')" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.messageToOrg') }}</label>
            <textarea
              v-model="message"
              rows="4"
              :placeholder="t('request.messagePlaceholder')"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.uploadOptional') }}</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              @change="(e: Event) => { uploadFile = (e.target as HTMLInputElement).files?.[0] ?? null }"
            />
            <p class="text-xs text-slate-500 mt-1">{{ t('request.uploadHint') }}</p>
          </div>

          <div class="flex items-start gap-2">
            <input
              id="datenschutz"
              v-model="form.datenschutz"
              type="checkbox"
              required
              class="mt-1 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
            />
            <label for="datenschutz" class="text-sm text-slate-600">
              {{ t('request.privacyLabelBefore') }}<NuxtLink to="/datenschutz" class="text-amber-600 hover:underline">{{ t('footer.datenschutz') }}</NuxtLink>{{ t('request.privacyLabelAfter') }}
            </label>
          </div>

          <button
            type="submit"
            :disabled="loading || !canSubmit || !canTogetherApply"
            class="w-full px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium disabled:opacity-50 transition-colors"
          >
            {{ loading ? t('request.sending') : t('request.sendApplication') }}
          </button>
        </form>
      </div>
    </div>
  </div>

  <div v-else class="w-full min-h-screen flex items-center justify-center text-slate-500">
    {{ t('request.mapLoading') }}
  </div>
</template>

