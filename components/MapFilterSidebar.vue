<script setup lang="ts">
const { t } = useI18n()

export type FlexibilityOption =
  | 'exact'
  | '1'
  | '3'
  | '7'
  | '14'
  | 'month'
  | 'custom'

export interface MapFilters {
  dateFrom: string
  dateTo: string
  originAirport: string
  destAirport: string
  species: string
  flexOption: FlexibilityOption
  radiusKm: number
  onlyDirectMatches: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: MapFilters
  }>(),
  {}
)

const emit = defineEmits<{
  'update:modelValue': [f: MapFilters]
  filter: [f: MapFilters]
}>()

const filters = reactive<MapFilters>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (v) => Object.assign(filters, v),
  { deep: true }
)

const departureDate = computed({
  get: () => filters.dateFrom || '',
  set: (v: string) => {
    applyFlexToDate(v)
  },
})

function updateFilters(patch: Partial<MapFilters>) {
  Object.assign(filters, patch)
  emit('update:modelValue', { ...filters })
}

const flexOptions: { value: FlexibilityOption; labelKey: string }[] = [
  { value: 'exact', labelKey: 'map.filterFlexExact' },
  { value: '1', labelKey: 'map.filterFlex1' },
  { value: '3', labelKey: 'map.filterFlex3' },
  { value: '7', labelKey: 'map.filterFlex7' },
  { value: '14', labelKey: 'map.filterFlex14' },
  { value: 'month', labelKey: 'map.filterFlexMonth' },
  { value: 'custom', labelKey: 'map.filterFlexCustom' },
]

function applyFlexToDate(from: string) {
  if (!from) {
    filters.dateFrom = ''
    filters.dateTo = ''
    return
  }
  const opt = filters.flexOption
  let dateFrom = from
  let dateTo = from
  if (opt === 'exact') {
    dateFrom = from
    dateTo = from
  } else if (opt === '1' || opt === '3' || opt === '7' || opt === '14') {
    const days = parseInt(opt, 10)
    const dStart = new Date(from)
    dStart.setDate(dStart.getDate() - days)
    dateFrom = dStart.toISOString().slice(0, 10)
    const dEnd = new Date(from)
    dEnd.setDate(dEnd.getDate() + days)
    dateTo = dEnd.toISOString().slice(0, 10)
  } else if (opt === 'month') {
    const d = new Date(from)
    d.setDate(1)
    dateFrom = d.toISOString().slice(0, 10)
    d.setMonth(d.getMonth() + 1)
    d.setDate(0)
    dateTo = d.toISOString().slice(0, 10)
  }
  filters.dateFrom = dateFrom
  filters.dateTo = dateTo
}

function apply() {
  if (filters.dateFrom && filters.flexOption !== 'custom') {
    applyFlexToDate(filters.dateFrom)
  }
  emit('filter', { ...filters })
}

function reset() {
  const def: MapFilters = {
    dateFrom: '',
    dateTo: '',
    originAirport: '',
    destAirport: '',
    species: 'all',
    flexOption: '3',
    radiusKm: 200,
    onlyDirectMatches: false,
  }
  Object.assign(filters, def)
  emit('update:modelValue', def)
  emit('filter', def)
}

