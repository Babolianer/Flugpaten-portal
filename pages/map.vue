<script setup lang="ts">
import mapBackground from '~/assets/images/map_background.png'

const { t } = useI18n()

type MatchType = 'DIRECT' | 'RADIUS' | 'COUNTRY'

interface Pin {
  id: string
  type: 'request'
  lat: number
  lng: number
  title?: string
  requestId?: string
  organization?: { name: string; slug: string }
  animal?: { name: string; species: string }
  matchType?: MatchType
  distanceKm?: number
}

interface Request {
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

type FlexibilityOption = 'exact' | '1' | '3' | '7' | '14' | 'custom'

const defaultFilters = (): MapFilterValues => ({
  dateFrom: '',
  dateTo: '',
  originAirport: '',
  destAirport: '',
  species: 'all',
  flexOption: '3',
})

type MapFilterValues = import('~/components/MapFilterBar.vue').MapFilterValues

const filters = ref<MapFilterValues>(defaultFilters())
const pins = ref<Pin[]>([])
const requests = ref<Request[]>([])
const selectedId = ref<string | null>(null)
const mapRef = ref<{ flyTo: (lng: number, lat: number, zoom?: number) => void; fitToPins: () => void } | null>(null)
const loading = ref(false)

const selectedRoute = computed(() => {
  if (!selectedId.value) return null
  const req = requests.value.find((r) => r.id === selectedId.value)
  if (!req || req.originLat == null || req.originLng == null || req.destLat == null || req.destLng == null) return null
  return {
    from: [req.originLng, req.originLat] as [number, number],
    to: [req.destLng, req.destLat] as [number, number],
  }
})

const groupedRequests = computed(() => {
  const direct: Request[] = []
  const radius: Request[] = []
  const country: Request[] = []
  const other: Request[] = []
  for (const r of requests.value) {
    if (r.matchType === 'DIRECT') direct.push(r)
    else if (r.matchType === 'RADIUS') radius.push(r)
    else if (r.matchType === 'COUNTRY') country.push(r)
    else other.push(r)
  }
  return { direct, radius, country, other }
})

const hasDirect = computed(() => groupedRequests.value.direct.length > 0)
/** Wenn alle Treffer zum Filter passen (kein Extended Match) → Anzahl zeigen; sonst "Keine exakten…" */
const hasSimpleMatches = computed(() => groupedRequests.value.other.length > 0)
const headlineText = computed(() => {
  const n = requests.value.length
  if (n === 0) return null
  if (hasDirect.value || hasSimpleMatches.value) return t('map.resultCount', { count: n })
  return t('map.noExactButAlternatives')
})

let loadDataTimer: ReturnType<typeof setTimeout> | null = null
function loadDataDebounced() {
  if (loadDataTimer) clearTimeout(loadDataTimer)
  loadDataTimer = setTimeout(loadData, 300)
}

async function loadData() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.value.dateFrom) params.set('dateFrom', filters.value.dateFrom)
    if (filters.value.dateTo) params.set('dateTo', filters.value.dateTo)
    if (filters.value.originAirport) {
      params.set('origin_iata', filters.value.originAirport)
      params.set('originAirport', filters.value.originAirport)
    }
    if (filters.value.destAirport) {
      params.set('dest_iata', filters.value.destAirport)
      params.set('destAirport', filters.value.destAirport)
    }
    if (filters.value.species && filters.value.species !== 'all') params.set('species', filters.value.species)
    params.set('radius_km', '200')

    const res = await $fetch<{ pins: Pin[]; requests: Request[] }>('/api/map/pins?' + params.toString())
    pins.value = res.pins
    requests.value = res.requests
    nextTick(() => mapRef.value?.fitToPins())
  } finally {
    loading.value = false
  }
}

function onFilter(f: MapFilterValues) {
  filters.value = { ...f }
  loadDataDebounced()
}

function onPinClick(pin: Pin) {
  selectedId.value = pin.requestId ?? pin.id
  const req = pin.requestId ? requests.value.find((x) => x.id === pin.requestId) : null
  if (req && req.originLat != null && req.originLng != null && req.destLat != null && req.destLng != null) {
  } else if (pin && mapRef.value) {
    mapRef.value.flyTo(pin.lng, pin.lat)
  }
}

function onRequestClick(req: Request) {
  selectedId.value = req.id
  if (req.originLat != null && req.originLng != null && req.destLat != null && req.destLng != null) {
  } else {
    const pin = pins.value.find((p) => p.requestId === req.id)
    if (pin && mapRef.value) mapRef.value.flyTo(pin.lng, pin.lat)
  }
}

const hasActiveFilters = computed(
  () =>
    !!(filters.value.dateFrom ||
      filters.value.originAirport ||
      filters.value.destAirport ||
      filters.value.species !== 'all')
)

onMounted(loadData)
</script>

