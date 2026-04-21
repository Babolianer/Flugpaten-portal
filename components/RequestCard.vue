<script setup lang="ts">
const { t, locale } = useI18n()
const { getSpeciesLabel } = useSpeciesLabel()
const { getRequestStatusLabel } = useRequestStatus()

type MatchType = 'DIRECT' | 'RADIUS' | 'COUNTRY'

interface Request {
  id: string
  title: string
  originAirport: string
  destAirport: string
  originAirportDisplay?: string
  destAirportsDisplay?: string
  destinations?: Array<{ airportCode: string }>
  earliestDate: string
  latestDate: string
  status?: string
  organization?: { name: string; slug: string }
  animal?: { name: string; species: string; imageUrl?: string | null } | null
  animalCanFlyInCargo?: boolean
  animalCanFlyInCabin?: boolean
  group?: {
    id: string
    title: string
    partners: Array<{
      id: string
      title: string
      status: string
      earliestDate: string | Date
      latestDate: string | Date
      originAirport: string
      destAirport: string
    }>
  } | null
  matchType?: MatchType
  distanceKm?: number
}

const props = withDefaults(
  defineProps<{
    request: Request
    selected?: boolean
    /** true: Bild oben (Startseite-Grid). false/omit: Bild links, Inhalt rechts (/map) */
    stacked?: boolean
  }>(),
  { stacked: false },
)

defineEmits<{
  click: []
}>()

const { request, selected, stacked } = toRefs(props)
const isReserved = computed(() => request.value?.status === 'MATCHED')
const togetherPopoverOpen = ref(false)
const hasPartners = computed(() => !!request.value?.group?.partners?.length)
const animalTransportLabel = computed(() => {
  const cargo = !!request.value?.animalCanFlyInCargo
  const cabin = !!request.value?.animalCanFlyInCabin
  if (cargo && cabin) return t('map.animalTransportBoth')
  if (cabin) return t('map.animalTransportCabin')
  if (cargo) return t('map.animalTransportCargo')
  return t('map.animalTransportUnspecified')
})

function toggleTogetherPopover() {
  togetherPopoverOpen.value = !togetherPopoverOpen.value
}

function closeTogetherPopover() {
  togetherPopoverOpen.value = false
}

function formatRoute(request: Request): string {
  const dests = request.destinations && request.destinations.length > 0
    ? request.destinations.map((d) => d.airportCode).join(', ')
    : request.destAirport
  return `${request.originAirport} → ${dests}`
}

function formatRouteDisplay(request: Request): string {
  const o = request.originAirportDisplay?.trim()
  const d = request.destAirportsDisplay?.trim()
  if (o && d) return `${o} → ${d}`
  return formatRoute(request)
}

const headline = computed(() => request.value.title?.trim() || request.value.animal?.name?.trim() || '–')

const subtitleLine = computed(() => {
  const a = request.value.animal
  if (!a) return ''
  const spec = getSpeciesLabel(a.species)
  if (a.name?.trim()) return `${a.name.trim()} (${spec})`
  return spec
})

