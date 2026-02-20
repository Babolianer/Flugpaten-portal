<script setup lang="ts">
const route = useRoute()
const { t, locale } = useI18n()
const id = route.params.id as string

const REISEZIEL_OPTIONS = [
  'Mallorca',
  'Ibiza',
  'Menorca',
  'Gran Canaria',
  'Fuerteventura',
  'Lanzarote',
  'Teneriffa',
  'La Palma',
  'Spanien (sonstige)',
  'Anderes Land',
]

interface Request {
  id: string
  title: string
  details?: string | null
  originAirport: string
  destAirport: string
  earliestDate: string
  latestDate: string
  status: string
  originLat?: number | null
  originLng?: number | null
  destLat?: number | null
  destLng?: number | null
  organization?: {
    name: string
    slug: string
    description?: string | null
    landingContent?: string | null
    website?: string | null
    contactEmail: string
    contactPhone?: string | null
    contactInstagram?: string | null
    contactFacebook?: string | null
    reviews?: Array<{ id: string; rating: number; comment: string | null; reviewerName: string; route: string | null }>
    reviewsCount?: number
    averageRating?: number | null
  }
  animal?: { name: string; species: string } | null
}

const { data, error, refresh: refreshRequest } = await useFetch<{
  request: Request
  participantInfo?: { isCompletedParticipant: boolean; canRateOrg: boolean; orgId: string; orgName: string } | null
}>(`/api/requests/${id}`)
const request = computed(() => data.value?.request)
const participantInfo = computed(() => data.value?.participantInfo ?? null)

const hasRouteCoords = computed(
  () =>
    request.value &&
    request.value.originLat != null &&
    request.value.originLng != null &&
    request.value.destLat != null &&
    request.value.destLng != null
)

const selectedRoute = computed(() => {
  const r = request.value
  if (!r || !hasRouteCoords.value) return null
  return {
    from: [r.originLng!, r.originLat!] as [number, number],
    to: [r.destLng!, r.destLat!] as [number, number],
  }
})

const mapCenter = computed((): [number, number] => {
  const r = request.value
  if (!r || r.originLat == null || r.originLng == null || r.destLat == null || r.destLng == null) return [10.45, 51.17]
  const lng = (r.originLng + r.destLng) / 2
  const lat = (r.originLat + r.destLat) / 2
  return [lng, lat]
})

