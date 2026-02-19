<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
/** Nach Registrierung gesetzt; wird genutzt, um die „gerade registriert – warte auf Freigabe“-Ansicht anzuzeigen. */
const justRegistered = ref(false)
const asOrgId = computed(() => (route.query.asOrg as string) || '')
const isAdminViewAsOrg = computed(() => !!user.value && user.value.role === 'ADMIN' && !!asOrgId.value)

interface Location {
  id: string
  title: string
  city: string
  countryCode: string
  address: string | null
  lat: number
  lng: number
}

interface Animal {
  id: string
  name: string
  species: string
  sex: string | null
  sizeClass: string | null
  notes: string | null
  imageUrl?: string | null
}

interface Request {
  id: string
  title: string
  details: string | null
  status: string
  earliestDate: string
  latestDate: string
  originAirport: string
  destAirport: string
  originLat: number | null
  originLng: number | null
  destLat: number | null
  destLng: number | null
  animal: { id: string; name: string; species: string } | null
}

interface Org {
  id: string
  name: string
  slug: string
  description: string | null
  landingContent?: string | null
  website: string | null
  contactEmail: string
  status?: string
  logoUrl?: string | null
  locations: Location[]
  animals: Animal[]
  requests: Request[]
}

const orgs = ref<Org[]>([])
const loading = ref(true)
const message = ref('')
const activeTab = ref<'locations' | 'animals' | 'requests' | 'inbox' | 'settings'>('locations')
const selectedOrgId = ref('')
const sortBy = ref<'title' | 'date'>('title')

const showModal = ref(false)
const modalMode = ref<'location' | 'animal' | 'request'>('location')
const editingId = ref<string | null>(null)

const inbox = ref<{ id: string; requestId: string | null; requestTitle: string | null; userDisplayName: string | null; lastMessage: { body: string; createdAt: string } | null }[]>([])
const inboxPollingInterval = ref<NodeJS.Timeout | null>(null)
const isPageVisible = ref(true)
const copiedRequestId = ref<string | null>(null)

const formLocation = reactive({
  title: '',
  countryCode: 'DE',
  city: '',
  address: '',
  lat: 0,
  lng: 0,
})

const formAnimal = reactive({
  name: '',
  species: 'cat',
  sex: '',
  sizeClass: '',
  notes: '',
  imageUrl: '' as string,
})
const animalImageFile = ref<File | null>(null)
const animalImagePreviewUrl = ref<string | null>(null)

const { locale } = useI18n()
const { getRequestStatusLabel, statusOptions } = useRequestStatus()

const formRequest = reactive({
  title: '',
  details: '',
  earliestDate: '',
  latestDate: '',
  originAirport: '',
  destAirport: '',
  originLat: null as number | null,
  originLng: null as number | null,
  destLat: null as number | null,
  destLng: null as number | null,
  animalId: '',
  status: 'OPEN' as 'OPEN' | 'MATCHED' | 'COMPLETED' | 'CANCELLED',
})

const formSettings = reactive({
  description: '',
  landingContent: '',
  website: '',
  contactEmail: '',
  contactPhone: '',
  contactInstagram: '',
  contactFacebook: '',
  logoUrl: '' as string,
})

const airports = ref<{ id: string; name: string; code: string; lat: number; lng: number }[]>([])
const airportRegions = ref<{ id: string; label: string; airportIds: string[] }[]>([])

const selectedOrg = computed(() => orgs.value.find((o) => o.id === selectedOrgId.value) || null)

/** Bei PENDING-Organisationen keine Tabs – nur Hinweis „Wartet auf Freigabe“. Kein Zugriff auf Standorte, Tiere, Transporte, Einstellungen. */
const allowedTabs = computed(() => {
  const all: Array<'locations' | 'animals' | 'requests' | 'inbox' | 'settings'> = ['locations', 'animals', 'requests', 'inbox', 'settings']
  if (selectedOrg.value?.status === 'PENDING') return []
  return all
})

const sortedLocations = computed(() => {
  const list = selectedOrg?.value?.locations ?? []
  return [...list].sort((a, b) => a.title.localeCompare(b.title))
})

const sortedAnimals = computed(() => {
  const list = selectedOrg?.value?.animals ?? []
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
})

const sortedRequests = computed(() => {
  const list = selectedOrg?.value?.requests ?? []
  return [...list].sort((a, b) =>
    sortBy.value === 'date'
      ? new Date(b.earliestDate).getTime() - new Date(a.earliestDate).getTime()
      : a.title.localeCompare(b.title)
  )
})

