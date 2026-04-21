<script setup lang="ts">
import type { SelectedRoute } from '~/components/MapView.vue'

const route = useRoute()
const { t, locale } = useI18n()
const { getSpeciesLabel } = useSpeciesLabel()
const id = route.params.id as string

type DestinationRow = { id?: string; airportCode: string; lat?: number | null; lng?: number | null; sortOrder?: number }

interface Request {
  id: string
  title: string
  details?: string | null
  originAirport: string
  destAirport: string
  destinations?: DestinationRow[]
  earliestDate: string
  latestDate: string
  status: string
  waitingListEnabled?: boolean
  animalCanFlyInCargo?: boolean
  animalCanFlyInCabin?: boolean
  originLat?: number | null
  originLng?: number | null
  destLat?: number | null
  destLng?: number | null
  group?: {
    id: string
    title: string
    requests: Array<{
      id: string
      title: string
      status: string
      earliestDate: string
      latestDate: string
      originAirport: string
      destAirport: string
      destinations?: DestinationRow[]
      animalCanFlyInCargo?: boolean
      animalCanFlyInCabin?: boolean
      animal: { name: string; species: string; imageUrl: string | null } | null
    }>
  } | null
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
  animal?: { name: string; species: string; imageUrl?: string | null } | null
}

const { data, error, refresh: refreshRequest } = await useFetch<{
  request: Request
  participantInfo?: { isCompletedParticipant: boolean; canRateOrg: boolean; orgId: string; orgName: string } | null
  waitingListInfo?: { count: number; isOnWaitingList: boolean; canJoin: boolean } | null
}>(`/api/requests/${id}`)
const request = computed(() => data.value?.request)
const participantInfo = computed(() => data.value?.participantInfo ?? null)
const waitingListInfo = computed(() => data.value?.waitingListInfo ?? null)

function destinationCodesLine(r: { destAirport: string; destinations?: DestinationRow[] | null }): string {
  const list = r.destinations?.filter((d) => d.airportCode?.trim()) ?? []
  if (list.length > 0) return list.map((d) => d.airportCode).join(', ')
  return r.destAirport
}

