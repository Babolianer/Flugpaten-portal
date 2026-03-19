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

const props = defineProps<{
  request: Request
  selected?: boolean
}>()

defineEmits<{
  click: []
}>()

const { request, selected } = toRefs(props)
const isReserved = computed(() => request.value?.status === 'MATCHED')
const togetherPopoverOpen = ref(false)
const hasPartners = computed(() => !!request.value?.group?.partners?.length)
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
</script>

<template>
  <div
    class="p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-amber-400 flex gap-3 sm:gap-4 min-w-0 overflow-hidden sm:overflow-visible"
    :class="selected ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'"
    @click="$emit('click')"
  >
    <!-- Tierbild oder Platzhalter -->
    <div class="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
      <!-- Wasserzeichen „Reserviert“ -->
      <div
        v-if="isReserved"
        class="absolute inset-0 z-10 pointer-events-none"
        aria-hidden="true"
      >
        <div class="absolute inset-0 bg-slate-900/10" />
        <div class="absolute -left-8 top-3 w-36 rotate-[-25deg] bg-amber-500/90 text-slate-900 text-[10px] sm:text-xs font-extrabold tracking-wider text-center py-1 shadow">
          {{ getRequestStatusLabel('MATCHED', true) }}
        </div>
      </div>
      <img
        v-if="request.animal?.imageUrl"
        :src="request.animal.imageUrl"
        :alt="request.animal.name"
        class="w-full h-full object-cover"
        @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-2xl text-slate-400">
        {{ request.animal?.species === 'dog' ? '🐕' : request.animal?.species === 'cat' ? '🐈' : '🐾' }}
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap gap-2 mb-2">
        <span
          v-if="request.status"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
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
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
            :title="request.group?.title"
            aria-label="Gemeinsam fliegen"
            @click.stop="toggleTogetherPopover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3 h-3 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0 0-7.07 5 5 0 0 0-7.07 0L10 4" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 11a5 5 0 0 0-7.07 0L5.52 12.41a5 5 0 0 0 0 7.07 5 5 0 0 0 7.07 0L14 20" />
            </svg>
            {{ t('map.togetherBadge') }}
          </button>

          <div
            v-if="togetherPopoverOpen"
            class="absolute left-0 mt-1 z-50 w-64 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden"
            role="dialog"
            aria-label="Gemeinsam fliegen Info"
          >
            <div class="px-3 py-2 border-b border-slate-100 bg-slate-50">
              <p class="text-xs font-semibold text-slate-800">{{ t('map.togetherPartnerInfo') }}</p>
            </div>
            <div class="p-2 space-y-1 max-h-56 overflow-y-auto">
              <NuxtLink
                v-for="p in request.group?.partners"
                :key="p.id"
                :to="`/requests/${p.id}`"
                class="block rounded-md hover:bg-amber-50 transition-colors px-2 py-2"
                @click.stop="closeTogetherPopover"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-slate-900 truncate">{{ p.title }}</div>
                    <div class="text-xs text-slate-600 truncate">{{ p.originAirport }} → {{ p.destAirport }}</div>
                  </div>
                  <div class="text-[11px] text-slate-500 whitespace-nowrap">
                    {{ new Date(p.earliestDate).toLocaleDateString(locale) }}
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
        <span
          v-if="request.matchType === 'DIRECT'"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800"
        >
          {{ t('map.badgeDirect') }}
        </span>
        <span
          v-else-if="request.matchType === 'RADIUS' && request.distanceKm != null"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
        >
          {{ t('map.badgeRadius', { km: request.distanceKm }) }}
        </span>
        <span
          v-else-if="request.matchType === 'COUNTRY'"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
        >
          {{ t('map.badgeCountry') }}
        </span>
      </div>
      <h3 class="font-semibold text-slate-900">{{ request.title }}</h3>
      <p v-if="request.animal" class="text-sm text-slate-600 mt-1">
        {{ request.animal.name }} ({{ getSpeciesLabel(request.animal.species) }})
      </p>
      <p v-if="hasAnimalTransportOptions" class="text-xs text-slate-500 mt-1">
        {{ animalTransportLabel }}
      </p>
      <p class="text-sm text-slate-600 mt-1">
        {{ formatRoute(request) }}
      </p>
      <p class="text-xs text-slate-500 mt-2">
        {{ new Date(request.earliestDate).toLocaleDateString(locale) }} –
        {{ new Date(request.latestDate).toLocaleDateString(locale) }}
      </p>
      <p
        v-if="request.matchType === 'COUNTRY'"
        class="text-xs text-slate-600 mt-2 italic"
      >
        {{ t('map.countryHint') }}
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <NuxtLink
          v-if="request.organization"
          :to="`/org/${request.organization.slug}`"
          class="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          @click.stop
        >
          {{ request.organization.name }}
        </NuxtLink>
        <NuxtLink
          :to="`/requests/${request.id}`"
          class="inline-flex items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 transition-colors"
          @click.stop
        >
          {{ t('map.detailsApply') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