async function load() {
  try {
    const dashboardQuery = isAdminViewAsOrg.value ? { orgId: asOrgId.value } : {}
    const [res, airportsRes] = await Promise.all([
      $fetch<{ organizations: Org[] }>('/api/org/dashboard', { query: dashboardQuery }),
      $fetch<{ airports: { id: string; name: string; code: string; lat: number; lng: number }[]; regions: { id: string; label: string; airportIds: string[] }[] }>('/api/airports'),
    ])
    orgs.value = res.organizations
    airports.value = airportsRes.airports
    airportRegions.value = airportsRes.regions
    if (res.organizations[0]) {
      selectedOrgId.value = res.organizations[0].id
      formLocation.countryCode = 'DE'
    }
    if (selectedOrgId.value) {
      const o = res.organizations.find((x) => x.id === selectedOrgId.value)
      if (o) {
        formSettings.description = o.description ?? ''
        formSettings.landingContent = o.landingContent ?? ''
        formSettings.website = o.website ?? ''
        formSettings.contactEmail = o.contactEmail ?? ''
        formSettings.logoUrl = o.logoUrl ?? ''
      }
    }
  } catch (e: unknown) {
    if ((e as { statusCode?: number })?.statusCode === 403) await navigateTo('/login')
    message.value = 'Fehler beim Laden'
  } finally {
    loading.value = false
  }
}

async function loadInbox() {
  try {
    const query = isAdminViewAsOrg.value && selectedOrgId.value ? { orgId: selectedOrgId.value } : {}
    const res = await $fetch<{ conversations: { id: string; requestId: string | null; requestTitle: string | null; userDisplayName: string | null; lastMessage: { body: string; createdAt: string } | null }[] }>('/api/org/dashboard/conversations', { query })
    inbox.value = res.conversations
  } catch {
    inbox.value = []
  }
}

function openCreate(mode: 'location' | 'animal' | 'request') {
  modalMode.value = mode
  editingId.value = null
  if (mode === 'location') {
    Object.assign(formLocation, { title: '', city: '', address: '', lat: 0, lng: 0, countryCode: 'DE' })
  }
  if (mode === 'animal') {
    Object.assign(formAnimal, { name: '', species: 'cat', sex: '', sizeClass: '', notes: '', imageUrl: '' })
    if (animalImagePreviewUrl.value && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      URL.revokeObjectURL(animalImagePreviewUrl.value)
    }
    animalImagePreviewUrl.value = null
    animalImageFile.value = null
  }
  if (mode === 'request') {
    Object.assign(formRequest, {
      title: '',
      details: '',
      earliestDate: '',
      latestDate: '',
      originAirport: '',
      destAirport: '',
      animalId: '',
      originLat: null,
      originLng: null,
      destLat: null,
      destLng: null,
      status: 'OPEN',
    })
  }
  showModal.value = true
}

function openEditLocation(loc: Location) {
  modalMode.value = 'location'
  editingId.value = loc.id
  Object.assign(formLocation, {
    title: loc.title,
    city: loc.city,
    countryCode: loc.countryCode,
    address: loc.address ?? '',
    lat: loc.lat,
    lng: loc.lng,
  })
  showModal.value = true
}

function onAnimalImageChange(e: Event) {
  if (animalImagePreviewUrl.value && typeof URL !== 'undefined' && URL.revokeObjectURL) {
    URL.revokeObjectURL(animalImagePreviewUrl.value)
  }
  animalImagePreviewUrl.value = null
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  animalImageFile.value = file
  if (file && typeof URL !== 'undefined' && URL.createObjectURL) {
    animalImagePreviewUrl.value = URL.createObjectURL(file)
  }
}

function openEditAnimal(a: Animal) {
  modalMode.value = 'animal'
  editingId.value = a.id
  Object.assign(formAnimal, {
    name: a.name,
    species: a.species,
    sex: a.sex ?? '',
    sizeClass: a.sizeClass ?? '',
    notes: a.notes ?? '',
    imageUrl: a.imageUrl ?? '',
  })
  if (animalImagePreviewUrl.value && typeof URL !== 'undefined' && URL.revokeObjectURL) {
    URL.revokeObjectURL(animalImagePreviewUrl.value)
  }
  animalImagePreviewUrl.value = null
  animalImageFile.value = null
  showModal.value = true
}

function openEditRequest(r: Request) {
  modalMode.value = 'request'
  editingId.value = r.id
  Object.assign(formRequest, {
    title: r.title,
    details: r.details ?? '',
    earliestDate: r.earliestDate.slice(0, 10),
    latestDate: r.latestDate.slice(0, 10),
    originAirport: r.originAirport,
    destAirport: r.destAirport,
    animalId: r.animal?.id ?? '',
    originLat: r.originLat,
    originLng: r.originLng,
    destLat: r.destLat,
    destLng: r.destLng,
    status: (r.status || 'OPEN') as 'OPEN' | 'MATCHED' | 'COMPLETED' | 'CANCELLED',
  })
  showModal.value = true
}

