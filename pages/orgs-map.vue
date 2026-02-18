<script setup lang="ts">
import type { OrgListItem, OrgLocation, OrgsMapPin } from '~/types/orgs-map'

definePageMeta({ layout: 'default' })

const filters = ref({
  countryCode: '',
  search: '',
})

const organizations = ref<OrgListItem[]>([])
const mapPins = ref<OrgsMapPin[]>([])
const loading = ref(false)
const loadError = ref('')
const selectedPinId = ref<string | null>(null)
const mapRef = ref<{ flyTo: (lng: number, lat: number, zoom?: number) => void } | null>(null)

const countryOptions = [
  { value: '', label: 'Alle Länder' },
  { value: 'DE', label: 'Deutschland' },
  { value: 'AT', label: 'Österreich' },
  { value: 'CH', label: 'Schweiz' },
  { value: 'ES', label: 'Spanien' },
  { value: 'IT', label: 'Italien' },
  { value: 'GR', label: 'Griechenland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'PL', label: 'Polen' },
  { value: 'RO', label: 'Rumänien' },
  { value: 'HU', label: 'Ungarn' },
  { value: 'NL', label: 'Niederlande' },
  { value: 'BE', label: 'Belgien' },
  { value: 'FR', label: 'Frankreich' },
  { value: 'CZ', label: 'Tschechien' },
  { value: 'HR', label: 'Kroatien' },
  { value: 'BG', label: 'Bulgarien' },
  { value: 'TR', label: 'Türkei' },
  { value: 'MA', label: 'Marokko' },
  { value: 'EG', label: 'Ägypten' },
]

async function loadData() {
  loading.value = true
  loadError.value = ''
  try {
    const params = new URLSearchParams()
    if (filters.value.countryCode) params.set('countryCode', filters.value.countryCode)
    if (filters.value.search.trim()) params.set('search', filters.value.search.trim())
    const res = await $fetch<{ organizations: OrgListItem[]; pins: OrgsMapPin[] }>('/api/map/orgs?' + params.toString())
    organizations.value = res.organizations
    mapPins.value = res.pins
    selectedPinId.value = null
  } catch (e) {
    organizations.value = []
    mapPins.value = []
    loadError.value = 'Organisationen konnten nicht geladen werden. Bitte später erneut versuchen.'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  loadData()
}

function onPinClick(pin: OrgsMapPin) {
  selectedPinId.value = pin.id
  if (mapRef.value) mapRef.value.flyTo(pin.lng, pin.lat)
}

function onOrgClick(org: OrgListItem) {
  const first = org.locations[0]
  if (!first) return
  const pin = mapPins.value.find((p) => p.orgId === org.id)
  selectedPinId.value = pin?.id ?? null
  if (mapRef.value) mapRef.value.flyTo(first.lng, first.lat)
}

function onLocationClick(org: OrgListItem, loc: OrgLocation) {
  const pin = mapPins.value.find((p) => p.id === `loc-${loc.id}`)
  if (pin) {
    selectedPinId.value = pin.id
    if (mapRef.value) mapRef.value.flyTo(loc.lng, loc.lat)
  }
}

onMounted(loadData)
</script>

<template>
  <div class="container mx-auto w-4/5 max-w-full px-4 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
    <section class="mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl font-bold text-slate-900">
        Tierschutzorganisationen
      </h1>
      <p class="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
        Hier findest du alle geprüften Tierschutzorganisationen und ihre Standorte auf der Karte. Filtere nach Land oder Suchbegriff.
      </p>
    </section>

    <!-- Filter für Organisationen -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 class="text-base font-semibold text-slate-700 mb-4">
        Filter
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Land</label>
          <select
            v-model="filters.countryCode"
            class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-h-[44px]"
            aria-label="Land filtern"
          >
            <option v-for="opt in countryOptions" :key="opt.value || 'all'" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Suche (Name / Beschreibung)</label>
          <input
            v-model="filters.search"
            type="text"
            class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-h-[44px]"
            placeholder="z.B. Tierheim, Hund"
            aria-label="Suchbegriff"
            @keydown.enter="applyFilters"
          />
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium transition-colors min-h-[44px]"
            @click="applyFilters"
          >
            Suchen
          </button>
        </div>
      </div>
    </div>

    <!-- Karte + Organisationsliste -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div class="lg:col-span-2 rounded-xl overflow-hidden shadow-lg min-w-0 order-1">
        <ClientOnly>
          <MapView
            ref="mapRef"
            :pins="mapPins"
            :selected-id="selectedPinId"
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
          <strong class="text-slate-700">Hinweis:</strong> Jeder Punkt entspricht einem Standort einer Tierschutzorganisation. Klicke auf einen Punkt oder eine Organisation in der Liste.
        </p>
      </div>

      <div class="space-y-4 order-2 min-w-0">
        <div v-if="loadError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
            {{ loadError }}
          </div>
          <div v-if="loading" class="text-slate-500 text-sm">
            Lade...
          </div>
          <template v-else>
          <h2 class="font-semibold text-slate-900 text-base sm:text-lg">
            {{ organizations.length }} Organisation{{ organizations.length !== 1 ? 'en' : '' }}
          </h2>
          <div class="space-y-4 max-h-[50vh] sm:max-h-[420px] lg:max-h-[520px] overflow-y-auto overflow-x-hidden">
            <div
              v-for="org in organizations"
              :key="org.id"
              class="rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-slate-300 transition-colors"
            >
              <div
                class="p-4 hover:bg-slate-50/50 cursor-pointer"
                @click="onOrgClick(org)"
              >
                <div class="flex items-start gap-3">
                  <div
                    v-if="org.logoUrl"
                    class="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
                  >
                    <img :src="org.logoUrl" :alt="org.name" class="w-full h-full object-contain">
                  </div>
                  <div v-else class="shrink-0 w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-lg">
                    🐾
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="font-medium text-slate-900 text-sm sm:text-base">
                      {{ org.name }}
                    </h3>
                    <p v-if="org.description" class="text-slate-500 text-xs sm:text-sm mt-0.5 line-clamp-2">
                      {{ org.description }}
                    </p>
                    <p class="text-slate-400 text-xs mt-1">
                      {{ org.locationCount }} Standort{{ org.locationCount !== 1 ? 'e' : '' }}
                    </p>
                    <NuxtLink
                      :to="`/org/${org.slug}`"
                      class="inline-block mt-2 text-sm font-medium text-amber-600 hover:text-amber-700"
                      @click.stop
                    >
                      Profil ansehen →
                    </NuxtLink>
                  </div>
                </div>
              </div>
              <ul class="border-t border-slate-100 divide-y divide-slate-100">
                <li
                  v-for="loc in org.locations"
                  :key="loc.id"
                  class="flex items-center justify-between gap-2 px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                  @click="onLocationClick(org, loc)"
                >
                  <span class="text-slate-700 truncate">{{ loc.title || loc.city }} – {{ loc.city }}, {{ loc.countryCode }}</span>
                  <span
                    class="shrink-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow"
                    :class="{ 'ring-2 ring-amber-400': selectedPinId === `loc-${loc.id}` }"
                  />
                </li>
              </ul>
            </div>
          </div>
          <p v-if="organizations.length === 0 && !loading" class="text-slate-500 text-sm py-4">
            Keine Organisationen gefunden. Passe die Filter an.
          </p>
        </template>
      </div>
    </div>
  </div>
</template>
