<script setup lang="ts">
const { t, locale } = useI18n()

export interface AirportOption {
  iata: string
  name: string
  city: string
  country: string
  lat: number
  lon: number
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    ariaLabel?: string
    selectStyle?: boolean
  }>(),
  { selectStyle: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [airport: AirportOption]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const query = ref('')
const results = ref<AirportOption[]>([])
const loading = ref(false)
const highlightedIndex = ref(-1)

let searchTimer: ReturnType<typeof setTimeout> | null = null
function searchDebounced() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    if (!query.value.trim()) {
      results.value = []
      loading.value = false
      return
    }
    loading.value = true
    try {
      const res = await $fetch<{ airports: AirportOption[] }>(
        '/api/airports/search?q=' + encodeURIComponent(query.value) + '&limit=15&locale=' + encodeURIComponent(locale.value || 'de')
      )
      results.value = res.airports || []
      highlightedIndex.value = results.value.length ? 0 : -1
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

watch(
  () => query.value,
  () => {
    if (query.value.trim().length >= 2) {
      searchDebounced()
    } else if (query.value.trim().length === 0) {
      results.value = []
      highlightedIndex.value = -1
    }
  }
)

watch(
  () => props.modelValue,
  (v) => {
    if (!isOpen.value && v !== query.value) query.value = v
  }
)

function formatAirport(a: AirportOption) {
  return `${a.city || a.name} (${a.iata}) – ${a.country}`
}

function selectAirport(airport: AirportOption) {
  emit('update:modelValue', airport.iata)
  emit('select', airport)
  query.value = formatAirport(airport)
  isOpen.value = false
}

function clear() {
  query.value = ''
  emit('update:modelValue', '')
  results.value = []
  isOpen.value = false
  inputRef.value?.focus()
}

function onFocus() {
  isOpen.value = true
  if (query.value.trim().length >= 2) searchDebounced()
}

function onBlur() {
  setTimeout(() => {
    isOpen.value = false
  }, 200)
}

function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && results.value[highlightedIndex.value]) {
    e.preventDefault()
    selectAirport(results.value[highlightedIndex.value])
  } else if (e.key === 'Escape') {
    isOpen.value = false
  }
}

onMounted(() => {
  if (props.modelValue) {
    query.value = props.modelValue
  }
})
</script>

<template>
  <div class="relative">
    <div class="relative flex">
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        autocomplete="off"
        :placeholder="placeholder || t('map.filterOriginPlaceholder')"
        :aria-label="ariaLabel"
        :class="[
          'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
          selectStyle ? 'pr-8 cursor-pointer' : 'pr-20',
        ]"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
      <span
        v-if="selectStyle"
        class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
      >
        ▼
      </span>
      <button
        v-else-if="query || modelValue"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-slate-500 hover:text-slate-700"
        aria-label="Löschen"
        @click="clear"
      >
        ✕
      </button>
    </div>
    <div
      v-if="isOpen && (results.length > 0 || loading)"
      class="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-64 overflow-y-auto"
    >
      <div v-if="loading" class="px-4 py-3 text-sm text-slate-500">
        {{ t('common.searching', 'Suchen...') }}
      </div>
      <ul v-else class="py-1">
        <li
          v-for="(airport, idx) in results"
          :key="airport.iata"
          class="cursor-pointer px-4 py-2.5 text-sm transition-colors"
          :class="idx === highlightedIndex ? 'bg-amber-50 text-slate-900' : 'hover:bg-slate-50 text-slate-700'"
          @mousedown.prevent="selectAirport(airport)"
        >
          {{ formatAirport(airport) }}
        </li>
      </ul>
    </div>
  </div>
</template>