async function loadSettingsForTab() {
  if (!selectedOrgId.value) return
  try {
    const res = await $fetch<{ description: string | null; landingContent: string | null; website: string | null; contactEmail: string; contactPhone: string | null; contactInstagram: string | null; contactFacebook: string | null; logoUrl: string | null }>(
      '/api/org/dashboard/settings',
      { query: { organizationId: selectedOrgId.value } }
    )
    formSettings.description = res.description ?? ''
    formSettings.landingContent = res.landingContent ?? ''
    formSettings.website = res.website ?? ''
    formSettings.contactEmail = res.contactEmail ?? ''
    formSettings.contactPhone = res.contactPhone ?? ''
    formSettings.contactInstagram = res.contactInstagram ?? ''
    formSettings.contactFacebook = res.contactFacebook ?? ''
    formSettings.logoUrl = res.logoUrl ?? ''
  } catch {
    const o = selectedOrg.value
    if (o) {
      formSettings.description = o.description ?? ''
      formSettings.landingContent = (o as { landingContent?: string }).landingContent ?? ''
      formSettings.website = o.website ?? ''
      formSettings.contactEmail = o.contactEmail ?? ''
      formSettings.contactPhone = (o as { contactPhone?: string }).contactPhone ?? ''
      formSettings.contactInstagram = (o as { contactInstagram?: string }).contactInstagram ?? ''
      formSettings.contactFacebook = (o as { contactFacebook?: string }).contactFacebook ?? ''
      formSettings.logoUrl = o.logoUrl ?? ''
    }
  }
}

async function saveLocation() {
  if (!selectedOrgId.value || !formLocation.title || !formLocation.city) return
  try {
    if (editingId.value) {
      await $fetch(`/api/org/dashboard/locations/${editingId.value}`, {
        method: 'PATCH',
        body: formLocation,
      })
    } else {
      await $fetch('/api/org/dashboard/locations', {
        method: 'POST',
        body: { organizationId: selectedOrgId.value, ...formLocation },
      })
    }
    message.value = ''
    showModal.value = false
    await load()
  } catch {
    message.value = 'Fehler beim Speichern'
  }
}

async function saveAnimal() {
  if (!selectedOrgId.value || !formAnimal.name || !formAnimal.species) return
  try {
    if (editingId.value) {
      if (animalImageFile.value) {
        const body = new FormData()
        body.append('name', formAnimal.name)
        body.append('species', formAnimal.species)
        body.append('sex', formAnimal.sex)
        body.append('sizeClass', formAnimal.sizeClass)
        body.append('notes', formAnimal.notes)
        body.append('image', animalImageFile.value)
        await $fetch(`/api/org/dashboard/animals/${editingId.value}`, {
          method: 'PATCH',
          body,
        })
      } else {
        await $fetch(`/api/org/dashboard/animals/${editingId.value}`, {
          method: 'PATCH',
          body: {
            name: formAnimal.name,
            species: formAnimal.species,
            sex: formAnimal.sex || null,
            sizeClass: formAnimal.sizeClass || null,
            notes: formAnimal.notes || null,
          },
        })
      }
    } else {
      if (animalImageFile.value) {
        const body = new FormData()
        body.append('organizationId', selectedOrgId.value)
        body.append('name', formAnimal.name)
        body.append('species', formAnimal.species)
        body.append('sex', formAnimal.sex)
        body.append('sizeClass', formAnimal.sizeClass)
        body.append('notes', formAnimal.notes)
        body.append('image', animalImageFile.value)
        await $fetch('/api/org/dashboard/animals', {
          method: 'POST',
          body,
        })
      } else {
        await $fetch('/api/org/dashboard/animals', {
          method: 'POST',
          body: { organizationId: selectedOrgId.value, ...formAnimal },
        })
      }
    }
    message.value = ''
    showModal.value = false
    await load()
  } catch {
    message.value = 'Fehler beim Speichern'
  }
}

