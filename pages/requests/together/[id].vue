<script setup lang="ts">
import type { SelectedRoute } from '~/components/MapView.vue'

const route = useRoute()
const { t, locale } = useI18n()

const id = route.params.id as string

const MAX_ANIMALS_PER_SPONSOR = 5

type DestinationRow = { airportCode: string; lat?: number | null; lng?: number | null }

interface GroupRequest {
  id: string
  title: string
  status: string
  earliestDate: string
  latestDate: string
  originAirport: string
  destAirport: string
  destinations?: Array<{ airportCode: string }>
}

interface Request {
  id: string
  title?: string
  status: string
  originAirport?: string
  destAirport?: string
  destinations?: DestinationRow[]
  earliestDate?: string
  latestDate?: string
  originLat?: number | null
  originLng?: number | null
  destLat?: number | null
  destLng?: number | null
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

function destinationCodesLine(r: { destAirport: string; destinations?: Array<{ airportCode: string }> | null }): string {
  const list = r.destinations?.filter((d) => d.airportCode?.trim()) ?? []
  if (list.length > 0) return list.map((d) => d.airportCode).join(', ')
  return r.destAirport
}

const routeDestinationsLabel = computed(() => {
  const r = request.value
  if (!r?.destAirport) return ''
  return destinationCodesLine({ destAirport: r.destAirport, destinations: r.destinations })
})

const routeMapLines = computed((): SelectedRoute[] | null => {
  const r = request.value
  if (!r || r.originLat == null || r.originLng == null) return null
  const from: [number, number] = [r.originLng, r.originLat]
  const dests = r.destinations?.filter((d) => d.lat != null && d.lng != null) ?? []
  if (dests.length > 0) {
    return dests.map((d) => ({ from, to: [d.lng!, d.lat!] as [number, number] }))
  }
  if (r.destLat != null && r.destLng != null) {
    return [{ from, to: [r.destLng, r.destLat] }]
  }
  return null
})

const hasRouteCoords = computed(() => routeMapLines.value != null && routeMapLines.value.length > 0)

const selectedRoutesForMap = computed((): SelectedRoute[] | null => {
  const lines = routeMapLines.value
  return lines && lines.length > 0 ? lines : null
})

const mapCenter = computed((): [number, number] => {
  const r = request.value
  const lines = routeMapLines.value
  if (!r || !lines?.length) return [10.45, 51.17]
  const lngs: number[] = [r.originLng!]
  const lats: number[] = [r.originLat!]
  for (const seg of lines) {
    lngs.push(seg.to[0])
    lats.push(seg.to[1])
  }
  return [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length]
})

const { data: me } = await useFetch<{ user: { id: string; role: string; email?: string; phone?: string | null } }>(
  '/api/auth/me',
)
const isLoggedInAsPatron = computed(() => !!me.value?.user && ['USER', 'ADMIN'].includes(me.value.user.role))

const message = ref('')
const applied = ref(false)
const loading = ref(false)
const uploadFile = ref<File | null>(null)

const computedMinTravelers = computed(() => {
  const animalCount = groupRequests.value?.length ?? 0
  return Math.max(1, Math.ceil(animalCount / MAX_ANIMALS_PER_SPONSOR))
})

const form = reactive({
  // Mindestanzahl aus Gruppengröße: höchstens MAX_ANIMALS_PER_SPONSOR Tiere pro Person.
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

const MAX_TRAVELERS_INPUT = 50

function resizeTravelersToCount(desired: number) {
  const min = computedMinTravelers.value
  let n = Math.floor(Number(desired))
  if (!Number.isFinite(n)) n = min
  n = Math.min(MAX_TRAVELERS_INPUT, Math.max(min, n))
  if (form.anzahlPersonen !== n) form.anzahlPersonen = n
  if (!form.travelers?.length) {
    form.travelers = Array.from({ length: n }, () => ({ vorname: '', nachname: '' }))
    return
  }
  if (form.travelers.length > n) form.travelers = form.travelers.slice(0, n)
  else if (form.travelers.length < n) {
    const add = n - form.travelers.length
    form.travelers.push(...Array.from({ length: add }, () => ({ vorname: '', nachname: '' })))
  }
}

// Mindestanzahl bei Gruppenwechsel erzwingen; höhere manuelle Wahl bleibt erhalten.
watch(computedMinTravelers, () => resizeTravelersToCount(form.anzahlPersonen), { immediate: true })
watch(() => form.anzahlPersonen, (v) => resizeTravelersToCount(v))

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
        <p v-if="request.originAirport && routeDestinationsLabel" class="mt-3 text-slate-700 break-words">
          <span class="font-medium">{{ request.originAirport }}</span>
          <span class="mx-2 text-slate-400">→</span>
          <span class="font-medium">{{ routeDestinationsLabel }}</span>
        </p>
        <p
          v-if="request.earliestDate && request.latestDate"
          class="text-sm text-slate-500 mt-1"
        >
          {{ new Date(request.earliestDate).toLocaleDateString(locale) }} –
          {{ new Date(request.latestDate).toLocaleDateString(locale) }}
        </p>
      </div>
    </div>

    <section
      v-if="request.originAirport && routeDestinationsLabel"
      class="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pb-2"
    >
      <div class="flex flex-col sm:flex-row sm:items-stretch gap-3 sm:gap-4 mb-3">
        <h2 class="text-base font-semibold text-slate-900 shrink-0">{{ t('request.route') }}</h2>
        <div class="flex-1 flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center gap-3">
            <div class="text-center">
              <p class="text-xs uppercase tracking-wide text-slate-500">{{ t('request.departure') }}</p>
              <p class="text-lg font-bold text-slate-900">{{ request.originAirport }}</p>
            </div>
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div class="text-center max-w-[min(100%,280px)]">
              <p class="text-xs uppercase tracking-wide text-slate-500">{{ t('request.destination') }}</p>
              <p class="text-lg font-bold text-slate-900 break-words leading-snug">{{ routeDestinationsLabel }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white">
        <ClientOnly v-if="hasRouteCoords && selectedRoutesForMap">
          <MapView
            :pins="[]"
            :selected-routes="selectedRoutesForMap"
            :center="mapCenter"
            :zoom="5"
            class="h-[200px] sm:h-[260px] w-full"
          />
          <template #fallback>
            <div class="h-[200px] flex items-center justify-center bg-slate-100 text-slate-500">
              {{ t('request.mapLoading') }}
            </div>
          </template>
        </ClientOnly>
        <div
          v-else
          class="h-[100px] flex items-center justify-center gap-3 bg-gradient-to-r from-amber-50 to-slate-50 border-b border-slate-100 px-2"
        >
          <div class="text-center">
            <p class="text-xs uppercase text-slate-500">{{ t('request.departure') }}</p>
            <p class="text-lg font-bold text-slate-900">{{ request.originAirport }}</p>
          </div>
          <span class="text-slate-400">→</span>
          <div class="text-center max-w-[min(100%,280px)]">
            <p class="text-xs uppercase text-slate-500">{{ t('request.destination') }}</p>
            <p class="text-lg font-bold text-slate-900 break-words leading-snug">{{ routeDestinationsLabel }}</p>
          </div>
        </div>
      </div>
    </section>

    <div class="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pb-12 pt-4 sm:pt-6">
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
                  <div class="text-xs text-slate-600 mt-0.5 line-clamp-2">{{ gr.originAirport }} → {{ destinationCodesLine(gr) }}</div>
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
              v-model.number="form.anzahlPersonen"
              type="number"
              :min="computedMinTravelers"
              :max="MAX_TRAVELERS_INPUT"
              class="w-28 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500"
            />
            <p class="text-xs text-slate-500 mt-1 max-w-prose">
              {{ t('request.togetherTravelersHint', { min: computedMinTravelers }) }}
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