const message = ref('')
const loading = ref(false)
const applied = ref(false)
const form = reactive({
  vorname: '',
  nachname: '',
  anzahlPersonen: 1,
  reiseziel: '',
  reisezielAnderes: '',
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
const uploadFile = ref<File | null>(null)

async function apply() {
  if (!message.value.trim() || !form.datenschutz) return
  loading.value = true
  try {
    const applicationData = {
      vorname: form.vorname,
      nachname: form.nachname,
      anzahlPersonen: form.anzahlPersonen,
      reiseziel: form.reiseziel === 'Anderes Land' ? form.reisezielAnderes : form.reiseziel,
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

    await $fetch(`/api/requests/${id}/apply`, {
      method: 'POST',
      body,
    })
    applied.value = true
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || t('request.applyError'))
  } finally {
    loading.value = false
  }
}

const canSubmit = computed(() => message.value.trim().length > 0 && form.datenschutz && form.vorname && form.nachname && form.email)

const { getRequestStatusLabel } = useRequestStatus()
const isOpen = computed(() => request.value?.status === 'OPEN')

// Als Organisation: Bewerbungen laden und anzeigen
const { data: me } = await useFetch<{ user: { id: string; role: string }; memberships: { organizationId: string }[] }>('/api/auth/me')
const isOrg = computed(() => !!me.value?.user && ['ORG_USER', 'ADMIN'].includes(me.value.user.role))
const isLoggedInAsPatron = computed(() => !!me.value?.user && ['USER', 'ADMIN'].includes(me.value.user.role))
const loginRedirectUrl = computed(() => `/requests/${id}`)
const { data: applicationsData, execute: fetchApplications } = useFetch<{
  applications: {
    id: string
    status: string
    message: string | null
    applicationData: Record<string, unknown> | null
    attachmentPath: string | null
    createdAt: string
    user: {
      id: string
      displayName: string
      email: string
      profile?: { avatarUrl: string | null; city: string | null; countryCode: string | null; aboutMe: string | null; languages: string[]; frequentAirports: string[] } | null
      stats?: { averageRating: number | null; reviewsCount: number; completedFlightsCount: number }
    } | null
  }[]
}>(`/api/requests/${id}/applications`, { immediate: false })
watch([isOrg, request], ([org, req]) => {
  if (org && req) fetchApplications()
}, { immediate: true })
const applications = computed(() => applicationsData.value?.applications ?? [])
const showApplicationsSection = computed(() => isOrg.value && applicationsData.value != null)

const acceptingId = ref<string | null>(null)
async function acceptApplication(applicationId: string) {
  if (!request.value || request.value.status !== 'OPEN') return
  acceptingId.value = applicationId
  try {
    await $fetch(`/api/org/dashboard/requests/${id}/accept`, {
      method: 'POST',
      body: { applicationId },
    })
    await refreshRequest()
    await fetchApplications()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || t('request.acceptError'))
  } finally {
    acceptingId.value = null
  }
}

// Lesbare Labels für Bewerbungsfelder (übersetzt)
const APPLICATION_FIELD_LABELS = computed(() => ({
  vorname: t('request.vorname'),
  nachname: t('request.nachname'),
  anzahlPersonen: t('request.anzahlPersonen'),
  reiseziel: t('request.reiseziel'),
  abflughafen: t('request.abflughafen'),
  ankunftsflughafen: t('request.ankunftsflughafen'),
  fluggesellschaft: t('request.fluggesellschaft'),
  reiseVon: t('request.reiseVon'),
  reiseBis: t('request.reiseBis'),
  email: t('request.email'),
  telefon: t('request.telefon'),
  handy: t('request.handy'),
}))

const reviewOrgModal = ref<{ requestId: string; orgId: string; orgName: string } | null>(null)
function openRateOrg() {
  if (participantInfo.value?.canRateOrg && request.value?.organization)
    reviewOrgModal.value = { requestId: id, orgId: participantInfo.value.orgId, orgName: participantInfo.value.orgName }
}
function closeReviewOrgModal() { reviewOrgModal.value = null }
async function onReviewOrgSubmitted() { await refreshRequest() }

if (error.value) throw createError({ statusCode: 404, message: 'Request not found' })
</script>

<template>
  <div v-if="request" class="w-full min-h-screen bg-slate-50 overflow-x-hidden">
    <!-- Mobile-first: Back + Header -->
    <div class="w-full border-b border-slate-200 bg-white">
      <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <NuxtLink to="/map" class="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium text-sm sm:text-base min-h-[44px] items-center">
          {{ t('request.backToMap') }}
        </NuxtLink>
        <h1 class="mt-2 sm:mt-3 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">{{ request.title }}</h1>
        <span
          class="inline-flex mt-2 px-2.5 py-1 rounded-md text-sm font-medium"
          :class="{
            'bg-emerald-100 text-emerald-800': request.status === 'OPEN',
            'bg-blue-100 text-blue-800': request.status === 'MATCHED',
            'bg-slate-100 text-slate-700': request.status === 'COMPLETED',
            'bg-red-100 text-red-800': request.status === 'CANCELLED',
          }"
        >
          {{ getRequestStatusLabel(request.status) }}
        </span>
        <p v-if="request.animal" class="mt-2 text-slate-600">
          {{ request.animal.name }} ({{ request.animal.species === 'dog' ? t('map.speciesDog') : t('map.speciesCat') }})
        </p>
        <p class="mt-2 text-slate-600">
          <span class="font-medium">{{ request.originAirport }}</span>
          <span class="mx-2 text-slate-400">→</span>
          <span class="font-medium">{{ request.destAirport }}</span>
        </p>
        <p class="text-sm text-slate-500 mt-1">
          {{ new Date(request.earliestDate).toLocaleDateString(locale) }} –
          {{ new Date(request.latestDate).toLocaleDateString(locale) }}
        </p>
      </div>
    </div>

    <!-- Strecke (Flug abbilden) – Mobile-first Kartenhöhe -->
    <section class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-2 sm:mb-3">{{ t('request.route') }}</h2>
      <div class="rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white">
        <ClientOnly v-if="hasRouteCoords && selectedRoute">
          <MapView
            :pins="[]"
            :selected-route="selectedRoute"
            :center="mapCenter"
            :zoom="5"
            class="h-[240px] sm:h-[280px] md:h-[320px] w-full"
          />
          <template #fallback>
            <div class="h-[320px] flex items-center justify-center bg-slate-100 text-slate-500">
              {{ t('request.mapLoading') }}
            </div>
          </template>
        </ClientOnly>
        <div
          v-else
          class="h-[120px] flex items-center justify-center gap-4 bg-gradient-to-r from-amber-50 to-slate-50 border-b border-slate-100"
        >
          <div class="text-center px-4">
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ t('request.departure') }}</p>
            <p class="text-xl font-bold text-slate-900">{{ request.originAirport }}</p>
          </div>
          <div class="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <div class="text-center px-4">
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ t('request.destination') }}</p>
            <p class="text-xl font-bold text-slate-900">{{ request.destAirport }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Inhalt: Mobile 1 Spalte, ab lg 70/30 -->
    <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
      <div class="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6 sm:gap-8">
        <!-- Linke Spalte (70 %): Für Organisation = Bewerber-Infos, sonst = Als Flugpate bewerben -->
        <div class="min-w-0">
          <!-- Organisation: nur Bewerber-Informationen (kein Bewerbungsformular) -->
          <div v-if="showApplicationsSection" class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 class="text-lg font-semibold text-slate-900">{{ t('request.applicantsTitle') }}</h2>
              <p class="text-sm text-slate-500 mt-1">{{ t('request.applicantsIntro') }}</p>
            </div>
            <p v-if="!applications.length" class="p-8 text-slate-500 text-center">
              {{ t('request.noApplications') }}
            </p>
            <div v-else class="divide-y divide-slate-100">
              <div
                v-for="app in applications"
                :key="app.id"
                class="p-6 md:p-8 space-y-5"
              >
                <!-- Bewerber-Profilkarte mit Avatar, Bewertung, abgeschlossene Flüge -->
                <div class="flex flex-wrap items-start gap-4">
                  <NuxtLink
                    v-if="app.user?.id"
                    :to="`/user/${app.user.id}`"
                    class="shrink-0 block"
                  >
                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-200 border-2 border-slate-200 hover:border-amber-400 transition-colors">
                      <img
                        v-if="app.user?.profile?.avatarUrl"
                        :src="app.user.profile.avatarUrl"
                        :alt="app.user.displayName"
                        class="w-full h-full object-cover"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center text-2xl text-slate-500 font-bold">
                        {{ app.user.displayName?.charAt(0).toUpperCase() ?? '?' }}
                      </div>
                    </div>
                  </NuxtLink>
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <NuxtLink
                        v-if="app.user?.id"
                        :to="`/user/${app.user.id}`"
                        class="font-semibold text-slate-900 text-lg hover:text-amber-600"
                      >
                        {{ app.user.displayName ?? t('request.unknown') }}
                      </NuxtLink>
                      <span v-else class="font-semibold text-slate-900 text-lg">{{ t('request.unknown') }}</span>
                      <span class="text-sm text-slate-500">
                        {{ new Date(app.createdAt).toLocaleString('de-DE') }}
                      </span>
                    </div>
                    <p v-if="app.user?.email" class="text-sm text-slate-600">{{ app.user.email }}</p>
                    <div v-if="app.user?.stats" class="flex flex-wrap gap-3 mt-2">
                      <span
                        v-if="app.user.stats.averageRating != null"
                        class="inline-flex items-center gap-1 text-amber-600 text-sm font-medium"
                      >
                        {{ '★'.repeat(Math.round(app.user.stats.averageRating)) }}{{ '☆'.repeat(5 - Math.round(app.user.stats.averageRating)) }}
                        {{ app.user.stats.averageRating.toFixed(1) }} ({{ app.user.stats.reviewsCount }} {{ t('profile.reviews') }})
                      </span>
                      <span class="text-slate-600 text-sm">
                        {{ app.user.stats.completedFlightsCount }} {{ t('profile.completedFlights') }}
                      </span>
                    </div>
                    <NuxtLink
                      v-if="app.user?.id"
                      :to="`/user/${app.user.id}`"
                      class="inline-block mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      {{ t('profile.viewFullProfile') }} →
                    </NuxtLink>
                  </div>
                </div>
                <div v-if="app.message" class="rounded-lg bg-amber-50/80 border border-amber-100 p-4">
                  <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{{ t('request.message') }}</p>
                  <p class="text-slate-700 whitespace-pre-wrap">{{ app.message }}</p>
                </div>
                <dl v-if="app.applicationData && Object.keys(app.applicationData).length" class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <template v-for="(val, key) in app.applicationData" :key="key">
                    <template v-if="val != null && val !== ''">
                      <dt class="text-slate-500 font-medium">
                        {{ APPLICATION_FIELD_LABELS[key] ?? key }}
                      </dt>
                      <dd class="text-slate-800">
                        {{ Array.isArray(val) || typeof val === 'object' ? JSON.stringify(val) : String(val) }}
                      </dd>
                    </template>
                  </template>
                </dl>
                <p v-if="app.attachmentPath" class="text-sm">
                  <a
                    :href="app.attachmentPath"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-amber-600 hover:text-amber-700 font-medium hover:underline"
                  >
                    {{ t('request.viewAttachment') }}
                  </a>
                </p>
                <div v-if="isOpen && app.status === 'PENDING'" class="pt-2">
                  <button
                    type="button"
                    :disabled="acceptingId === app.id"
                    class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50 text-sm"
                    @click="acceptApplication(app.id)"
                  >
                    {{ acceptingId === app.id ? t('request.accepting') : t('request.accept') }}
                  </button>
                </div>
                <p v-else-if="app.status === 'ACCEPTED'" class="text-sm font-medium text-emerald-700">
                  {{ t('request.accepted') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Nicht-Organisation: Bewerbungsformular bzw. Hinweise -->
          <template v-else>
          <!-- Abgeschlossen + du warst der zugewiesene Teilnehmer: Erfolg + Bewerten -->
          <div
            v-if="!isOpen && participantInfo?.isCompletedParticipant"
            class="sticky top-6 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm p-6"
          >
            <h2 class="font-semibold text-slate-900 text-lg">{{ t('request.completedAsParticipantTitle') }}</h2>
            <p class="text-slate-600 mt-2">{{ t('request.completedAsParticipantText') }}</p>
            <div class="flex flex-wrap gap-3 mt-4">
              <button
                v-if="participantInfo.canRateOrg"
                type="button"
                class="px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition-colors"
                @click="openRateOrg"
              >
                {{ t('review.rateOrg') }}
              </button>
              <NuxtLink
                v-if="request.organization"
                :to="`/org/${request.organization.slug}`"
                class="inline-flex px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50"
              >
                {{ t('request.toOrgPageButton') }}
              </NuxtLink>
            </div>
          </div>
          <!-- Abgeschlossen / Geschlossen: Keine Bewerbung mehr möglich -->
          <div v-else-if="!isOpen" class="sticky top-6 rounded-xl bg-amber-50 border border-amber-200 shadow-sm p-6">
            <h2 class="font-semibold text-slate-900 text-lg">{{ t('request.applyNotPossible') }}</h2>
            <p class="text-slate-600 mt-2">
              {{ t('request.applyNotPossibleReason', { status: getRequestStatusLabel(request.status) }) }}
            </p>
            <p class="text-sm text-slate-500 mt-2">
              {{ t('request.contactOrg') }}
            </p>
            <NuxtLink
              v-if="request.organization"
              :to="`/org/${request.organization.slug}`"
              class="inline-flex mt-4 px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-medium hover:bg-amber-400"
            >
              {{ t('request.toOrgPageButton') }}
            </NuxtLink>
          </div>
          <div v-else-if="!isLoggedInAsPatron" class="sticky top-6 rounded-xl bg-amber-50 border border-amber-200 shadow-sm p-6">
            <h2 class="font-semibold text-slate-900 text-lg">{{ t('request.applyTitle') }}</h2>
            <p class="text-slate-600 mt-2">{{ t('request.applyLoginRequired') }}</p>
            <div class="mt-4 flex flex-col sm:flex-row gap-3">
              <NuxtLink
                :to="`/login?redirect=${encodeURIComponent(loginRedirectUrl)}`"
                class="inline-flex justify-center items-center px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium transition-colors min-h-[44px]"
              >
                {{ t('nav.login') }}
              </NuxtLink>
              <NuxtLink
                :to="`/register?redirect=${encodeURIComponent(loginRedirectUrl)}`"
                class="inline-flex justify-center items-center px-5 py-2.5 rounded-lg border-2 border-amber-500 text-amber-700 hover:bg-amber-50 font-medium transition-colors min-h-[44px]"
              >
                {{ t('nav.register') }}
              </NuxtLink>
            </div>
          </div>
          <div v-else-if="!applied" class="sticky top-6 rounded-xl bg-white border border-slate-200 shadow-sm p-6">
            <h2 class="font-semibold text-slate-900 text-lg">{{ t('request.applyTitle') }}</h2>
            <p class="text-sm text-slate-600 mt-2">
              {{ t('request.applyIntro') }}
            </p>
            <form class="space-y-4 mt-6" @submit.prevent="apply">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.firstName') }}</label>
                  <input v-model="form.vorname" type="text" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
<label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.lastName') }}</label>
                <input v-model="form.nachname" type="text" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.travelersCount') }}</label>
                <input v-model.number="form.anzahlPersonen" type="number" min="1" class="w-full border border-slate-300 rounded-lg px-3 py-2 w-24 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.travelDestination') }}</label>
                <select v-model="form.reiseziel" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500">
                  <option value="">{{ t('request.pleaseSelect') }}</option>
                  <option v-for="opt in REISEZIEL_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
                </select>
                <input
                  v-if="form.reiseziel === 'Anderes Land'"
                  v-model="form.reisezielAnderes"
                  type="text"
                  :placeholder="t('request.enterCountry')"
                  class="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.originAirport') }}</label>
                  <input v-model="form.abflughafen" type="text" :placeholder="t('request.originPlaceholder')" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.destAirport') }}</label>
                  <input v-model="form.ankunftsflughafen" type="text" :placeholder="t('request.destPlaceholder')" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.airline') }}</label>
                <input v-model="form.fluggesellschaft" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.travelFrom') }}</label>
                  <input v-model="form.reiseVon" type="date" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('request.travelTo') }}</label>
                  <input v-model="form.reiseBis" type="date" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
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
                :disabled="loading || !canSubmit"
                class="w-full px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium disabled:opacity-50 transition-colors"
              >
                {{ loading ? t('request.sending') : t('request.sendApplication') }}
              </button>
            </form>
          </div>
          <div v-else class="rounded-xl bg-emerald-50 border border-emerald-200 p-6">
            <p class="text-emerald-700 font-medium">{{ t('request.applicationSent') }}</p>
            <p class="text-sm text-emerald-600 mt-1">
              {{ t('request.orgWillContact') }}
            </p>
          </div>
          </template>
        </div>

        <!-- Rechte Spalte (30 %): Details zur Transportanfrage + Verein -->
        <div class="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <!-- Details zur Transportanfrage -->
          <section class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 class="text-lg font-semibold text-slate-900">{{ t('request.detailsTitle') }}</h2>
            </div>
            <div class="p-6">
              <p v-if="request.details" class="text-slate-700 whitespace-pre-wrap">{{ request.details }}</p>
              <p v-else class="text-slate-500">{{ t('request.noDetails') }}</p>
            </div>
          </section>

          <!-- Infos zum Verein + Bewertungen -->
          <section v-if="request.organization" class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
              <h2 class="text-lg font-semibold text-slate-900">{{ request.organization.name }}</h2>
              <NuxtLink
                :to="`/org/${request.organization.slug}`"
                class="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                {{ t('request.toOrgPage') }}
              </NuxtLink>
            </div>
            <div class="p-6 space-y-4">
              <div v-if="request.organization.averageRating != null && request.organization.reviewsCount != null" class="flex items-center gap-2 text-amber-600 font-medium">
                <span>{{ '★'.repeat(Math.round(request.organization.averageRating)) }}{{ '☆'.repeat(5 - Math.round(request.organization.averageRating)) }}</span>
                <span>{{ request.organization.averageRating.toFixed(1) }} ({{ request.organization.reviewsCount }} {{ t('profile.reviews') }})</span>
              </div>
              <p v-if="request.organization.description" class="text-slate-600">
                {{ request.organization.description }}
              </p>
              <div
                v-if="request.organization.landingContent"
                class="prose prose-slate max-w-none text-slate-700 text-sm"
                v-html="request.organization.landingContent"
              />
              <!-- Bewertungen der Organisation -->
              <div v-if="request.organization.reviews && request.organization.reviews.length" class="pt-4 border-t border-slate-100">
                <h3 class="text-sm font-semibold text-slate-700 mb-2">{{ t('profile.reviewsSection') }}</h3>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                  <div
                    v-for="rev in request.organization.reviews"
                    :key="rev.id"
                    class="p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-amber-500">{{ '★'.repeat(rev.rating) }}{{ '☆'.repeat(5 - rev.rating) }}</span>
                      <span class="text-slate-600">{{ rev.reviewerName }}</span>
                      <span v-if="rev.route" class="text-xs text-slate-500">· {{ rev.route }}</span>
                    </div>
                    <p v-if="rev.comment" class="text-slate-600 mt-0.5 text-xs">{{ rev.comment }}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <ReviewModal
      v-if="reviewOrgModal"
      :show="!!reviewOrgModal"
      :title="t('review.rateOrgTitle', { name: reviewOrgModal.orgName })"
      :request-id="reviewOrgModal.requestId"
      :reviewee-org-id="reviewOrgModal.orgId"
      @close="closeReviewOrgModal"
      @submitted="onReviewOrgSubmitted"
    />
  </div>
</template>