async function saveRequest() {
  if (!selectedOrgId.value || !formRequest.title || !formRequest.earliestDate || !formRequest.latestDate || !formRequest.originAirport || !formRequest.destAirport) return
  const origin = airports.value.find((a) => a.code === formRequest.originAirport || a.id === formRequest.originAirport)
  const dest = airports.value.find((a) => a.code === formRequest.destAirport || a.id === formRequest.destAirport)
  try {
    const body = {
      organizationId: selectedOrgId.value,
      title: formRequest.title,
      details: formRequest.details || undefined,
      earliestDate: formRequest.earliestDate,
      latestDate: formRequest.latestDate,
      originAirport: origin?.code ?? formRequest.originAirport,
      destAirport: dest?.code ?? formRequest.destAirport,
      animalId: formRequest.animalId || undefined,
      originLat: origin?.lat ?? formRequest.originLat,
      originLng: origin?.lng ?? formRequest.originLng,
      destLat: dest?.lat ?? formRequest.destLat,
      destLng: dest?.lng ?? formRequest.destLng,
      ...(editingId.value ? { status: formRequest.status } : {}),
    }
    if (editingId.value) {
      await $fetch(`/api/org/dashboard/requests/${editingId.value}`, { method: 'PATCH', body })
    } else {
      await $fetch('/api/org/dashboard/requests', { method: 'POST', body })
    }
    message.value = ''
    showModal.value = false
    await load()
  } catch {
    message.value = 'Fehler beim Speichern'
  }
}

async function saveSettings() {
  if (!selectedOrgId.value) return
  try {
    await $fetch('/api/org/dashboard/settings', {
      method: 'PATCH',
      body: { organizationId: selectedOrgId.value, ...formSettings },
    })
    message.value = ''
    await load()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusCode?: number }
    const detail = err?.data?.message
    message.value = detail ? `Fehler beim Speichern: ${detail}` : 'Fehler beim Speichern. Evtl. Migration ausführen: npx prisma migrate dev'
  }
}

async function deleteLocation(id: string) {
  if (!confirm('Standort wirklich löschen?')) return
  try {
    await $fetch(`/api/org/dashboard/locations/${id}`, { method: 'DELETE' })
    await load()
  } catch {
    message.value = 'Fehler beim Löschen'
  }
}

async function deleteAnimal(id: string) {
  if (!confirm('Tier wirklich löschen?')) return
  try {
    await $fetch(`/api/org/dashboard/animals/${id}`, { method: 'DELETE' })
    await load()
  } catch {
    message.value = 'Fehler beim Löschen'
  }
}

async function deleteRequest(id: string) {
  if (!confirm('Anfrage wirklich löschen?')) return
  try {
    await $fetch(`/api/org/dashboard/requests/${id}`, { method: 'DELETE' })
    await load()
  } catch {
    message.value = 'Fehler beim Löschen'
  }
}

async function copyRequestLink(r: Request) {
  if (import.meta.client && typeof navigator !== 'undefined' && navigator.clipboard) {
    const origin = window.location.origin
    const url = `${origin}/requests/${r.id}`
    await navigator.clipboard.writeText(url)
    copiedRequestId.value = r.id
    setTimeout(() => { copiedRequestId.value = null }, 2000)
  }
}

watch(selectedOrgId, (id) => {
  const o = orgs.value.find((x) => x.id === id)
  if (o) {
    formSettings.description = o.description ?? ''
    formSettings.landingContent = o.landingContent ?? ''
    formSettings.website = o.website ?? ''
    formSettings.contactEmail = o.contactEmail ?? ''
    formSettings.contactPhone = (o as { contactPhone?: string }).contactPhone ?? ''
    formSettings.contactInstagram = (o as { contactInstagram?: string }).contactInstagram ?? ''
    formSettings.contactFacebook = (o as { contactFacebook?: string }).contactFacebook ?? ''
    formSettings.logoUrl = o.logoUrl ?? ''
  }
  if (o?.status === 'PENDING') activeTab.value = 'locations'
})

watch([activeTab, selectedOrgId], ([tab, id]) => {
  if (tab === 'settings' && id) loadSettingsForTab()
})

watch(allowedTabs, (tabs) => {
  if (tabs.length > 0 && !tabs.includes(activeTab.value)) activeTab.value = tabs[0]
})

function startInboxPolling() {
  if (inboxPollingInterval.value) return
  
  inboxPollingInterval.value = setInterval(async () => {
    // Only poll if page is visible and inbox tab is active
    if (isPageVisible.value && activeTab.value === 'inbox') {
      await loadInbox()
    }
  }, 5000) // Poll every 5 seconds
}

function stopInboxPolling() {
  if (inboxPollingInterval.value) {
    clearInterval(inboxPollingInterval.value)
    inboxPollingInterval.value = null
  }
}

function handleVisibilityChange() {
  isPageVisible.value = !document.hidden
  if (isPageVisible.value && activeTab.value === 'inbox') {
    // Immediately load inbox when page becomes visible
    loadInbox()
  }
}

