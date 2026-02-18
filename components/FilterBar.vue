<script setup lang="ts">
const { t } = useI18n()

interface Airport {
  id: string
  name: string
  code: string
  lat: number
  lng: number
}
interface Region {
  id: string
  label: string
  airportIds: string[]
}

const filters = reactive({
  dateFrom: '',
  dateTo: '',
  originAirport: '',
  destAirport: '',
  species: 'all',
  flexDays: false,
})

const airports = ref<Airport[]>([])
const airportRegions = ref<Region[]>([])

const emit = defineEmits<{
  filter: [filters: typeof filters]
}>()

/** Einzelnes Abflugdatum für die UI; bei flexDays ±3 Tage für dateFrom/dateTo */
const departureDate = computed({
  get: () => filters.dateFrom || '',
  set: (v: string) => {
    filters.dateFrom = v
    if (!filters.flexDays) filters.dateTo = v
    else applyFlexDays(v)
  },
})

function applyFlexDays(from: string) {
  if (!from) {
    filters.dateTo = ''
    return
  }
  const d = new Date(from)
  d.setDate(d.getDate() - 3)
  const fromStr = d.toISOString().slice(0, 10)
  const d2 = new Date(from)
  d2.setDate(d2.getDate() + 3)
  const toStr = d2.toISOString().slice(0, 10)
  filters.dateFrom = fromStr
  filters.dateTo = toStr
}

watch(
  () => filters.flexDays,
  (flex) => {
    if (flex && filters.dateFrom) applyFlexDays(filters.dateFrom)
    else if (!flex && filters.dateFrom) filters.dateTo = filters.dateFrom
  }
)

function apply() {
  if (filters.flexDays && filters.dateFrom && !filters.dateTo) {
    applyFlexDays(filters.dateFrom)
  }
  emit('filter', { ...filters })
}

onMounted(async () => {
  try {
    const res = await $fetch<{ airports: Airport[]; regions: Region[] }>('/api/airports')
    airports.value = res.airports
    airportRegions.value = res.regions
  } catch {
    airports.value = []
    airportRegions.value = []
  }
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-5">
    <h2 class="text-base font-semibold text-slate-700">
      {{ t('map.filterTitle') }}
    </h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('map.filterOrigin') }}</label>
        <select
          v-model="filters.originAirport"
          class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          :aria-label="t('map.filterOrigin')"
        >
          <option value="">{{ t('map.filterAll') }}</option>
          <optgroup v-for="reg in airportRegions" :key="reg.id" :label="reg.label">
            <option
              v-for="aid in reg.airportIds"
              :key="'o-' + aid"
              :value="airports.find(a => a.id === aid)?.code ?? aid"
            >
              {{ airports.find(a => a.id === aid)?.name ?? aid }} ({{ airports.find(a => a.id === aid)?.code ?? aid }})
            </option>
          </optgroup>
          <optgroup :label="t('map.filterMoreAirports')">
            <option v-for="a in airports" :key="'o-' + a.id" :value="a.code">
              {{ a.name }} ({{ a.code }})
            </option>
          </optgroup>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('map.filterDest') }}</label>
        <select
          v-model="filters.destAirport"
          class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          :aria-label="t('map.filterDest')"
        >
          <option value="">{{ t('map.filterAll') }}</option>
          <optgroup v-for="reg in airportRegions" :key="reg.id" :label="reg.label">
            <option
              v-for="aid in reg.airportIds"
              :key="'d-' + aid"
              :value="airports.find(a => a.id === aid)?.code ?? aid"
            >
              {{ airports.find(a => a.id === aid)?.name ?? aid }} ({{ airports.find(a => a.id === aid)?.code ?? aid }})
            </option>
          </optgroup>
          <optgroup :label="t('map.filterMoreAirports')">
            <option v-for="a in airports" :key="'d-' + a.id" :value="a.code">
              {{ a.name }} ({{ a.code }})
            </option>
          </optgroup>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('map.filterDate') }}</label>
        <input
          v-model="departureDate"
          type="date"
          class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          :aria-label="t('map.filterDate')"
        />
      </div>
      <div class="flex items-end gap-4">
        <label class="flex items-center gap-2 cursor-pointer pb-2.5">
          <input
            v-model="filters.flexDays"
            type="checkbox"
            class="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          <span class="text-sm text-slate-700">{{ t('map.filterFlexDays') }}</span>
        </label>
        <div class="flex-1 min-w-0">
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('map.filterSpecies') }}</label>
          <select
            v-model="filters.species"
            class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="all">{{ t('map.filterAll') }}</option>
            <option value="cat">{{ t('map.speciesCat') }}</option>
            <option value="dog">{{ t('map.speciesDog') }}</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end">
        <button
          type="button"
          class="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium transition-colors"
          @click="apply"
        >
          {{ t('map.filterApply') }}
        </button>
      </div>
    </div>

    <p class="text-sm text-slate-600">
      {{ t('map.filterExplanation') }}
    </p>
  </div>
</template>
