<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface Request {
  id: string
  title: string
  originAirport: string
  destAirport: string
  originLat: number | null
  originLng: number | null
  destLat: number | null
  destLng: number | null
}

interface Application {
  id: string
  status: string
  message: string | null
  createdAt: string
  requestId: string
  request: {
    id: string
    title: string
    status: string
    originAirport: string
    destAirport: string
    earliestDate: string
    latestDate: string
    orgName: string | null
    orgSlug: string | null
    animal: { name: string; species: string; imageUrl: string | null } | null
  } | null
}

interface Conversation {
  id: string
  requestId: string | null
  requestTitle: string | null
  orgName: string | null
  orgSlug: string | null
  lastMessage: { body: string; createdAt: string; senderUserId: string } | null
  updatedAt: string
}

const { user, fetchUser } = useAuth()
const { t, locale } = useI18n()
const applications = ref<Application[]>([])
const conversations = ref<Conversation[]>([])
const requests = ref<Request[]>([])
const pollingInterval = ref<NodeJS.Timeout | null>(null)
const isPageVisible = ref(true)
const applicationFilter = ref<'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('all')

type MatchType = 'DIRECT' | 'RADIUS' | 'COUNTRY'

interface MapPin {
  id: string
  type: 'request' | 'org'
  lat: number
  lng: number
  title?: string
  requestId?: string
  orgId?: string
  organization?: { name: string; slug: string }
  animal?: { name: string; species: string }
  matchType?: MatchType
  distanceKm?: number
}

interface MapRequest {
  id: string
  title: string
  originAirport: string
  destAirport: string
  earliestDate: string
  latestDate: string
  originLat: number | null
  originLng: number | null
  destLat: number | null
  destLng: number | null
  organization?: { name: string; slug: string }
  animal?: { name: string; species: string; imageUrl?: string | null } | null
  matchType?: MatchType
  distanceKm?: number
}

const mapFilters = ref({
  dateFrom: '',
  dateTo: '',
  originAirport: '',
  destAirport: '',
  species: 'all',
  flexDays: false,
})

const mapPins = ref<MapPin[]>([])
const mapRequests = ref<MapRequest[]>([])
const mapSelectedId = ref<string | null>(null)
const mapRef = ref<{ flyTo: (lng: number, lat: number, zoom?: number) => void } | null>(null)
const mapLoading = ref(false)

const mapSelectedRoute = computed(() => {
  if (!mapSelectedId.value) return null
  const req = mapRequests.value.find((r) => r.id === mapSelectedId.value)
  if (!req || req.originLat == null || req.originLng == null || req.destLat == null || req.destLng == null) return null
  return {
    from: [req.originLng, req.originLat] as [number, number],
    to: [req.destLng, req.destLat] as [number, number],
  }
})

const mapGroupedRequests = computed(() => {
  const direct: MapRequest[] = []
  const radius: MapRequest[] = []
  const country: MapRequest[] = []
  for (const r of mapRequests.value) {
    if (r.matchType === 'DIRECT') direct.push(r)
    else if (r.matchType === 'RADIUS') radius.push(r)
    else if (r.matchType === 'COUNTRY') country.push(r)
    else direct.push(r)
  }
  return { direct, radius, country }
})

const mapHeadlineText = computed(() => {
  const n = mapRequests.value.length
  if (n === 0) return null
  if (mapGroupedRequests.value.direct.length > 0) return t('map.resultCount', { count: n })
  return t('map.noExactButAlternatives')
})

async function loadMapData() {
  mapLoading.value = true
  try {
    const params = new URLSearchParams()
    if (mapFilters.value.dateFrom) params.set('dateFrom', mapFilters.value.dateFrom)
    if (mapFilters.value.dateTo) params.set('dateTo', mapFilters.value.dateTo)
    if (mapFilters.value.originAirport) {
      params.set('origin_iata', mapFilters.value.originAirport)
      params.set('originAirport', mapFilters.value.originAirport)
    }
    if (mapFilters.value.destAirport) {
      params.set('dest_iata', mapFilters.value.destAirport)
      params.set('destAirport', mapFilters.value.destAirport)
    }
    if (mapFilters.value.species && mapFilters.value.species !== 'all') params.set('species', mapFilters.value.species)

    const res = await $fetch<{ pins: MapPin[]; requests: MapRequest[] }>('/api/map/pins?' + params.toString())
    mapPins.value = res.pins
    mapRequests.value = res.requests
  } finally {
    mapLoading.value = false
  }
}