watch(activeTab, (tab) => {
  if (tab === 'inbox') {
    loadInbox()
    startInboxPolling()
  } else {
    stopInboxPolling()
  }
})

onMounted(() => {
  if (user.value?.role === 'ADMIN' && !route.query.asOrg) {
    navigateTo('/admin')
    return
  }
  if (route.query.registered === '1') {
    justRegistered.value = true
    const q = { ...route.query }
    delete q.registered
    router.replace({ path: route.path, query: q })
  }
  load()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopInboxPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div class="container mx-auto w-4/5 max-w-full px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
    <!-- Admin: Infobar „Als Organisation anzeigen“ mit Zurück zum Admin -->
    <div
      v-if="isAdminViewAsOrg && selectedOrg"
      class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <span>
        Sie sehen das Dashboard als <strong>{{ selectedOrg.name }}</strong>.
      </span>
      <NuxtLink
        to="/admin"
        class="inline-flex items-center rounded-lg border border-amber-600 bg-amber-500 px-4 py-2 font-medium text-slate-900 hover:bg-amber-600 transition-colors"
      >
        Zurück zum Admin
      </NuxtLink>
    </div>

    <div class="border-b border-slate-200 pb-6 mb-6">
      <h1 class="text-xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
      <p class="text-slate-500 text-sm mt-1">Verwaltung Ihrer Organisation</p>
    </div>
    <div v-if="message" class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
      {{ message }}
    </div>
    <!-- Erfolgsmeldung direkt nach Organisations-Registrierung -->
    <div
      v-if="!loading && justRegistered && selectedOrg?.status === 'PENDING'"
      class="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-center"
    >
      <p class="font-medium text-emerald-800">
        Sie haben sich erfolgreich registriert.
      </p>
      <p class="mt-2 text-sm text-emerald-700">
        Ihre Organisation <strong>{{ selectedOrg.name }}</strong> wartet auf die Freigabe durch einen Administrator.
        Sobald die Freigabe erteilt wurde, können Sie hier Standorte, Tiere und Transporte verwalten.
      </p>
    </div>
    <div v-if="loading" class="text-slate-500 text-sm">Lade...</div>
    <div v-else-if="orgs.length === 0" class="p-6 rounded-lg bg-slate-50 border border-slate-200">
      <p class="text-slate-600 text-sm">
        Sie haben keine genehmigten Organisationen. Registrieren Sie eine Organisation und warten Sie auf die Freigabe.
      </p>
      <NuxtLink to="/org/register" class="inline-flex items-center justify-center mt-4 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 min-h-[44px] transition-colors">
        Organisation registrieren
      </NuxtLink>
    </div>
    <div v-else>
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <label class="text-sm font-medium text-slate-700">Organisation</label>
        <select v-model="selectedOrgId" class="border border-slate-300 rounded-lg px-3 py-2 w-full sm:w-72 min-h-[44px] text-sm text-slate-900 bg-white">
          <option v-for="o in orgs" :key="o.id" :value="o.id">{{ o.name }}{{ o.status === 'PENDING' ? ' (In Bearbeitung)' : '' }}</option>
        </select>
        <span
          v-if="selectedOrg?.status === 'PENDING'"
          class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200"
        >
          In Bearbeitung – Wartet auf Freigabe
        </span>
      </div>
      <div v-if="allowedTabs.length > 0" class="flex flex-wrap gap-1 mb-6 -mx-1 overflow-x-auto pb-1 sm:overflow-visible sm:mx-0 sm:pb-0 border-b border-slate-200">
        <button
          v-for="t in allowedTabs"
          :key="t"
          type="button"
          :class="['px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[44px]', activeTab === t ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
          @click="activeTab = t"
        >
          {{ t === 'locations' ? 'Standorte' : t === 'animals' ? 'Tiere' : t === 'requests' ? 'Transporte' : t === 'inbox' ? 'Anfragen' : 'Einstellungen' }}
        </button>
      </div>

      <!-- PENDING: Nur Hinweis, keine Bereiche (keine Standorte/Tiere/Transporte/Einstellungen) -->
      <div v-if="selectedOrg?.status === 'PENDING'" class="py-8 px-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
        <p class="text-slate-600 text-sm">
          Ihre Organisation wartet auf Freigabe. Nach der Freigabe haben Sie Zugriff auf Standorte, Tiere, Transporte und Einstellungen.
        </p>
      </div>

      <!-- Inhalte nur bei genehmigter Organisation -->
      <template v-else>
      <!-- Locations -->
      <div v-if="activeTab === 'locations'" class="space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Standorte</h2>
          <button type="button" class="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors" @click="openCreate('location')">
            Standort hinzufügen
          </button>
        </div>
        <ul v-if="sortedLocations.length" class="space-y-2">
          <li v-for="loc in sortedLocations" :key="loc.id" class="p-3 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
            <span class="text-sm text-slate-900">{{ loc.title }} – {{ loc.city }}</span>
            <div class="flex gap-3 shrink-0">
              <button type="button" class="text-slate-600 hover:text-slate-900 text-sm font-medium" @click="openEditLocation(loc)">Bearbeiten</button>
              <button type="button" class="text-red-600 hover:text-red-700 text-sm font-medium" @click="deleteLocation(loc.id)">Löschen</button>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-500 py-4">Keine Standorte.</p>
      </div>

      <!-- Animals -->
      <div v-if="activeTab === 'animals'" class="space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Tiere</h2>
          <button type="button" class="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors" @click="openCreate('animal')">
            Tier hinzufügen
          </button>
        </div>
        <ul v-if="sortedAnimals.length" class="space-y-2">
          <li v-for="a in sortedAnimals" :key="a.id" class="p-3 rounded-lg bg-white border border-slate-200 flex justify-between items-center gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                <img v-if="a.imageUrl" :src="a.imageUrl" :alt="a.name" class="w-full h-full object-cover" @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')" />
                <div v-else class="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium uppercase">{{ a.species === 'dog' ? 'Hund' : 'Katze' }}</div>
              </div>
              <span class="text-sm text-slate-900">{{ a.name }} ({{ a.species }})</span>
            </div>
            <div class="flex gap-3 shrink-0">
              <button type="button" class="text-slate-600 hover:text-slate-900 text-sm font-medium" @click="openEditAnimal(a)">Bearbeiten</button>
              <button type="button" class="text-red-600 hover:text-red-700 text-sm font-medium" @click="deleteAnimal(a.id)">Löschen</button>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-500 py-4">Keine Tiere.</p>
      </div>

      <!-- Requests -->
      <div v-if="activeTab === 'requests'" class="space-y-4">
        <div class="flex justify-between items-center flex-wrap gap-2">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Transporte</h2>
          <div class="flex gap-2 items-center">
            <select v-model="sortBy" class="border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-slate-700 bg-white">
              <option value="title">Titel</option>
              <option value="date">Datum</option>
            </select>
            <button type="button" class="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors" @click="openCreate('request')">
              Anfrage erstellen
            </button>
          </div>
        </div>
        <div v-if="sortedRequests.length" class="space-y-2">
          <div
            v-for="r in sortedRequests"
            :key="r.id"
            class="p-4 rounded-lg bg-white border border-slate-200"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="min-w-0">
                <h3 class="font-medium text-slate-900 text-sm">{{ r.title }}</h3>
                <p v-if="r.animal" class="text-sm text-slate-500 mt-0.5">Tier: {{ r.animal.name }} ({{ r.animal.species }})</p>
                <p class="text-sm text-slate-500 mt-0.5">{{ r.originAirport }} → {{ r.destAirport }}</p>
                <p class="text-xs text-slate-400 mt-1">
                  {{ new Date(r.earliestDate).toLocaleDateString(locale) }} – {{ new Date(r.latestDate).toLocaleDateString(locale) }}
                </p>
                <span
                  class="inline-flex mt-2 px-2 py-0.5 rounded text-xs font-medium border"
                  :class="{
                    'bg-emerald-50 text-emerald-700 border-emerald-200': r.status === 'OPEN',
                    'bg-blue-50 text-blue-700 border-blue-200': r.status === 'MATCHED',
                    'bg-slate-100 text-slate-600 border-slate-200': r.status === 'COMPLETED',
                    'bg-red-50 text-red-700 border-red-200': r.status === 'CANCELLED',
                  }"
                >
                  {{ getRequestStatusLabel(r.status) }}
                </span>
              </div>
              <div class="flex gap-2 shrink-0 items-center flex-wrap">
                <button type="button" class="text-slate-600 hover:text-slate-900 text-sm font-medium inline-flex items-center gap-1" @click="copyRequestLink(r)" :title="copiedRequestId === r.id ? 'Link kopiert!' : 'Link zum Teilen kopieren'">
                  <span v-if="copiedRequestId === r.id" class="text-emerald-600">Link kopiert!</span>
                  <span v-else>Link kopieren</span>
                </button>
                <button type="button" class="text-slate-600 hover:text-slate-900 text-sm font-medium" @click="openEditRequest(r)">Bearbeiten</button>
                <button type="button" class="text-red-600 hover:text-red-700 text-sm font-medium" @click="deleteRequest(r.id)">Löschen</button>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500 py-4">Keine Transporte.</p>
      </div>

      <!-- Anfragen / Inbox -->
      <div v-if="activeTab === 'inbox'" class="space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Anfragen & Chat</h2>
        <p v-if="!inbox.length" class="text-sm text-slate-500 py-4">Keine Anfragen.</p>
        <ul v-else class="space-y-2">
          <li v-for="c in inbox" :key="c.id" class="p-4 rounded-lg bg-white border border-slate-200">
            <p class="font-medium text-slate-900 text-sm">{{ c.requestTitle ?? 'Anfrage' }} – {{ c.userDisplayName ?? 'User' }}</p>
            <p v-if="c.lastMessage" class="text-sm text-slate-500 mt-1 truncate">{{ c.lastMessage.body }}</p>
            <div class="flex flex-wrap gap-3 mt-3">
              <NuxtLink :to="`/inbox/${c.id}`" class="text-slate-600 hover:text-slate-900 text-sm font-medium">Chat öffnen</NuxtLink>
              <NuxtLink v-if="c.requestId" :to="`/requests/${c.requestId}`" class="text-slate-500 hover:text-slate-700 text-sm font-medium">Anfrage öffnen</NuxtLink>
            </div>
          </li>
        </ul>
      </div>

      <!-- Settings: direkt angezeigt, alle Felder inkl. Logo -->
      <div v-if="activeTab === 'settings'" class="space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Einstellungen</h2>
        <div class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Die hier eingestellten Informationen werden auch auf der Landingpage Ihrer Organisation ausgegeben.
        </div>
        <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6" @submit.prevent="saveSettings">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Logo (URL)</label>
            <div class="flex flex-wrap items-start gap-3">
              <div v-if="formSettings.logoUrl" class="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                <img :src="formSettings.logoUrl" alt="Logo" class="w-full h-full object-contain" />
              </div>
              <input v-model="formSettings.logoUrl" type="url" class="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="https://…" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Kurzbeschreibung</label>
            <input v-model="formSettings.description" type="text" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" placeholder="Eine Zeile für die Übersicht" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Landing Page (HTML möglich)</label>
            <textarea v-model="formSettings.landingContent" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" rows="5" placeholder="Zusätzlicher Text auf eurer öffentlichen Seite" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Website</label>
            <input v-model="formSettings.website" type="url" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" placeholder="https://…" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Kontakt-E-Mail</label>
            <input v-model="formSettings.contactEmail" type="email" required class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Telefon (Kontaktbox)</label>
            <input v-model="formSettings.contactPhone" type="text" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" placeholder="z.B. +49 172 5292097" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Instagram (Kontaktbox)</label>
            <input v-model="formSettings.contactInstagram" type="text" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" placeholder="z.B. canarigatos" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Facebook (Kontaktbox)</label>
            <input v-model="formSettings.contactFacebook" type="text" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" placeholder="z.B. Seitenname oder URL" />
          </div>
          <div class="flex gap-2 pt-2">
            <button type="submit" class="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-medium text-sm hover:bg-amber-600 transition-colors">Speichern</button>
          </div>
        </form>
      </div>

      </template>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60" @click.self="showModal = false">
        <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
          <h3 class="text-lg font-bold text-slate-900 mb-4">
            {{ modalMode === 'location' ? (editingId ? 'Standort bearbeiten' : 'Standort hinzufügen') : modalMode === 'animal' ? (editingId ? 'Tier bearbeiten' : 'Tier hinzufügen') : (editingId ? 'Anfrage bearbeiten' : 'Anfrage erstellen') }}
          </h3>

          <form v-if="modalMode === 'location'" class="space-y-4" @submit.prevent="saveLocation">
            <div>
              <label class="block text-sm font-medium mb-1">Titel</label>
              <input v-model="formLocation.title" type="text" required class="border rounded px-3 py-2 w-full" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Stadt</label>
                <input v-model="formLocation.city" type="text" required class="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Land (Code)</label>
                <input v-model="formLocation.countryCode" type="text" maxlength="2" class="border rounded px-3 py-2 w-full" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Adresse</label>
              <input v-model="formLocation.address" type="text" class="border rounded px-3 py-2 w-full" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Lat</label>
                <input v-model.number="formLocation.lat" type="number" step="any" class="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Lng</label>
                <input v-model.number="formLocation.lng" type="number" step="any" class="border rounded px-3 py-2 w-full" />
              </div>
            </div>
            <div class="flex gap-2 pt-2">
              <button type="submit" class="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-medium">Speichern</button>
              <button type="button" class="px-4 py-2 rounded-lg bg-slate-200" @click="showModal = false">Abbrechen</button>
            </div>
          </form>

          <form v-if="modalMode === 'animal'" class="space-y-4" @submit.prevent="saveAnimal">
            <div>
              <label class="block text-sm font-medium mb-1">Bild (optional)</label>
              <div class="flex items-start gap-4">
                <div class="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <img
                    v-if="animalImagePreviewUrl"
                    :src="animalImagePreviewUrl"
                    alt="Vorschau"
                    class="w-full h-full object-cover"
                  />
                  <img
                    v-else-if="formAnimal.imageUrl"
                    :src="formAnimal.imageUrl"
                    :alt="formAnimal.name"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-slate-400 text-xs">Kein Bild</span>
                </div>
                <div class="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    class="border rounded px-3 py-2 w-full text-sm"
                    @change="onAnimalImageChange"
                  />
                  <p class="text-xs text-slate-500 mt-1">JPG, PNG, WebP oder GIF, max. 5 MB</p>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Name</label>
              <input v-model="formAnimal.name" type="text" required class="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Art</label>
              <select v-model="formAnimal.species" class="border rounded px-3 py-2 w-full">
                <option value="cat">Katze</option>
                <option value="dog">Hund</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Notizen</label>
              <textarea v-model="formAnimal.notes" class="border rounded px-3 py-2 w-full" rows="2" />
            </div>
            <div class="flex gap-2 pt-2">
              <button type="submit" class="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-medium">Speichern</button>
              <button type="button" class="px-4 py-2 rounded-lg bg-slate-200" @click="showModal = false">Abbrechen</button>
            </div>
          </form>

          <form v-if="modalMode === 'request'" class="space-y-4" @submit.prevent="saveRequest">
            <div>
              <label class="block text-sm font-medium mb-1">Titel</label>
              <input v-model="formRequest.title" type="text" required class="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Details</label>
              <textarea v-model="formRequest.details" class="border rounded px-3 py-2 w-full" rows="2" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Tier (optional)</label>
              <select v-model="formRequest.animalId" class="border rounded px-3 py-2 w-full">
                <option value="">– Keins –</option>
                <option v-for="a in selectedOrg?.animals" :key="a.id" :value="a.id">{{ a.name }} ({{ a.species }})</option>
              </select>
            </div>
            <div v-if="editingId" class="grid grid-cols-1 gap-4">
              <label class="block text-sm font-medium mb-1">Status</label>
              <select v-model="formRequest.status" class="border rounded px-3 py-2 w-full">
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Frühestes Datum</label>
                <input v-model="formRequest.earliestDate" type="date" required class="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Spätestes Datum</label>
                <input v-model="formRequest.latestDate" type="date" required class="border rounded px-3 py-2 w-full" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Abflug</label>
              <select v-model="formRequest.originAirport" required class="border rounded px-3 py-2 w-full">
                <optgroup v-for="reg in airportRegions" :key="reg.id" :label="reg.label">
                  <option v-for="aid in reg.airportIds" :key="'o-' + aid" :value="airports.find(a => a.id === aid)?.code ?? aid">
                    {{ airports.find(a => a.id === aid)?.name ?? aid }} ({{ airports.find(a => a.id === aid)?.code ?? aid }})
                  </option>
                </optgroup>
                <optgroup label="Weitere Flughäfen">
                  <option v-for="a in airports" :key="'o-' + a.id" :value="a.code">{{ a.name }} ({{ a.code }})</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Ziel</label>
              <select v-model="formRequest.destAirport" required class="border rounded px-3 py-2 w-full">
                <optgroup v-for="reg in airportRegions" :key="reg.id" :label="reg.label">
                  <option v-for="aid in reg.airportIds" :key="'d-' + aid" :value="airports.find(a => a.id === aid)?.code ?? aid">
                    {{ airports.find(a => a.id === aid)?.name ?? aid }} ({{ airports.find(a => a.id === aid)?.code ?? aid }})
                  </option>
                </optgroup>
                <optgroup label="Weitere Flughäfen">
                  <option v-for="a in airports" :key="'d-' + a.id" :value="a.code">{{ a.name }} ({{ a.code }})</option>
                </optgroup>
              </select>
            </div>
            <div class="flex gap-2 pt-2">
              <button type="submit" class="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-medium">Speichern</button>
              <button type="button" class="px-4 py-2 rounded-lg bg-slate-200" @click="showModal = false">Abbrechen</button>
            </div>
          </form>

        </div>
      </div>
    </Teleport>
  </div>
</template>