<template>
  <div class="container mx-auto w-4/5 max-w-full px-4 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
    <!-- Banner: Hintergrundbild + schwarze Schrift (gleiche Breite wie andere Elemente) -->
    <section
      class="relative mb-4 sm:mb-6 w-full min-h-[120px] rounded-xl overflow-hidden bg-cover bg-center bg-no-repeat sm:min-h-[140px]"
      :style="{ backgroundImage: `url(${mapBackground})` }"
      aria-label="Intro"
    >
      <div
        class="absolute inset-0 bg-white/70"
        aria-hidden="true"
      />
      <div class="relative z-10 px-4 py-4 sm:px-5 sm:py-5">
        <h1 class="text-lg font-bold tracking-tight text-black sm:text-xl">
          {{ t('map.introTitle') }}
        </h1>
        <p class="mt-1 text-xs font-medium uppercase tracking-wide text-slate-600 sm:mt-1.5 sm:text-sm">
          {{ t('map.introStepsLabel') }}
        </p>
        <ol class="mt-2 space-y-1.5 sm:mt-2.5 sm:space-y-2">
          <li class="flex gap-2.5 text-sm text-slate-900 sm:gap-3 sm:text-base">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white sm:h-6 sm:w-6">1</span>
            <span>{{ t('map.step1') }}</span>
          </li>
          <li class="flex gap-2.5 text-sm text-slate-900 sm:gap-3 sm:text-base">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white sm:h-6 sm:w-6">2</span>
            <span>{{ t('map.step2') }}</span>
          </li>
          <li class="flex gap-2.5 text-sm text-slate-900 sm:gap-3 sm:text-base">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white sm:h-6 sm:w-6">3</span>
            <span>{{ t('map.step3') }}</span>
          </li>
        </ol>
      </div>
    </section>

    <MapFilterBar v-model="filters" class="mb-4 sm:mb-6" @filter="onFilter" />

    <!-- Mobile-first: Karte oben volle Breite, Liste unten; ab lg: 2/3 Karte, 1/3 Liste -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div class="lg:col-span-2 rounded-xl overflow-hidden shadow-lg order-1 min-w-0">
        <ClientOnly>
          <MapView
            ref="mapRef"
            :pins="pins"
            :selected-id="selectedId"
            :selected-route="selectedRoute"
            class="h-[280px] sm:h-[380px] lg:h-[500px] w-full"
            @pin-click="onPinClick"
          />
          <template #fallback>
            <div class="h-[280px] sm:h-[380px] lg:h-[500px] bg-slate-200 flex items-center justify-center">
              Karte wird geladen...
            </div>
          </template>
        </ClientOnly>
        <p class="mt-3 text-xs sm:text-sm text-slate-600 bg-slate-50 rounded-b-xl px-3 sm:px-4 py-2 sm:py-3 border border-t-0 border-slate-200">
          <strong class="text-slate-700">{{ t('map.transparencyTitle') }}</strong><br />
          {{ t('map.transparencyText') }}
        </p>
      </div>

      <div class="space-y-4 order-2 min-w-0">
        <div v-if="loading" class="text-slate-500 text-sm">
          Suche läuft...
        </div>
        <template v-else>
          <h2 v-if="headlineText" class="font-semibold text-slate-900 text-base sm:text-lg">
            {{ headlineText }}
          </h2>
          <p v-else-if="hasActiveFilters" class="text-sm sm:text-base text-slate-600">
            {{ t('map.noResults') }}
          </p>
          <p v-else-if="requests.length === 0" class="text-sm sm:text-base text-slate-600">
            {{ t('map.noResults') }}
          </p>

          <div v-if="requests.length === 0 && hasActiveFilters" class="mt-4">
            <button
              type="button"
              class="w-full px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium transition-colors min-h-[48px]"
            >
              {{ t('map.notifyCta') }}
            </button>
          </div>

          <div class="space-y-4 sm:space-y-6 max-h-[50vh] sm:max-h-[420px] lg:max-h-[520px] overflow-y-auto overflow-x-hidden">
            <section v-if="groupedRequests.direct.length" class="space-y-2">
              <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wide">
                {{ t('map.groupDirect') }}
              </h3>
              <div class="space-y-3">
                <RequestCard
                  v-for="req in groupedRequests.direct"
                  :key="req.id"
                  :request="req"
                  :selected="selectedId === req.id"
                  @click="onRequestClick(req)"
                />
              </div>
            </section>
            <section v-if="groupedRequests.radius.length" class="space-y-2">
              <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wide">
                {{ t('map.groupRadius') }}
              </h3>
              <div class="space-y-3">
                <RequestCard
                  v-for="req in groupedRequests.radius"
                  :key="req.id"
                  :request="req"
                  :selected="selectedId === req.id"
                  @click="onRequestClick(req)"
                />
              </div>
            </section>
            <section v-if="groupedRequests.country.length" class="space-y-2">
              <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wide">
                {{ t('map.groupCountry') }}
              </h3>
              <div class="space-y-3">
                <RequestCard
                  v-for="req in groupedRequests.country"
                  :key="req.id"
                  :request="req"
                  :selected="selectedId === req.id"
                  @click="onRequestClick(req)"
                />
              </div>
            </section>
            <section v-if="groupedRequests.other.length" class="space-y-2">
              <div class="space-y-3">
                <RequestCard
                  v-for="req in groupedRequests.other"
                  :key="req.id"
                  :request="req"
                  :selected="selectedId === req.id"
                  @click="onRequestClick(req)"
                />
              </div>
            </section>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