function onMapFilter(f: typeof mapFilters.value) {
  mapFilters.value = { ...f }
  loadMapData()
}

function onMapPinClick(pin: MapPin) {
  mapSelectedId.value = pin.requestId ?? pin.id
  const req = pin.requestId ? mapRequests.value.find((x) => x.id === pin.requestId) : null
  if (req && req.originLat != null && req.originLng != null && req.destLat != null && req.destLng != null && mapRef.value) {
    // mapSelectedRoute computed updates map
  } else if (pin && mapRef.value) {
    mapRef.value.flyTo(pin.lng, pin.lat)
  }
}

function onMapRequestClick(req: MapRequest) {
  mapSelectedId.value = req.id
  if (req.originLat != null && req.originLng != null && req.destLat != null && req.destLng != null) {
    // mapSelectedRoute updates map
  } else {
    const pin = mapPins.value.find((p) => p.requestId === req.id)
    if (pin && mapRef.value) mapRef.value.flyTo(pin.lng, pin.lat)
  }
}

const acceptedTrips = computed(() => applications.value.filter((a) => a.status === 'ACCEPTED'))
const pendingApplications = computed(() => applications.value.filter((a) => a.status === 'PENDING'))
const rejectedApplications = computed(() => applications.value.filter((a) => a.status === 'REJECTED'))

// KPIs
const activeTransports = computed(() => acceptedTrips.value.length)
const openApplications = computed(() => pendingApplications.value.length)
const unreadMessages = computed(() => {
  if (!user.value) return 0
  return conversations.value.filter((c) => c.lastMessage && c.lastMessage.senderUserId !== user.value!.id).length
})

// Filtered applications
const filteredApplications = computed(() => {
  if (applicationFilter.value === 'all') return applications.value
  return applications.value.filter((a) => a.status === applicationFilter.value)
})

// Unread conversations (new messages)
const unreadConversations = computed(() => {
  if (!user.value) return []
  return conversations.value
    .filter((c) => c.lastMessage && c.lastMessage.senderUserId !== user.value!.id)
    .slice(0, 5) // Show max 5 on dashboard
})

const applicationStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return t('dashboard.applicationStatusPending')
    case 'ACCEPTED': return t('dashboard.applicationStatusAccepted')
    case 'REJECTED': return t('dashboard.applicationStatusRejected')
    default: return status
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'ACCEPTED': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const localeCode = locale.value === 'de' ? 'de-DE' : 'en-US'
  return date.toLocaleDateString(localeCode, { day: 'numeric', month: 'long', year: 'numeric' })
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return t('inbox.timeJustNow')
  if (diffMins < 60) return t('inbox.timeMinutesAgo').replace('{count}', String(diffMins))
  if (diffHours < 24) return t('inbox.timeHoursAgo').replace('{count}', String(diffHours))
  if (diffDays < 7) {
    const key = diffDays > 1 ? 'inbox.timeDaysAgoPlural' : 'inbox.timeDaysAgo'
    return t(key).replace('{count}', String(diffDays))
  }
  return formatDate(dateString)
}

async function loadData() {
  try {
    const [requestsRes, applicationsRes, conversationsRes] = await Promise.all([
      $fetch<{ requests: Request[] }>('/api/requests'),
      $fetch<{ applications: Application[] }>('/api/user/applications'),
      $fetch<{ conversations: Conversation[] }>('/api/user/conversations'),
    ])
    requests.value = requestsRes.requests
    applications.value = applicationsRes.applications
    conversations.value = conversationsRes.conversations
  } catch {
    requests.value = []
    applications.value = []
    conversations.value = []
  }
}