function formatDateRangeLine(earliest: string, latest: string) {
  const d1 = new Date(earliest)
  const d2 = new Date(latest)
  if (d1.toDateString() === d2.toDateString()) {
    return d1.toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return `${d1.toLocaleDateString(locale.value, { day: 'numeric', month: 'short' })} – ${d2.toLocaleDateString(locale.value, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

const articleClass = computed(() => {
  if (stacked.value) {
    const base =
      'group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border-2 bg-white transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg'
    return selected.value
      ? `${base} border-amber-500 bg-amber-50 shadow-md ring-1 ring-amber-200/80`
      : `${base} border-slate-200 shadow-sm shadow-slate-200/40`
  }
  const base =
    'group flex min-w-0 flex-row items-stretch gap-3 overflow-hidden rounded-xl border-2 bg-white p-2.5 transition-all cursor-pointer hover:border-amber-400 sm:gap-3 sm:p-3 sm:overflow-visible'
  return selected.value ? `${base} border-amber-500 bg-amber-50` : `${base} border-slate-200 bg-white`
})

const imageWrapClass = computed(() =>
  stacked.value
    ? 'relative h-40 w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 via-amber-50/40 to-slate-100 sm:h-44'
    : 'relative min-h-0 w-[7.25rem] shrink-0 self-stretch overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:w-36',
)

const bodyClass = computed(() =>
  stacked.value ? 'flex min-h-0 min-w-0 flex-1 flex-col p-4 sm:p-5' : 'flex min-h-0 min-w-0 flex-1 flex-col',
)

const titleHeadingClass = computed(() =>
  stacked.value
    ? 'mb-1 line-clamp-2 text-base font-bold leading-snug text-slate-900 sm:text-lg'
    : 'mb-0.5 line-clamp-2 text-sm font-bold leading-snug text-slate-900 sm:text-base',
)

const emojiFallbackClass = computed(() =>
  stacked.value
    ? 'absolute inset-0 flex items-center justify-center text-5xl opacity-70'
    : 'absolute inset-0 flex items-center justify-center text-2xl text-slate-400',
)
</script>

<template>
  <article :class="articleClass" @click="$emit('click')">
    <div :class="imageWrapClass">
      <div
        v-if="isReserved"
        class="absolute inset-0 z-10 pointer-events-none"
        aria-hidden="true"
      >
        <div class="absolute inset-0 bg-slate-900/10" />
        <div class="absolute -left-6 top-4 w-40 rotate-[-25deg] bg-amber-500/90 text-slate-900 text-[10px] sm:text-xs font-extrabold tracking-wider text-center py-1 shadow">
          {{ getRequestStatusLabel('MATCHED', true) }}
        </div>
      </div>
      <img
        v-if="request.animal?.imageUrl"
        :src="request.animal.imageUrl"
        :alt="request.animal.name || headline"
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
      />
      <div
        v-else
        :class="emojiFallbackClass"
        aria-hidden="true"
      >
        {{ request.animal?.species === 'dog' ? '🐕' : request.animal?.species === 'cat' ? '🐈' : '🐾' }}
      </div>
    </div>

    <div :class="bodyClass">
      <div :class="stacked ? 'mb-2 flex flex-wrap gap-1.5' : 'mb-1.5 flex flex-wrap gap-1.5'">
        <span
          v-if="request.status"
          class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
          :class="{
            'bg-emerald-100 text-emerald-800': request.status === 'OPEN',
            'bg-blue-100 text-blue-800': request.status === 'MATCHED',
            'bg-slate-100 text-slate-700': request.status === 'COMPLETED',
            'bg-red-100 text-red-800': request.status === 'CANCELLED',
          }"
        >
          {{ getRequestStatusLabel(request.status, true) }}
        </span>
        <div v-if="hasPartners" class="relative">
          <button
            type="button"
            class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
            :title="request.group?.title"
            aria-label="Gemeinsam fliegen"
            @click.stop="toggleTogetherPopover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="mr-1 h-3 w-3">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0 0-7.07 5 5 0 0 0-7.07 0L10 4" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 11a5 5 0 0 0-7.07 0L5.52 12.41a5 5 0 0 0 0 7.07 5 5 0 0 0 7.07 0L14 20" />
            </svg>
            {{ t('map.togetherBadge') }}
          </button>

          <div
            v-if="togetherPopoverOpen"
            class="absolute left-0 z-50 mt-1 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
            role="dialog"
            aria-label="Gemeinsam fliegen Info"
          >
            <div class="border-b border-slate-100 bg-slate-50 px-3 py-2">
              <p class="text-xs font-semibold text-slate-800">{{ t('map.togetherPartnerInfo') }}</p>
            </div>
            <div class="max-h-56 space-y-1 overflow-y-auto p-2">
              <NuxtLink
                v-for="p in request.group?.partners"
                :key="p.id"
                :to="`/requests/${p.id}`"
                class="block rounded-md px-2 py-2 transition-colors hover:bg-amber-50"
                @click.stop="closeTogetherPopover"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="truncate text-sm font-medium text-slate-900">{{ p.title }}</div>
                    <div class="truncate text-xs text-slate-600">{{ p.originAirport }} → {{ p.destAirport }}</div>
                  </div>
                  <div class="whitespace-nowrap text-[11px] text-slate-500">
                    {{ new Date(p.earliestDate).toLocaleDateString(locale) }}
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
        <span
          v-if="request.matchType === 'DIRECT'"
          class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800"
        >
          {{ t('map.badgeDirect') }}
        </span>
        <span
          v-else-if="request.matchType === 'RADIUS' && request.distanceKm != null"
          class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800"
        >
          {{ t('map.badgeRadius', { km: request.distanceKm }) }}
        </span>
        <span
          v-else-if="request.matchType === 'COUNTRY'"
          class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800"
        >
          {{ t('map.badgeCountry') }}
        </span>
      </div>

      <h3 :class="titleHeadingClass">
        {{ headline }}
      </h3>
      <p v-if="subtitleLine" :class="stacked ? 'mb-3 text-sm text-slate-600' : 'mb-2 text-xs text-slate-600 sm:text-sm'">
        {{ subtitleLine }}
      </p>

      <div
        :class="
          stacked
            ? 'min-h-0 flex-1 space-y-2 text-sm text-slate-800'
            : 'min-h-0 flex-1 space-y-1.5 text-sm text-slate-800'
        "
      >
        <p class="font-medium leading-snug">
          {{ formatRouteDisplay(request) }}
        </p>
        <p :class="stacked ? 'text-slate-600' : 'text-xs text-slate-600 sm:text-sm'">
          {{ formatDateRangeLine(request.earliestDate, request.latestDate) }}
        </p>
        <p class="text-xs leading-snug text-slate-500">
          {{ animalTransportLabel }}
        </p>
      </div>

      <p
        v-if="request.matchType === 'COUNTRY'"
        :class="stacked ? 'mt-2 text-xs italic text-slate-600' : 'mt-1.5 text-[11px] italic leading-snug text-slate-600 sm:text-xs'"
      >
        {{ t('map.countryHint') }}
      </p>

      <div
        :class="
          stacked
            ? 'mt-auto flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-stretch'
            : 'mt-auto flex flex-col gap-2 border-t border-slate-100 pt-2.5 sm:flex-row sm:items-stretch'
        "
      >
        <NuxtLink
          v-if="request.organization"
          :to="`/org/${request.organization.slug}`"
          :title="request.organization.name"
          :class="
            stacked
              ? 'inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50'
              : 'inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50'
          "
          @click.stop
        >
          {{ t('map.cardOrgLink') }}
        </NuxtLink>
        <NuxtLink
          :to="`/requests/${request.id}`"
          :class="
            stacked
              ? 'inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-amber-500 px-3 py-2.5 text-center text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-amber-400'
              : 'inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-400'
          "
          @click.stop
        >
          {{ t('map.detailsApply') }}
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
