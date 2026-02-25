<script setup lang="ts">
const { t } = useI18n()

export type FlexibilityOption = 'exact' | '1' | '3' | '7' | '14' | 'custom'

export interface MapFilterValues {
  dateFrom: string
  dateTo: string
  originAirport: string
  destAirport: string
  species: string
  flexOption: FlexibilityOption
}

const props = defineProps<{
  modelValue: MapFilterValues
}>()

const emit = defineEmits<{
  'update:modelValue': [v: MapFilterValues]
  filter: [v: MapFilterValues]
}>()

const filters = reactive<MapFilterValues>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (v) => Object.assign(filters, v),
  { deep: true }
)

const departureDate = computed({
  get: () => filters.dateFrom || '',
  set: (v: string) => applyFlexToDate(v),
})

const flexOptions: { value: FlexibilityOption; labelKey: string }[] = [
  { value: 'exact', labelKey: 'map.filterFlexExact' },
  { value: '1', labelKey: 'map.filterFlex1' },
  { value: '3', labelKey: 'map.filterFlex3' },
  { value: '7', labelKey: 'map.filterFlex7' },
  { value: '14', labelKey: 'map.filterFlex14' },
  { value: 'custom', labelKey: 'map.filterFlexCustom' },
]

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const today = computed(() => toDateString(new Date()))
const maxDate = computed(() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return toDateString(d)
})

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
  } else if (opt === 'custom') {
    dateFrom = filters.dateFrom || from
    dateTo = filters.dateTo || from
  }
  filters.dateFrom = dateFrom
  filters.dateTo = dateTo
}

function update(patch: Partial<MapFilterValues>) {
  Object.assign(filters, patch)
  emit('update:modelValue', { ...filters })
  if (patch.originAirport === '' || patch.destAirport === '') {
    emit('filter', { ...filters })
  }
}

function onDateFromInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  update({ dateFrom: val })
  if (val && filters.dateTo && val > filters.dateTo) {
    update({ dateTo: val })
  }
}

function onDateToInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  update({ dateTo: val })
  if (val && filters.dateFrom && val < filters.dateFrom) {
    update({ dateFrom: val })
  }
}

function apply() {
  if (filters.dateFrom && filters.flexOption !== 'custom') {
    applyFlexToDate(filters.dateFrom)
  }
  emit('filter', { ...filters })
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
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-5">
    <h2 class="text-base font-semibold text-slate-700">
      {{ t('map.filterTitle') }}
    </h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('map.filterOrigin') }}</label>
        <AirportAutocomplete
          :model-value="filters.originAirport"
          :placeholder="t('map.filterAll')"
          :aria-label="t('map.filterOrigin')"
          :select-style="true"
          @update:model-value="update({ originAirport: $event })"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('map.filterDest') }}</label>
        <AirportAutocomplete
          :model-value="filters.destAirport"
          :placeholder="t('map.filterAll')"
          :aria-label="t('map.filterDest')"
          :select-style="true"
          @update:model-value="update({ destAirport: $event })"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('map.filterDate') }}</label>
        <input
          v-if="filters.flexOption !== 'custom'"
          v-model="departureDate"
          type="date"
          class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          :min="today"
          :max="maxDate"
          :aria-label="t('map.filterDate')"
        />
        <div v-else class="grid grid-cols-2 gap-2">
          <div>
            <label for="date-from" class="sr-only">{{ t('map.filterDateFrom') }}</label>
            <input
              id="date-from"
              :value="filters.dateFrom"
              type="date"
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              :min="today"
              :max="filters.dateTo || maxDate"
              :aria-label="t('map.filterDateFrom')"
              @input="onDateFromInput"
            />
          </div>
          <div>
            <label for="date-to" class="sr-only">{{ t('map.filterDateTo') }}</label>
            <input
              id="date-to"
              :value="filters.dateTo"
              type="date"
              class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              :min="filters.dateFrom || today"
              :max="maxDate"
              :aria-label="t('map.filterDateTo')"
              @input="onDateToInput"
            />
          </div>
        </div>
      </div>
      <div class="flex items-end gap-4">
        <div class="flex-1 min-w-0">
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('map.filterFlexibility', 'Flexibilität') }}</label>
          <select
            :value="filters.flexOption"
            class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            @change="update({ flexOption: ($event.target as HTMLSelectElement).value as FlexibilityOption })"
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
        <div class="flex-1 min-w-0">
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('map.filterSpecies') }}</label>
          <select
            :value="filters.species"
            class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            @change="update({ species: ($event.target as HTMLSelectElement).value })"
          >
            <option value="all">{{ t('map.filterAll') }}</option>
            <option value="dog">{{ t('map.speciesDog') }}</option>
            <option value="cat">{{ t('map.speciesCat') }}</option>
            <option value="rabbit">{{ t('map.speciesRabbit') }}</option>
            <option value="guinea_pig">{{ t('map.speciesGuineaPig') }}</option>
            <option value="bird">{{ t('map.speciesBird') }}</option>
            <option value="reptile">{{ t('map.speciesReptile') }}</option>
            <option value="ferret">{{ t('map.speciesFerret') }}</option>
            <option value="other">{{ t('map.speciesOther') }}</option>
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