watch(
  () => filters.flexOption,
  () => {
    if (filters.dateFrom && filters.flexOption !== 'custom') {
      applyFlexToDate(filters.dateFrom)
    }
  }
)
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-base font-semibold text-slate-700">
      {{ t('map.filterTitle') }}
    </h2>

    <!-- Route -->
    <section class="space-y-3">
      <h3 class="text-sm font-medium text-slate-600">{{ t('map.filterSectionRoute', 'Route') }}</h3>
      <div class="space-y-2">
        <label class="block text-sm text-slate-600">{{ t('map.filterOrigin') }}</label>
        <AirportAutocomplete
          :model-value="filters.originAirport"
          :placeholder="t('map.filterOriginPlaceholder')"
          :aria-label="t('map.filterOrigin')"
          @update:model-value="updateFilters({ originAirport: $event })"
        />
      </div>
      <div class="space-y-2">
        <label class="block text-sm text-slate-600">{{ t('map.filterDest') }}</label>
        <AirportAutocomplete
          :model-value="filters.destAirport"
          :placeholder="t('map.filterDestPlaceholder')"
          :aria-label="t('map.filterDest')"
          @update:model-value="updateFilters({ destAirport: $event })"
        />
      </div>
      <div class="space-y-2">
        <label class="block text-sm text-slate-600">
          {{ t('map.filterRadiusLabel', 'Zielflughafen Umkreis') }} ({{ filters.radiusKm }} km)
        </label>
        <input
          :value="filters.radiusKm"
          type="range"
          min="0"
          max="300"
          step="10"
          class="w-full accent-amber-500"
          @input="updateFilters({ radiusKm: Number(($event.target as HTMLInputElement).value) })"
        />
      </div>
    </section>

    <!-- Reisedatum -->
    <section class="space-y-3">
      <h3 class="text-sm font-medium text-slate-600">{{ t('map.filterSectionDate', 'Reisedatum') }}</h3>
      <div class="space-y-2">
        <label class="block text-sm text-slate-600">{{ t('map.filterDate') }}</label>
        <input
          v-model="departureDate"
          type="date"
          class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>
      <div v-if="filters.flexOption !== 'custom'" class="space-y-2">
        <label class="block text-sm text-slate-600">{{ t('map.filterFlexibility', 'Flexibilität') }}</label>
        <select
          :value="filters.flexOption"
          @change="updateFilters({ flexOption: ($event.target as HTMLSelectElement).value as FlexibilityOption })"
          class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option
            v-for="opt in flexOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ t(opt.labelKey) }}
          </option>
        </select>
      </div>
      <div v-else class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-sm text-slate-600">{{ t('map.filterDateFrom') }}</label>
        <input
          :value="filters.dateFrom"
          @input="updateFilters({ dateFrom: ($event.target as HTMLInputElement).value })"
            type="date"
            class="w-full border border-slate-300 rounded-lg px-3 py-2.5"
          />
        </div>
        <div>
          <label class="block text-sm text-slate-600">{{ t('map.filterDateTo') }}</label>
          <input
            :value="filters.dateTo"
          @input="updateFilters({ dateTo: ($event.target as HTMLInputElement).value })"
            type="date"
            class="w-full border border-slate-300 rounded-lg px-3 py-2.5"
          />
        </div>
      </div>
    </section>

    <!-- Tier -->
    <section class="space-y-3">
      <h3 class="text-sm font-medium text-slate-600">{{ t('map.filterSectionAnimal', 'Tier') }}</h3>
        <select
          :value="filters.species"
          @change="updateFilters({ species: ($event.target as HTMLSelectElement).value })"
        class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      >
        <option value="all">{{ t('map.filterAll') }}</option>
        <option value="cat">{{ t('map.speciesCat') }}</option>
        <option value="dog">{{ t('map.speciesDog') }}</option>
      </select>
    </section>

    <!-- Erweiterte Filter -->
    <section class="space-y-3">
      <h3 class="text-sm font-medium text-slate-600">{{ t('map.filterSectionAdvanced', 'Erweiterte Filter') }}</h3>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          :checked="filters.onlyDirectMatches"
          @change="updateFilters({ onlyDirectMatches: ($event.target as HTMLInputElement).checked })"
          type="checkbox"
          class="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
        />
        <span class="text-sm text-slate-700">{{ t('map.filterOnlyDirect', 'Nur direkte Matches') }}</span>
      </label>
    </section>

    <p class="text-sm text-slate-600">
      {{ t('map.filterExplanationNew', 'Wir zeigen dir auch Anfragen in deiner Nähe oder im selben Zielland. Organisationen unterstützen ggf. Weitertransport.') }}
    </p>

    <div class="flex gap-2">
      <button
        type="button"
        class="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium transition-colors"
        @click="apply"
      >
        {{ t('map.filterApply') }}
      </button>
      <button
        type="button"
        class="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
        @click="reset"
      >
        {{ t('map.filterReset', 'Zurücksetzen') }}
      </button>
    </div>
  </div>
</template>