function startPolling() {
  if (pollingInterval.value) return
  
  pollingInterval.value = setInterval(async () => {
    if (isPageVisible.value && user.value?.role === 'USER') {
      await loadData()
    }
  }, 5000)
}

function stopPolling() {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

function handleVisibilityChange() {
  isPageVisible.value = !document.hidden
  if (isPageVisible.value) {
    loadData()
  }
}

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
  await loadData()
  loadMapData()
  startPolling()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div class="container mx-auto w-4/5 max-w-full px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
    <!-- Header -->
    <div class="mb-6 sm:mb-8 border-b border-slate-200 pb-6">
      <h1 class="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
        {{ t('dashboard.greeting').replace('{name}', user?.displayName ?? 'User') }}
      </h1>
      <p class="text-slate-500 text-sm mt-1">{{ t('dashboard.greetingSubtitle') }}</p>
    </div>

    <!-- KPI-Zeile -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
      <div class="flex items-center gap-4 p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold tabular-nums">
          {{ activeTransports }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-900">{{ t('dashboard.kpiActiveTransport') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-4 p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold tabular-nums">
          {{ openApplications }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-900">{{ t('dashboard.kpiOpenApplications') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-4 p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold tabular-nums">
          {{ unreadMessages }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-900">{{ t('dashboard.kpiNewMessages') }}</p>
        </div>
      </div>
    </div>

    <!-- Meine Trips -->
    <div v-if="acceptedTrips.length > 0" class="mb-8">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">{{ t('dashboard.activeTransportTitle') }}</h2>
      <div class="space-y-3">
        <NuxtLink
          v-for="trip in acceptedTrips"
          :key="trip.id"
          :to="`/requests/${trip.requestId}`"
          class="block group"
        >
          <div class="p-4 sm:p-5 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer">
            <div class="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <div class="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  v-if="trip.request?.animal?.imageUrl"
                  :src="trip.request.animal.imageUrl"
                  :alt="trip.request.animal.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-slate-300 text-xs font-medium uppercase">
                  {{ trip.request?.animal?.species === 'dog' ? t('map.speciesDog') : t('map.speciesCat') }}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h3 class="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-slate-700">
                    {{ trip.request?.title ?? 'Transport' }}
                  </h3>
                  <span class="shrink-0 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ t('dashboard.statusAccepted') }}
                  </span>
                </div>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                  <div><span class="text-slate-400">{{ t('dashboard.labelDeparture') }}</span> {{ trip.request?.originAirport }}</div>
                  <div><span class="text-slate-400">{{ t('dashboard.labelArrival') }}</span> {{ trip.request?.destAirport }}</div>
                  <div class="sm:col-span-2"><span class="text-slate-400">{{ t('dashboard.labelDate') }}</span> {{ formatDate(trip.request?.earliestDate ?? '') }}</div>
                  <div v-if="trip.request?.orgName" class="sm:col-span-2 text-slate-500">{{ trip.request.orgName }}</div>
                </dl>
                <div class="flex flex-wrap gap-2 mt-4">
                  <NuxtLink
                    v-if="conversations.some(c => c.requestId === trip.requestId)"
                    :to="`/inbox/${conversations.find(c => c.requestId === trip.requestId)?.id}`"
                    class="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                    @click.stop
                  >
                    {{ t('dashboard.buttonToChat') }}
                  </NuxtLink>
                  <span class="px-3 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-600 text-sm font-medium">
                    {{ t('dashboard.buttonViewDetails') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Empty State für Trips -->
    <div v-else class="mb-8 p-8 sm:p-10 rounded-lg bg-slate-50 border border-slate-200 text-center">
      <h2 class="text-lg font-semibold text-slate-900 mb-2">{{ t('dashboard.noTripsTitle') }}</h2>
      <p class="text-slate-600 text-sm mb-6 max-w-md mx-auto">{{ t('dashboard.noTripsText') }}</p>
      <NuxtLink
        to="/map"
        class="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
      >
        {{ t('dashboard.noTripsCta') }}
      </NuxtLink>
    </div>

    <!-- Neue Nachrichten -->
    <div v-if="unreadConversations.length > 0" class="mb-8">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">{{ t('dashboard.newMessagesTitle') }}</h2>
        <NuxtLink to="/inbox" class="text-sm text-slate-600 hover:text-slate-900 font-medium">
          {{ t('dashboard.newMessagesShowAll') }}
        </NuxtLink>
      </div>
      <div class="space-y-2">
        <NuxtLink
          v-for="conv in unreadConversations"
          :key="conv.id"
          :to="`/inbox/${conv.id}`"
          class="block p-3 sm:p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all cursor-pointer group"
        >
          <div class="flex items-start gap-3">
            <span class="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-slate-400 group-hover:bg-slate-600" />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-900 text-sm group-hover:text-slate-700">
                {{ conv.requestTitle ?? t('dashboard.request') }} – {{ conv.orgName ?? t('dashboard.organization') }}
              </p>
              <p v-if="conv.lastMessage" class="text-sm text-slate-500 truncate mt-0.5">{{ conv.lastMessage.body }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ formatRelativeTime(conv.lastMessage?.createdAt ?? conv.updatedAt) }}</p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Bewerbungen -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">{{ t('dashboard.applicationsTitle') }}</h2>
        <div v-if="applications.length > 0" class="flex gap-1">
          <button
            v-for="filter in [
              { value: 'all', label: t('dashboard.filterAll') },
              { value: 'PENDING', label: t('dashboard.filterPending') },
              { value: 'ACCEPTED', label: t('dashboard.filterAccepted') },
              { value: 'REJECTED', label: t('dashboard.filterRejected') },
            ]"
            :key="filter.value"
            :class="[
              'px-2.5 py-1.5 rounded text-sm font-medium transition-colors',
              applicationFilter === filter.value
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
            @click="applicationFilter = filter.value as any"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredApplications.length === 0" class="p-8 rounded-lg bg-slate-50 border border-slate-200 text-center">
        <p class="text-slate-600 text-sm mb-4">
          {{ applicationFilter === 'all' 
            ? t('dashboard.noApplicationsAll')
            : applicationFilter === 'PENDING' 
              ? t('dashboard.noApplicationsPending')
              : applicationFilter === 'ACCEPTED'
                ? t('dashboard.noApplicationsAccepted')
                : t('dashboard.noApplicationsRejected') }}
        </p>
        <NuxtLink
          v-if="applicationFilter === 'all'"
          to="/map"
          class="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          {{ t('dashboard.noApplicationsCta') }}
        </NuxtLink>
      </div>

      <!-- Bewerbungen Liste -->
      <div v-else class="space-y-2">
        <NuxtLink
          v-for="app in filteredApplications"
          :key="app.id"
          :to="`/requests/${app.requestId}`"
          class="block p-3 sm:p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all cursor-pointer group"
        >
          <div class="flex items-start gap-4">
            <div class="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
              <img
                v-if="app.request?.animal?.imageUrl"
                :src="app.request.animal.imageUrl"
                :alt="app.request.animal.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium uppercase">
                {{ app.request?.animal?.species === 'dog' ? t('map.speciesDog') : t('map.speciesCat') }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-medium text-slate-900 text-sm group-hover:text-slate-700">
                  {{ app.request?.title ?? t('dashboard.request') }}
                </h3>
                <span
                  :class="[
                    'shrink-0 px-2 py-0.5 rounded text-xs font-medium border',
                    getStatusBadgeClass(app.status)
                  ]"
                >
                  {{ applicationStatusLabel(app.status) }}
                </span>
              </div>
              <p class="text-sm text-slate-500 mt-0.5">{{ app.request?.originAirport }} → {{ app.request?.destAirport }} · {{ formatDate(app.request?.earliestDate ?? '') }}</p>
              <NuxtLink
                v-if="conversations.some(c => c.requestId === app.requestId)"
                :to="`/inbox/${conversations.find(c => c.requestId === app.requestId)?.id}`"
                class="inline-block text-xs text-slate-500 hover:text-slate-700 font-medium mt-2"
                @click.stop
              >
                {{ t('dashboard.openChat') }}
              </NuxtLink>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Karte (gleiche wie auf /map) -->
    <div class="mb-8">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">{{ t('dashboard.mapTitle') }}</h2>
      <p class="text-xs text-slate-500 mb-4">{{ t('dashboard.mapDescription') }}</p>
      <FilterBar class="mb-4" @filter="onMapFilter" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div class="lg:col-span-2 rounded-xl overflow-hidden shadow-lg min-w-0">
          <ClientOnly>
            <MapView
              ref="mapRef"
              :pins="mapPins"
              :selected-id="mapSelectedId"
              :selected-route="mapSelectedRoute"
              class="h-[280px] sm:h-[380px] lg:h-[500px] w-full"
            />
            <template #fallback>
              <div class="h-[280px] sm:h-[380px] lg:h-[500px] bg-slate-200 flex items-center justify-center">
                {{ t('dashboard.mapLoading') }}
              </div>
            </template>
          </ClientOnly>
          <p class="mt-3 text-xs sm:text-sm text-slate-600 bg-slate-50 rounded-b-xl px-3 sm:px-4 py-2 sm:py-3 border border-t-0 border-slate-200">
            <strong class="text-slate-700">{{ t('map.transparencyTitle') }}</strong><br />
            {{ t('map.transparencyText') }}
          </p>
        </div>
        <div class="space-y-4 min-w-0">
          <div v-if="mapLoading" class="text-slate-500 text-sm">Suche läuft...</div>
          <template v-else>
            <h3 v-if="mapHeadlineText" class="font-semibold text-slate-900 text-base sm:text-lg">
              {{ mapHeadlineText }}
            </h3>
            <p v-else-if="mapFilters.dateFrom || mapFilters.originAirport || mapFilters.destAirport" class="text-sm sm:text-base text-slate-600">
              {{ t('map.noResults') }}
            </p>
            <div v-if="mapRequests.length === 0 && (mapFilters.dateFrom || mapFilters.originAirport || mapFilters.destAirport)" class="mt-4">
              <NuxtLink
                to="/map"
                class="block w-full px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-center transition-colors min-h-[48px]"
              >
                {{ t('map.notifyCta') }}
              </NuxtLink>
            </div>
            <div class="space-y-4 sm:space-y-6 max-h-[50vh] sm:max-h-[420px] lg:max-h-[520px] overflow-y-auto overflow-x-hidden">
              <section v-if="mapGroupedRequests.direct.length" class="space-y-2">
                <h4 class="text-sm font-medium text-slate-500 uppercase tracking-wide">{{ t('map.groupDirect') }}</h4>
                <div class="space-y-3">
                  <RequestCard
                    v-for="req in mapGroupedRequests.direct"
                    :key="req.id"
                    :request="req"
                    :selected="mapSelectedId === req.id"
                    @click="onMapRequestClick(req)"
                  />
                </div>
              </section>
              <section v-if="mapGroupedRequests.radius.length" class="space-y-2">
                <h4 class="text-sm font-medium text-slate-500 uppercase tracking-wide">{{ t('map.groupRadius') }}</h4>
                <div class="space-y-3">
                  <RequestCard
                    v-for="req in mapGroupedRequests.radius"
                    :key="req.id"
                    :request="req"
                    :selected="mapSelectedId === req.id"
                    @click="onMapRequestClick(req)"
                  />
                </div>
              </section>
              <section v-if="mapGroupedRequests.country.length" class="space-y-2">
                <h4 class="text-sm font-medium text-slate-500 uppercase tracking-wide">{{ t('map.groupCountry') }}</h4>
                <div class="space-y-3">
                  <RequestCard
                    v-for="req in mapGroupedRequests.country"
                    :key="req.id"
                    :request="req"
                    :selected="mapSelectedId === req.id"
                    @click="onMapRequestClick(req)"
                  />
                </div>
              </section>
            </div>
          </template>
        </div>
      </div>
      <div class="mt-4">
        <NuxtLink
          to="/map"
          class="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          {{ t('dashboard.mapCta') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