const routeDestinationsLabel = computed(() => {
  const r = request.value
  if (!r) return ''
  return destinationCodesLine(r)
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

const message = ref('')
const loading = ref(false)
const applied = ref(false)
const waitingListLoading = ref(false)
const onWaitingList = ref(false)
const form = reactive({
  vorname: '',
  nachname: '',
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
const uploadFile = ref<File | null>(null)

async function apply() {
  if (!message.value.trim() || !form.datenschutz) return
  loading.value = true
  try {
    const applicationData = {
      vorname: form.vorname,
      nachname: form.nachname,
      anzahlPersonen: form.anzahlPersonen,
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

async function joinWaitingList() {
  if (!isLoggedInAsPatron.value || !waitingListInfo.value?.canJoin) return
  waitingListLoading.value = true
  try {
    await $fetch(`/api/requests/${id}/waiting-list`, { method: 'POST' })
    onWaitingList.value = true
    await refreshRequest()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || t('request.waitingListError'))
  } finally {
    waitingListLoading.value = false
  }
}

const canSubmit = computed(() =>
  message.value.trim().length > 0 &&
  form.datenschutz &&
  form.vorname &&
  form.nachname &&
  form.email &&
  form.abflughafen?.trim() &&
  form.ankunftsflughafen?.trim() &&
  form.fluggesellschaft?.trim() &&
  form.reiseVon &&
  form.reiseBis
)

const { getRequestStatusLabel } = useRequestStatus()
const isOpen = computed(() => request.value?.status === 'OPEN')
const isMatched = computed(() => request.value?.status === 'MATCHED')
const waitingListEnabled = computed(() => !!request.value?.waitingListEnabled)
const hasAnimalTransportOptions = computed(
  () => !!request.value?.animalCanFlyInCargo || !!request.value?.animalCanFlyInCabin,
)
const animalTransportLabel = computed(() => {
  const cargo = !!request.value?.animalCanFlyInCargo
  const cabin = !!request.value?.animalCanFlyInCabin
  if (cargo) return t('map.animalTransportCargo')
  if (cabin) return t('map.animalTransportCabin')
  return ''
})

// Als Organisation: Bewerbungen laden und anzeigen
const { data: me } = await useFetch<{ user: { id: string; role: string; email?: string; phone?: string | null }; memberships: { organizationId: string }[] }>('/api/auth/me')
const isOrg = computed(() => !!me.value?.user && ['ORG_USER', 'ADMIN'].includes(me.value.user.role))
const isLoggedInAsPatron = computed(() => !!me.value?.user && ['USER', 'ADMIN'].includes(me.value.user.role))

const canTogetherApply = computed(() => {
  const g = request.value?.group
  if (!g || g.requests.length <= 1) return false
  if (!isLoggedInAsPatron.value) return false
  if (request.value?.status !== 'OPEN') return false
  // Backend erlaubt „Gruppenbewerbung“ nur, wenn keine Request in der Gruppe teilweise geschlossen ist.
  return g.requests.every((r) => r.status === 'OPEN')
})

// Profil-Daten für Prefill des Bewerbungsformulars (Vorname, Nachname, Telefon, E-Mail)
const { data: profileForApply, execute: fetchProfileForApply } = useFetch<{
  profile: { firstName?: string | null; lastName?: string | null } | null
  phone?: string | null
}>('/api/user/profile', { immediate: false })
watch([me, isLoggedInAsPatron], ([m, patron]) => {
  if (patron && m?.user) fetchProfileForApply()
}, { immediate: true })
watch(profileForApply, (data) => {
  if (!data || !isLoggedInAsPatron.value) return
  if (data.profile?.firstName != null) form.vorname = data.profile.firstName
  if (data.profile?.lastName != null) form.nachname = data.profile.lastName
  if (data.phone != null) form.telefon = data.phone
  if (me.value?.user?.email) form.email = me.value.user.email
}, { immediate: true })
watch(waitingListInfo, (wi) => {
  if (wi?.isOnWaitingList) onWaitingList.value = true
}, { immediate: true })

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
const imageLightboxOpen = ref(false)
function openRateOrg() {
  if (participantInfo.value?.canRateOrg && request.value?.organization)
    reviewOrgModal.value = { requestId: id, orgId: participantInfo.value.orgId, orgName: participantInfo.value.orgName }
}
function closeReviewOrgModal() { reviewOrgModal.value = null }
async function onReviewOrgSubmitted() { await refreshRequest() }

if (error.value) throw createError({ statusCode: 404, message: 'Request not found' })

// Escape schließt die Bild-Lightbox
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') imageLightboxOpen.value = false
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
watch(imageLightboxOpen, (open) => {
  if (open) document.body.style.overflow = 'hidden'
  else document.body.style.overflow = ''
})
</script>

<template>
  <div v-if="request" class="w-full min-h-screen bg-slate-50 overflow-x-hidden">
    <!-- Mobile-first: Back + Header -->
    <div class="w-full border-b border-slate-200 bg-white">
      <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <NuxtLink to="/map" class="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium text-sm sm:text-base min-h-[44px] items-center">
          {{ t('request.backToMap') }}
        </NuxtLink>
        <div class="grid grid-cols-1 sm:grid-cols-[auto_1fr] sm:items-start gap-4 sm:gap-5 mt-2 sm:mt-3">
          <!-- Tierbild links neben Titel (mobile: unter Titel), klickbar zum Vergrößern -->
          <div v-if="request.animal?.imageUrl" class="shrink-0 justify-self-start order-2 sm:order-1">
            <button
              type="button"
              class="relative block w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow cursor-zoom-in"
              :aria-label="t('request.enlargeImage')"
              @click.stop="imageLightboxOpen = true"
            >
              <div v-if="request.status === 'MATCHED'" class="absolute inset-0 z-10 pointer-events-none" aria-hidden="true">
                <div class="absolute inset-0 bg-slate-900/10" />
                <div class="absolute -left-10 top-4 w-44 rotate-[-25deg] bg-amber-500/90 text-slate-900 text-xs font-extrabold tracking-wider text-center py-1 shadow">
                  {{ getRequestStatusLabel('MATCHED', true) }}
                </div>
              </div>
              <img
                :src="request.animal.imageUrl"
                :alt="request.animal.name"
                class="w-full h-full object-cover"
                @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
              />
            </button>
          </div>
          <div class="min-w-0 order-1 sm:order-2">
            <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">{{ request.title }}</h1>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <span
                class="inline-flex px-2.5 py-1 rounded-md text-sm font-medium"
                :class="{
                  'bg-emerald-100 text-emerald-800': request.status === 'OPEN',
                  'bg-blue-100 text-blue-800': request.status === 'MATCHED',
                  'bg-slate-100 text-slate-700': request.status === 'COMPLETED',
                  'bg-red-100 text-red-800': request.status === 'CANCELLED',
                }"
              >
                {{ getRequestStatusLabel(request.status, true) }}
              </span>
              <span v-if="request.animal" class="text-slate-600 text-sm sm:text-base">
                {{ request.animal.name }} ({{ request.animal.species === 'dog' ? t('map.speciesDog') : t('map.speciesCat') }})
              </span>
            </div>
            <p class="mt-2 text-slate-600 break-words">
              <span class="font-medium">{{ request.originAirport }}</span>
              <span class="mx-2 text-slate-400">→</span>
              <span class="font-medium">{{ routeDestinationsLabel }}</span>
            </p>
            <p class="text-sm text-slate-500 mt-1">
              {{ new Date(request.earliestDate).toLocaleDateString(locale) }} –
              {{ new Date(request.latestDate).toLocaleDateString(locale) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox: Bild vergrößert anzeigen -->
    <Teleport to="body">
      <div
        v-if="imageLightboxOpen && request?.animal?.imageUrl"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90"
        role="dialog"
        aria-modal="true"
        :aria-label="t('request.enlargeImage')"
        @click.self="imageLightboxOpen = false"
      >
        <button
          type="button"
          class="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 transition-colors"
          :aria-label="t('common.close')"
          @click="imageLightboxOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          :src="request.animal!.imageUrl!"
          :alt="request.animal!.name"
          class="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
          @click.stop
        />
      </div>
    </Teleport>

    <section v-if="request.group && request.group.requests.length > 1" class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 class="text-base sm:text-lg font-semibold text-slate-900">Gemeinsam fliegen</h2>
          <p class="text-sm text-slate-600 mt-1">{{ request.group.title }}</p>
          <div v-if="canTogetherApply" class="mt-3">
            <NuxtLink
              :to="`/requests/together/${id}`"
              class="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium transition-colors"
            >
              {{ t('request.togetherApplyButton') }}
            </NuxtLink>
          </div>
        </div>
        <div class="p-4 sm:p-6 space-y-2">
          <NuxtLink
            v-for="gr in request.group.requests.filter((x) => x.id !== id)"
            :key="gr.id"
            :to="`/requests/${gr.id}`"
            class="block rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="font-medium text-slate-900 truncate">{{ gr.title }}</div>
                <div class="text-xs text-slate-600 mt-0.5 line-clamp-2">{{ gr.originAirport }} → {{ destinationCodesLine(gr) }}</div>
              </div>
              <div class="text-xs text-slate-500 shrink-0">
                {{ new Date(gr.earliestDate).toLocaleDateString(locale) }} – {{ new Date(gr.latestDate).toLocaleDateString(locale) }}
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Strecke (Flug abbilden) – Mobile-first Kartenhöhe -->
    <section class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div class="flex flex-col lg:flex-row lg:items-stretch gap-4 sm:gap-6 mb-4">
        <h2 class="text-base sm:text-lg font-semibold text-slate-900 shrink-0">{{ t('request.route') }}</h2>
        <!-- Route-Zusammenfassung: Horizontale Leiste über bzw. neben der Karte -->
        <div class="flex-1 flex flex-wrap items-center gap-4 sm:gap-6 px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm">
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
          <div class="h-px lg:h-auto lg:w-px flex-1 lg:flex-initial bg-slate-200" />
          <p class="text-sm text-slate-600">
            {{ new Date(request.earliestDate).toLocaleDateString(locale) }} –
            {{ new Date(request.latestDate).toLocaleDateString(locale) }}
          </p>
        </div>
      </div>
      <div class="rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white">
        <ClientOnly v-if="hasRouteCoords && selectedRoutesForMap">
          <MapView
            :pins="[]"
            :selected-routes="selectedRoutesForMap"
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
          <div class="text-center px-4 max-w-[min(100%,320px)]">
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ t('request.destination') }}</p>
            <p class="text-xl font-bold text-slate-900 break-words leading-snug">{{ routeDestinationsLabel }}</p>
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
                <p v-else-if="app.status === 'WAITING_LIST'" class="text-sm font-medium text-amber-700">
                  {{ t('request.waitingList') }}
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
          <!-- Reserviert (MATCHED): Warteliste möglich -->
          <div
            v-else-if="isMatched && waitingListEnabled && waitingListInfo"
            class="sticky top-6 rounded-xl bg-amber-50 border border-amber-200 shadow-sm p-6"
          >
            <h2 class="font-semibold text-slate-900 text-lg">{{ t('request.reservedWithWaitingListTitle') }}</h2>
            <p class="text-slate-600 mt-2">
              {{ t('request.reservedWithWaitingListText') }}
            </p>
            <p v-if="onWaitingList || waitingListInfo.isOnWaitingList" class="text-emerald-700 font-medium mt-3">
              {{ t('request.onWaitingList') }}
            </p>
            <div v-else-if="waitingListInfo.canJoin && isLoggedInAsPatron" class="mt-4 space-y-3">
              <p class="text-sm text-slate-600">
                {{ t('request.waitingListSlots', { count: 2 - waitingListInfo.count }) }}
              </p>
              <button
                type="button"
                :disabled="waitingListLoading"
                class="inline-flex px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 disabled:opacity-50"
                @click="joinWaitingList"
              >
                {{ waitingListLoading ? t('request.waitingListJoining') : t('request.joinWaitingList') }}
              </button>
            </div>
            <div v-else-if="waitingListInfo.canJoin && !isLoggedInAsPatron" class="mt-4 space-y-3">
              <p class="text-sm text-slate-600">{{ t('request.waitingListLoginRequired') }}</p>
              <div class="flex flex-wrap gap-3">
                <NuxtLink
                  :to="`/login?redirect=${encodeURIComponent(loginRedirectUrl)}`"
                  class="inline-flex px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-medium hover:bg-amber-400"
                >
                  {{ t('nav.login') }}
                </NuxtLink>
                <NuxtLink
                  :to="`/register?redirect=${encodeURIComponent(loginRedirectUrl)}`"
                  class="inline-flex px-4 py-2 rounded-lg border-2 border-amber-500 text-amber-700 hover:bg-amber-50 font-medium"
                >
                  {{ t('nav.register') }}
                </NuxtLink>
              </div>
            </div>
            <p v-else-if="!waitingListInfo.canJoin && !onWaitingList" class="text-sm text-slate-600 mt-3">
              {{ t('request.waitingListFull') }}
            </p>
            <NuxtLink
              v-if="request.organization"
              :to="`/org/${request.organization.slug}`"
              class="inline-flex mt-4 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50"
            >
              {{ t('request.toOrgPageButton') }}
            </NuxtLink>
          </div>
          <!-- Abgeschlossen / Storniert: Keine Bewerbung mehr möglich -->
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
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div class="p-6 space-y-3">
              <p v-if="request.details" class="text-slate-700 whitespace-pre-wrap">{{ request.details }}</p>
              <p v-else-if="!hasAnimalTransportOptions" class="text-slate-500">{{ t('request.noDetails') }}</p>
              <p v-if="hasAnimalTransportOptions" class="text-sm text-slate-700 font-medium">{{ animalTransportLabel }}</p>
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
