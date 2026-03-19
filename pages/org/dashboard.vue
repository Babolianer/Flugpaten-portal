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
  postalCode?: string | null
  lat: number | null
  lng: number | null
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
  waitingListEnabled?: boolean
  animalCanFlyInCargo?: boolean
  animalCanFlyInCabin?: boolean
  earliestDate: string
  latestDate: string
  originAirport: string
  destAirport: string
  originLat: number | null
  originLng: number | null
  destLat: number | null
  destLng: number | null
  animal: { id: string; name: string; species: string } | null
  groupId?: string | null
  group?: { id: string; title: string } | null
  applications?: Array<{ userId: string; user: { id: string; displayName: string } }>
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
  _count?: { reviews: number }
}

interface OrgReview {
  id: string
  rating: number
  comment: string | null
  orgResponse: string | null
  orgResponseAt: string | null
  createdAt: string
  reviewerName: string
  requestTitle: string
}

const orgs = ref<Org[]>([])
const loading = ref(true)
const message = ref('')
const activeTab = ref<'locations' | 'animals' | 'requests' | 'inbox' | 'reviews' | 'settings'>('locations')
const selectedOrgId = ref('')
const sortBy = ref<'title' | 'date'>('title')
const requestSaving = ref(false)
const applicationsHubRef = ref<{ reloadAll: (opts?: { silent?: boolean }) => Promise<void> } | null>(null)

const showModal = ref(false)
const modalMode = ref<'location' | 'animal' | 'request'>('location')
const editingId = ref<string | null>(null)

const orgReviews = ref<OrgReview[]>([])
const orgReviewsLoading = ref(false)
const editingReviewId = ref<string | null>(null)
const orgResponseDraft = ref('')
const reportingReviewId = ref<string | null>(null)
const reportReason = ref('')
const inboxPollingInterval = ref<NodeJS.Timeout | null>(null)
const isPageVisible = ref(true)
const copiedRequestId = ref<string | null>(null)
const reviewModalRequest = ref<{ requestId: string; patronId: string; patronName: string } | null>(null)
const reviewStatusCache = ref<Record<string, { canRatePatron: boolean }>>({})

const formLocation = reactive({
  title: '',
  countryCode: 'DE',
  city: '',
  address: '',
  postalCode: '',
  lat: null as number | null,
  lng: null as number | null,
})
const mapsLinkInput = ref('')

const formAnimal = reactive({
  name: '',
  species: 'cat',
  speciesOtherText: '',
  sex: '',
  sizeClass: '',
  notes: '',
  imageUrl: '' as string,
})
const animalImageFile = ref<File | null>(null)
const animalImagePreviewUrl = ref<string | null>(null)

const { locale, t } = useI18n()
const { getRequestStatusLabel, statusOptions } = useRequestStatus()

const formRequest = reactive({
  title: '',
  details: '',
  groupMode: 'none' as 'none' | 'existing' | 'new',
  groupId: '',
  groupTitle: '',
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
  waitingListEnabled: false,
  animalCanFlyInCargo: false,
  animalCanFlyInCabin: false,
})

function normalizeAnimalTransportSelection() {
  // Mutually exclusive transport location: cargo XOR cabin (or neither).
  if (formRequest.animalCanFlyInCargo) formRequest.animalCanFlyInCabin = false
  else if (formRequest.animalCanFlyInCabin) formRequest.animalCanFlyInCargo = false
}

watch(
  () => formRequest.animalCanFlyInCargo,
  (cargo) => {
    if (cargo) formRequest.animalCanFlyInCabin = false
  },
)

watch(
  () => formRequest.animalCanFlyInCabin,
  (cabin) => {
    if (cabin) formRequest.animalCanFlyInCargo = false
  },
)

const formSettings = reactive({
  description: '',
  landingContent: '',
  website: '',
  contactEmail: '',
  contactPhone: '',
  contactInstagram: '',
  contactFacebook: '',
  logoUrl: '' as string,
  automatedMessageTemplate1: '',
  automatedMessageTemplate2: '',
  automatedMessageTemplate3: '',
})

/** Vorlagen für die automatische Nachricht (nur zum Befüllen der Textarea) */
const AUTOMATED_MESSAGE_PRESETS: Record<string, string> = {
  short_ack: 'Vielen Dank für Ihre Bewerbung. Wir haben sie erhalten und werden uns zeitnah bei Ihnen melden.',
  individual: '',
}
const automatedMessagePresetKey = ref<string>('')

function onAutomatedMessagePresetChange(key: string) {
  const text = AUTOMATED_MESSAGE_PRESETS[key] ?? ''
  formSettings.automatedMessageTemplate1 = text
}

const airports = ref<{ id: string; name: string; code: string; lat: number; lng: number }[]>([])
const airportRegions = ref<{ id: string; label: string; airportIds: string[] }[]>([])

const selectedOrg = computed(() => orgs.value.find((o) => o.id === selectedOrgId.value) || null)

const requestGroupOptions = computed(() => {
  const reqs = selectedOrg.value?.requests ?? []
  const map = new Map<string, string>()
  for (const r of reqs) {
    if (r.groupId && r.group?.title) map.set(r.groupId, r.group.title)
  }
  return [...map.entries()]
    .map(([id, title]) => ({ id, title }))
    .sort((a, b) => a.title.localeCompare(b.title))
})

/** Bei PENDING-Organisationen keine Tabs – nur Hinweis „Wartet auf Freigabe“. Kein Zugriff auf Standorte, Tiere, Transporte, Einstellungen. */
const allowedTabs = computed(() => {
  const all: Array<'locations' | 'animals' | 'requests' | 'inbox' | 'reviews' | 'settings'> = ['locations', 'animals', 'requests', 'inbox', 'reviews', 'settings']
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

const kpiLocations = computed(() => selectedOrg.value?.locations?.length ?? 0)
const kpiAnimals = computed(() => selectedOrg.value?.animals?.length ?? 0)
const kpiActiveTransports = computed(() => {
  const reqs = selectedOrg.value?.requests ?? []
  return reqs.filter((r) => r.status === 'OPEN' || r.status === 'MATCHED').length
})
const kpiReviews = computed(() => selectedOrg.value?._count?.reviews ?? 0)

const speciesOptions = [
  { value: 'dog', labelKey: 'orgDashboard.speciesDog' },
  { value: 'cat', labelKey: 'orgDashboard.speciesCat' },
  { value: 'rabbit', labelKey: 'orgDashboard.speciesRabbit' },
  { value: 'guinea_pig', labelKey: 'orgDashboard.speciesGuineaPig' },
  { value: 'bird', labelKey: 'orgDashboard.speciesBird' },
  { value: 'reptile', labelKey: 'orgDashboard.speciesReptile' },
  { value: 'ferret', labelKey: 'orgDashboard.speciesFerret' },
  { value: 'other', labelKey: 'orgDashboard.speciesOther' },
] as const

function getSpeciesLabel(species: string) {
  if (species === 'other') return t('orgDashboard.speciesOther')
  const opt = speciesOptions.find((o) => o.value === species)
  return opt ? t(opt.labelKey) : species
}

const locationGeocodeError = ref(false)
/** 'parse_error' = nur Rot (Link ungültig), 'coords_only' = Grün + Rot (Koordinaten ok, Adresse fehlt) */
const locationMapsLinkStatus = ref<'parse_error' | 'coords_only' | null>(null)
const locationFromLinkLoading = ref(false)

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
        formSettings.automatedMessageTemplate1 = (o as { automatedMessageTemplate1?: string | null }).automatedMessageTemplate1 ?? ''
        formSettings.automatedMessageTemplate2 = (o as { automatedMessageTemplate2?: string | null }).automatedMessageTemplate2 ?? ''
        formSettings.automatedMessageTemplate3 = (o as { automatedMessageTemplate3?: string | null }).automatedMessageTemplate3 ?? ''
      }
    }
  } catch (e: unknown) {
    if ((e as { statusCode?: number })?.statusCode === 403) await navigateTo('/login')
    message.value = 'Fehler beim Laden'
  } finally {
    loading.value = false
    if (activeTab.value === 'inbox') {
      nextTick(() => void applicationsHubRef.value?.reloadAll({ silent: true }))
    }
  }
}

function openCreate(mode: 'location' | 'animal' | 'request') {
  modalMode.value = mode
  editingId.value = null
  locationGeocodeError.value = false
  locationMapsLinkStatus.value = null
  if (mode === 'location') {
    Object.assign(formLocation, { title: '', city: '', address: '', postalCode: '', lat: null, lng: null, countryCode: 'DE' })
    locationFromLinkLoading.value = false
    mapsLinkInput.value = ''
  }
  if (mode === 'animal') {
    Object.assign(formAnimal, { name: '', species: 'cat', speciesOtherText: '', sex: '', sizeClass: '', notes: '', imageUrl: '' })
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
      groupMode: 'none',
      groupId: '',
      groupTitle: '',
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
      waitingListEnabled: false,
      animalCanFlyInCargo: false,
      animalCanFlyInCabin: false,
    })
  }
  showModal.value = true
}

function openEditLocation(loc: Location) {
  modalMode.value = 'location'
  editingId.value = loc.id
  locationGeocodeError.value = false
  locationMapsLinkStatus.value = null
  mapsLinkInput.value = ''
  Object.assign(formLocation, {
    title: loc.title,
    city: loc.city,
    countryCode: loc.countryCode,
    address: loc.address ?? '',
    postalCode: (loc as { postalCode?: string }).postalCode ?? '',
    lat: loc.lat ?? null,
    lng: loc.lng ?? null,
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
  const isOther = !speciesOptions.some((o) => o.value === a.species)
  Object.assign(formAnimal, {
    name: a.name,
    species: isOther ? 'other' : a.species,
    speciesOtherText: isOther ? a.species : '',
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
    groupMode: r.groupId ? 'existing' : 'none',
    groupId: r.groupId ?? '',
    groupTitle: '',
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
    waitingListEnabled: !!r.waitingListEnabled,
    animalCanFlyInCargo: !!r.animalCanFlyInCargo,
    animalCanFlyInCabin: !!r.animalCanFlyInCabin,
  })
  normalizeAnimalTransportSelection()
  showModal.value = true
}

async function loadSettingsForTab() {
  if (!selectedOrgId.value) return
  try {
    const res = await $fetch<{
      description: string | null
      landingContent: string | null
      website: string | null
      contactEmail: string
      contactPhone: string | null
      contactInstagram: string | null
      contactFacebook: string | null
      logoUrl: string | null
      automatedMessageTemplate1: string | null
      automatedMessageTemplate2: string | null
      automatedMessageTemplate3: string | null
    }>('/api/org/dashboard/settings', { query: { organizationId: selectedOrgId.value } })
    formSettings.description = res.description ?? ''
    formSettings.landingContent = res.landingContent ?? ''
    formSettings.website = res.website ?? ''
    formSettings.contactEmail = res.contactEmail ?? ''
    formSettings.contactPhone = res.contactPhone ?? ''
    formSettings.contactInstagram = res.contactInstagram ?? ''
    formSettings.contactFacebook = res.contactFacebook ?? ''
    formSettings.logoUrl = res.logoUrl ?? ''
    formSettings.automatedMessageTemplate1 = res.automatedMessageTemplate1 ?? ''
    formSettings.automatedMessageTemplate2 = res.automatedMessageTemplate2 ?? ''
    formSettings.automatedMessageTemplate3 = res.automatedMessageTemplate3 ?? ''
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
      formSettings.automatedMessageTemplate1 = (o as { automatedMessageTemplate1?: string | null }).automatedMessageTemplate1 ?? ''
      formSettings.automatedMessageTemplate2 = (o as { automatedMessageTemplate2?: string | null }).automatedMessageTemplate2 ?? ''
      formSettings.automatedMessageTemplate3 = (o as { automatedMessageTemplate3?: string | null }).automatedMessageTemplate3 ?? ''
    }
  }
}

function hasValidLocationCoords(): boolean {
  const { lat, lng } = formLocation
  if (lat == null || lng == null) return false
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  return lat !== 0 || lng !== 0
}

/**
 * Platzname aus Google-Maps-Pfad decodieren (z. B. /place/Baumwipfelpfad+Schwarzwald/ → "Baumwipfelpfad Schwarzwald").
 */
function parsePlaceNameFromPath(path: string): string | undefined {
  const match = path.match(/\/place\/([^/]+)/)
  if (!match || !match[1]) return undefined
  try {
    const raw = match[1]
    const decoded = decodeURIComponent(raw.replace(/\+/g, ' '))
    return decoded.trim() || undefined
  } catch {
    return undefined
  }
}

/**
 * Aus dem Link Koordinaten und ggf. Titel extrahieren (Place-Name aus Pfad oder q-Parameter).
 */
function parseMapsLink(raw: string): { lat: number; lng: number; titleFromQuery?: string; titleFromPath?: string } | null {
  const trimmed = (raw || '').trim()
  if (!trimmed) return null
  let lat: number | null = null
  let lng: number | null = null
  let titleFromQuery: string | undefined
  let titleFromPath: string | undefined
  try {
    const url = new URL(trimmed)
    const path = url.pathname + url.hash
    const q = url.searchParams.get('q')

    titleFromPath = parsePlaceNameFromPath(path)

    if (q) {
      const parts = q.split(',')
      if (parts.length >= 2) {
        const a = parseFloat(parts[0].trim())
        const b = parseFloat(parts[1].trim())
        if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180) {
          lat = a
          lng = b
        }
      }
      if (lat == null && q.trim().length > 0) {
        titleFromQuery = q.trim()
      }
    }
    if (lat == null && /@(-?\d+\.?\d*),(-?\d+\.?\d*)/.test(path)) {
      const match = path.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
      if (match) {
        lat = parseFloat(match[1])
        lng = parseFloat(match[2])
      }
      if (q && q.trim().length > 0 && !/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(q.trim())) {
        titleFromQuery = q.trim()
      }
    }
    if (lat == null && url.searchParams.has('mlat') && url.searchParams.has('mlon')) {
      lat = parseFloat(url.searchParams.get('mlat')!)
      lng = parseFloat(url.searchParams.get('mlon')!)
    }
    if (lat == null && /#map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/.test(path)) {
      const match = path.match(/#map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/)
      if (match) {
        lat = parseFloat(match[1])
        lng = parseFloat(match[2])
      }
    }
    if (lat == null) {
      const ll = url.searchParams.get('ll')
      if (ll) {
        const [a, b] = ll.split(',').map((x) => parseFloat(x.trim()))
        if (Number.isFinite(a) && Number.isFinite(b)) {
          lat = a
          lng = b
        }
      }
    }
    // Google Maps Daten-Format: …!3dLAT!4dLNG (z. B. in /data=!…!8m2!3d34.97!4d33.69…)
    if (lat == null && /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/.test(path)) {
      const match3d4d = path.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/)
      if (match3d4d) {
        const a = parseFloat(match3d4d[1])
        const b = parseFloat(match3d4d[2])
        if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180) {
          lat = a
          lng = b
        }
      }
    }
  } catch {
    /* URL ungültig */
  }
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng, titleFromQuery, titleFromPath }
  }
  return null
}

/** Link parsen, Reverse-Geocode aufrufen und alle Felder (Titel, Straße, PLZ, Stadt, Land, Koordinaten) befüllen. */
async function applyAddressFromMapsLink() {
  const raw = (mapsLinkInput.value || '').trim()
  if (!raw) return
  locationGeocodeError.value = false
  locationMapsLinkStatus.value = null
  const parsed = parseMapsLink(raw)
  if (!parsed) {
    locationGeocodeError.value = true
    locationMapsLinkStatus.value = 'parse_error'
    message.value = t('orgDashboard.mapsLinkParseError')
    return
  }
  locationFromLinkLoading.value = true
  try {
    const config = useRuntimeConfig()
    const baseURL = config.public?.appUrl || (import.meta.client ? window.location.origin : '')
    const url = `${baseURL}/api/geocode/reverse?lat=${parsed.lat}&lng=${parsed.lng}`
    const res = await fetch(url)
    if (!res.ok) {
      applyCoordsFallback(parsed)
      locationGeocodeError.value = true
      locationMapsLinkStatus.value = 'coords_only'
      message.value = ''
      return
    }
    const data = (await res.json()) as {
      lat: number
      lng: number
      address: string
      postalCode: string
      city: string
      countryCode: string
      state?: string
      displayName: string
    }
    formLocation.lat = data.lat
    formLocation.lng = data.lng
    formLocation.address = data.address ?? ''
    formLocation.postalCode = data.postalCode ?? ''
    formLocation.city = data.city ?? ''
    formLocation.countryCode = (data.countryCode ?? 'DE').toUpperCase().slice(0, 2)
    const titleFromDisplay = data.displayName ? data.displayName.split(',')[0].trim() : ''
    formLocation.title = titleFromDisplay || parsed.titleFromPath || parsed.titleFromQuery || formLocation.title
    message.value = ''
    locationMapsLinkStatus.value = null
  } catch {
    applyCoordsFallback(parsed)
    locationGeocodeError.value = true
    locationMapsLinkStatus.value = 'coords_only'
    message.value = ''
  } finally {
    locationFromLinkLoading.value = false
  }
}

function applyCoordsFallback(parsed: { lat: number; lng: number; titleFromQuery?: string; titleFromPath?: string }) {
  formLocation.lat = parsed.lat
  formLocation.lng = parsed.lng
  const title = parsed.titleFromPath || parsed.titleFromQuery
  if (title) formLocation.title = title
}

async function saveLocation() {
  if (!selectedOrgId.value || !formLocation.title || !formLocation.city) return
  locationGeocodeError.value = false
  const body = {
    title: formLocation.title,
    countryCode: formLocation.countryCode.trim().toUpperCase().slice(0, 2),
    city: formLocation.city.trim(),
    address: formLocation.address?.trim() || undefined,
    postalCode: formLocation.postalCode?.trim() || undefined,
    ...(hasValidLocationCoords() ? { lat: formLocation.lat, lng: formLocation.lng } : {}),
  }
  try {
    if (editingId.value) {
      await $fetch(`/api/org/dashboard/locations/${editingId.value}`, {
        method: 'PATCH',
        body,
      })
    } else {
      await $fetch('/api/org/dashboard/locations', {
        method: 'POST',
        body: { organizationId: selectedOrgId.value, ...body },
      })
    }
    message.value = ''
    locationGeocodeError.value = false
    locationMapsLinkStatus.value = null
    showModal.value = false
    await load()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    const msg = err?.data?.message ?? err?.message ?? ''
    if (msg.toLowerCase().includes('geocode') || msg.includes('Could not geocode') || msg.includes('Address not found')) {
      locationGeocodeError.value = true
      message.value = t('orgDashboard.geocodeError')
    } else {
      message.value = msg || t('orgDashboard.errorSave')
    }
  }
}

async function saveAnimal() {
  const effectiveSpecies = formAnimal.species === 'other' ? (formAnimal.speciesOtherText?.trim() || 'other') : formAnimal.species
  if (!selectedOrgId.value || !formAnimal.name || !effectiveSpecies) return
  try {
    if (editingId.value) {
      if (animalImageFile.value) {
        const body = new FormData()
        body.append('name', formAnimal.name)
        body.append('species', effectiveSpecies)
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
            species: effectiveSpecies,
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
        body.append('species', effectiveSpecies)
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
          body: { organizationId: selectedOrgId.value, ...formAnimal, species: effectiveSpecies },
        })
      }
    }
    message.value = ''
    showModal.value = false
    await load()
  } catch {
    message.value = t('orgDashboard.errorSave')
  }
}

async function saveRequest() {
  if (requestSaving.value) return
  if (!selectedOrgId.value || !formRequest.title || !formRequest.earliestDate || !formRequest.latestDate || !formRequest.originAirport || !formRequest.destAirport) return
  const origin = airports.value.find((a) => a.code === formRequest.originAirport || a.id === formRequest.originAirport)
  const dest = airports.value.find((a) => a.code === formRequest.destAirport || a.id === formRequest.destAirport)
  requestSaving.value = true
  try {
    normalizeAnimalTransportSelection()
    const body = {
      organizationId: selectedOrgId.value,
      title: formRequest.title,
      details: formRequest.details || undefined,
      groupId: formRequest.groupMode === 'existing' ? (formRequest.groupId || null) : null,
      groupTitle: formRequest.groupMode === 'new' ? (formRequest.groupTitle || null) : null,
      waitingListEnabled: !!formRequest.waitingListEnabled,
      animalCanFlyInCargo: !!formRequest.animalCanFlyInCargo,
      animalCanFlyInCabin: !!formRequest.animalCanFlyInCabin,
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
    message.value = t('orgDashboard.errorSave')
  } finally {
    requestSaving.value = false
  }
}

function openEditRequestFromHub(requestId: string) {
  const r = selectedOrg.value?.requests.find((x) => x.id === requestId)
  if (r) openEditRequest(r)
}

function onApplicationsHubError(msg: string) {
  message.value = msg
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
    message.value = detail ? `${t('orgDashboard.errorSave')}: ${detail}` : t('orgDashboard.errorSave')
  }
}

async function deleteLocation(id: string) {
  if (!confirm(t('orgDashboard.confirmDeleteLocation'))) return
  try {
    await $fetch(`/api/org/dashboard/locations/${id}`, { method: 'DELETE' })
    await load()
  } catch {
    message.value = t('orgDashboard.errorDelete')
  }
}

async function deleteAnimal(id: string) {
  if (!confirm(t('orgDashboard.confirmDeleteAnimal'))) return
  try {
    await $fetch(`/api/org/dashboard/animals/${id}`, { method: 'DELETE' })
    await load()
  } catch {
    message.value = t('orgDashboard.errorDelete')
  }
}

async function deleteRequest(id: string) {
  if (!confirm(t('orgDashboard.confirmDeleteRequest'))) return
  try {
    await $fetch(`/api/org/dashboard/requests/${id}`, { method: 'DELETE' })
    await load()
  } catch {
    message.value = t('orgDashboard.errorDelete')
  }
}

async function openRatePatron(r: Request) {
  const app = r.applications?.[0]
  if (!app || r.status !== 'COMPLETED') return
  try {
    const res = await $fetch<{ canRatePatron: boolean; patronId: string | null; patronName: string }>('/api/reviews/check', { query: { requestId: r.id } })
    if (res.canRatePatron && res.patronId) {
      reviewModalRequest.value = { requestId: r.id, patronId: res.patronId, patronName: res.patronName || app.user.displayName }
    } else {
      message.value = t('review.alreadyRated')
    }
  } catch {
    message.value = t('review.checkError')
  }
}

function closeReviewModal() {
  reviewModalRequest.value = null
}

async function onReviewSubmitted() {
  await load()
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
    if (isPageVisible.value && activeTab.value === 'inbox') {
      await applicationsHubRef.value?.reloadAll({ silent: true })
    }
  }, 30000)
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
    void applicationsHubRef.value?.reloadAll({ silent: true })
  }
}

async function loadOrgReviews() {
  if (!selectedOrgId.value) return
  orgReviewsLoading.value = true
  try {
    const res = await $fetch<{ reviews: OrgReview[] }>('/api/org/dashboard/reviews', {
      query: { organizationId: selectedOrgId.value },
    })
    orgReviews.value = res.reviews
  } catch {
    orgReviews.value = []
  } finally {
    orgReviewsLoading.value = false
  }
}

function openEditReview(r: OrgReview) {
  editingReviewId.value = r.id
  orgResponseDraft.value = r.orgResponse ?? ''
}

function cancelEditReview() {
  editingReviewId.value = null
  orgResponseDraft.value = ''
}

async function saveOrgResponse() {
  if (!editingReviewId.value) return
  try {
    await $fetch(`/api/org/dashboard/reviews/${editingReviewId.value}`, {
      method: 'PATCH',
      body: { orgResponse: orgResponseDraft.value.trim() },
    })
    const idx = orgReviews.value.findIndex((r) => r.id === editingReviewId.value)
    if (idx !== -1) {
      orgReviews.value[idx].orgResponse = orgResponseDraft.value.trim()
      orgReviews.value[idx].orgResponseAt = new Date().toISOString()
    }
    editingReviewId.value = null
    orgResponseDraft.value = ''
    await load()
  } catch {
    message.value = t('orgDashboard.reviews.responseError')
  }
}

function openReportReview(r: OrgReview) {
  reportingReviewId.value = r.id
  reportReason.value = ''
}

function cancelReportReview() {
  reportingReviewId.value = null
  reportReason.value = ''
}

async function submitReportReview() {
  if (!reportingReviewId.value || !selectedOrgId.value) return
  try {
    await $fetch(`/api/reviews/${reportingReviewId.value}/report`, {
      method: 'POST',
      body: { organizationId: selectedOrgId.value, reason: reportReason.value.trim() || null },
    })
    message.value = t('orgDashboard.reviews.reportSuccess')
    reportingReviewId.value = null
    reportReason.value = ''
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.value = err?.data?.message ?? t('orgDashboard.reviews.reportError')
  }
}

watch(activeTab, (tab) => {
  if (tab === 'inbox') {
    void nextTick(() => applicationsHubRef.value?.reloadAll())
    startInboxPolling()
  } else if (tab === 'reviews') {
    loadOrgReviews()
    stopInboxPolling()
  } else {
    stopInboxPolling()
  }
})

function syncTabFromRoute() {
  const tab = route.query.tab as string
  if (tab && allowedTabs.value.includes(tab as typeof activeTab.value)) {
    activeTab.value = tab as typeof activeTab.value
  }
}

watch(() => route.query.tab, syncTabFromRoute)

onMounted(async () => {
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
  await load()
  syncTabFromRoute()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopInboxPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div class="container mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
    <!-- Admin: Infobar „Als Organisation anzeigen“ mit Zurück zum Admin -->
    <div
      v-if="isAdminViewAsOrg && selectedOrg"
      class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <span>
        {{ t('orgDashboard.viewAs', { name: selectedOrg.name }) }}
      </span>
      <NuxtLink
        to="/admin"
        class="inline-flex items-center rounded-lg border border-amber-600 bg-amber-500 px-4 py-2 font-medium text-slate-900 hover:bg-amber-600 transition-colors"
      >
        {{ t('orgDashboard.backToAdmin') }}
      </NuxtLink>
    </div>

    <div class="border-b border-slate-200 pb-6 mb-6">
      <h1 class="text-xl font-semibold text-slate-900 tracking-tight">{{ t('nav.dashboard') }}</h1>
      <p class="text-slate-500 text-sm mt-1">{{ t('orgDashboard.manageTitle') }}</p>
    </div>

    <!-- Hero + KPI (nur bei genehmigten Org) -->
    <div
      v-if="!loading && orgs.length > 0 && selectedOrg?.status !== 'PENDING' && allowedTabs.length > 0"
      class="mb-8 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-6 sm:p-8 shadow-sm"
    >
      <div class="flex items-start gap-4">
        <span class="text-4xl sm:text-5xl" aria-hidden="true">🐾</span>
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{{ t('orgDashboard.heroTitle') }}</h2>
          <p class="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">{{ t('orgDashboard.heroSubtext') }}</p>
          <div class="mt-6 flex flex-wrap gap-4">
            <div class="flex items-center gap-3 rounded-xl bg-white/80 border border-slate-200 px-4 py-3 shadow-sm">
              <span class="text-2xl">📍</span>
              <div>
                <p class="text-2xl font-bold text-slate-900">{{ kpiLocations }}</p>
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">{{ t('orgDashboard.kpiLocations') }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-xl bg-white/80 border border-slate-200 px-4 py-3 shadow-sm">
              <span class="text-2xl">🐕</span>
              <div>
                <p class="text-2xl font-bold text-slate-900">{{ kpiAnimals }}</p>
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">{{ t('orgDashboard.kpiAnimals') }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-xl bg-white/80 border border-slate-200 px-4 py-3 shadow-sm">
              <span class="text-2xl">✈️</span>
              <div>
                <p class="text-2xl font-bold text-slate-900">{{ kpiActiveTransports }}</p>
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">{{ t('orgDashboard.kpiActiveTransports') }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-xl bg-white/80 border border-slate-200 px-4 py-3 shadow-sm">
              <span class="text-2xl">⭐</span>
              <div>
                <p class="text-2xl font-bold text-slate-900">{{ kpiReviews }}</p>
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">{{ t('orgDashboard.kpiReviews') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
        {{ t('orgDashboard.registerSuccess') }}
      </p>
      <p class="mt-2 text-sm text-emerald-700">
        {{ t('orgDashboard.registerWaiting', { name: selectedOrg?.name || '' }) }}
      </p>
    </div>
    <div v-if="loading" class="text-slate-500 text-sm">{{ t('orgDashboard.loading') }}</div>
    <div v-else-if="orgs.length === 0" class="p-6 rounded-lg bg-slate-50 border border-slate-200">
      <p class="text-slate-600 text-sm">
        {{ t('orgDashboard.noOrgs') }}
      </p>
      <NuxtLink to="/org/register" class="inline-flex items-center justify-center mt-4 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 min-h-[44px] transition-colors">
        {{ t('orgDashboard.registerOrg') }}
      </NuxtLink>
    </div>
    <div v-else>
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <label class="text-sm font-medium text-slate-700">{{ t('orgDashboard.organization') }}</label>
        <select v-model="selectedOrgId" class="border border-slate-300 rounded-lg px-3 py-2 w-full sm:w-72 min-h-[44px] text-sm text-slate-900 bg-white">
          <option v-for="o in orgs" :key="o.id" :value="o.id">{{ o.name }}{{ o.status === 'PENDING' ? ' (' + t('orgDashboard.inProgress') + ')' : '' }}</option>
        </select>
        <span
          v-if="selectedOrg?.status === 'PENDING'"
          class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200"
        >
          {{ t('orgDashboard.waitingApproval') }}
        </span>
      </div>
      <!-- Mobile: Tabs als Select -->
      <div v-if="allowedTabs.length > 0" class="sm:hidden mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-1">Bereich</label>
        <select v-model="activeTab" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm min-h-[44px]">
          <option v-for="tab in allowedTabs" :key="tab" :value="tab">
            {{ tab === 'locations' ? t('orgDashboard.tabLocations') : tab === 'animals' ? t('orgDashboard.tabAnimals') : tab === 'requests' ? t('orgDashboard.tabRequests') : tab === 'inbox' ? t('orgDashboard.inboxChat') : tab === 'reviews' ? t('orgDashboard.tabReviews') : t('orgDashboard.tabSettings') }}
          </option>
        </select>
      </div>

      <!-- Desktop: Tabs als Buttons -->
      <div v-if="allowedTabs.length > 0" class="hidden sm:flex flex-wrap gap-1 mb-6 -mx-1 overflow-x-auto pb-1 sm:overflow-visible sm:mx-0 sm:pb-0 border-b border-slate-200">
        <button
          v-for="tab in allowedTabs"
          :key="tab"
          type="button"
          :class="['px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[44px]', activeTab === tab ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
          @click="activeTab = tab"
        >
          {{ tab === 'locations' ? t('orgDashboard.tabLocations') : tab === 'animals' ? t('orgDashboard.tabAnimals') : tab === 'requests' ? t('orgDashboard.tabRequests') : tab === 'inbox' ? t('orgDashboard.inboxChat') : tab === 'reviews' ? t('orgDashboard.tabReviews') : t('orgDashboard.tabSettings') }}
        </button>
      </div>

      <!-- PENDING: Nur Hinweis, keine Bereiche (keine Standorte/Tiere/Transporte/Einstellungen) -->
      <div v-if="selectedOrg?.status === 'PENDING'" class="py-8 px-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
        <p class="text-slate-600 text-sm">
          {{ t('orgDashboard.waitingHint') }}
        </p>
      </div>

      <!-- Inhalte nur bei genehmigter Organisation -->
      <template v-else>
      <!-- Locations -->
      <div v-if="activeTab === 'locations'" class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 class="text-base font-semibold text-slate-900">{{ t('orgDashboard.tabLocations') }}</h2>
            <button type="button" class="px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-medium text-sm hover:bg-amber-600 transition-colors min-h-[44px]" @click="openCreate('location')">
              {{ t('orgDashboard.addLocation') }}
            </button>
          </div>
          <ul v-if="sortedLocations.length" class="space-y-2">
            <li v-for="loc in sortedLocations" :key="loc.id" class="p-4 rounded-lg bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <span class="text-sm text-slate-900 break-words">{{ loc.title }} – {{ loc.city }}{{ loc.address ? ', ' + loc.address : '' }}</span>
              <div class="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                <button type="button" class="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px]" @click="openEditLocation(loc)">{{ t('orgDashboard.edit') }}</button>
                <button type="button" class="w-full sm:w-auto px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 transition-colors min-h-[44px]" @click="deleteLocation(loc.id)">{{ t('orgDashboard.delete') }}</button>
              </div>
            </li>
          </ul>
          <div v-else class="flex flex-col items-center justify-center py-12 px-4 text-center">
            <span class="text-5xl mb-3" aria-hidden="true">📍</span>
            <h3 class="text-base font-semibold text-slate-900">{{ t('orgDashboard.emptyLocationsTitle') }}</h3>
            <p class="mt-1 text-sm text-slate-500 max-w-sm">{{ t('orgDashboard.emptyLocationsText') }}</p>
            <button type="button" class="mt-4 px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-medium text-sm hover:bg-amber-600 transition-colors" @click="openCreate('location')">
              {{ t('orgDashboard.addFirstLocation') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Animals -->
      <div v-if="activeTab === 'animals'" class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 class="text-base font-semibold text-slate-900">{{ t('orgDashboard.tabAnimals') }}</h2>
            <button type="button" class="px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-medium text-sm hover:bg-amber-600 transition-colors min-h-[44px]" @click="openCreate('animal')">
              {{ t('orgDashboard.addAnimal') }}
            </button>
          </div>
          <ul v-if="sortedAnimals.length" class="space-y-2">
            <li v-for="a in sortedAnimals" :key="a.id" class="p-4 rounded-lg bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img v-if="a.imageUrl" :src="a.imageUrl" :alt="a.name" class="w-full h-full object-cover" @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')" />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-400 text-lg">🐾</div>
                </div>
                <span class="text-sm text-slate-900 break-words">{{ a.name }} ({{ getSpeciesLabel(a.species) }})</span>
              </div>
              <div class="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                <button type="button" class="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px]" @click="openEditAnimal(a)">{{ t('orgDashboard.edit') }}</button>
                <button type="button" class="w-full sm:w-auto px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 transition-colors min-h-[44px]" @click="deleteAnimal(a.id)">{{ t('orgDashboard.delete') }}</button>
              </div>
            </li>
          </ul>
          <div v-else class="flex flex-col items-center justify-center py-12 px-4 text-center">
            <span class="text-5xl mb-3" aria-hidden="true">🐕</span>
            <h3 class="text-base font-semibold text-slate-900">{{ t('orgDashboard.emptyAnimalsTitle') }}</h3>
            <p class="mt-1 text-sm text-slate-500 max-w-sm">{{ t('orgDashboard.emptyAnimalsText') }}</p>
            <button type="button" class="mt-4 px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-medium text-sm hover:bg-amber-600 transition-colors" @click="openCreate('animal')">
              {{ t('orgDashboard.addFirstAnimal') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Requests -->
      <div v-if="activeTab === 'requests'" class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div>
              <h2 class="text-base font-semibold text-slate-900">{{ t('orgDashboard.tabRequests') }}</h2>
              <p class="text-xs text-slate-500 mt-1">{{ t('orgDashboard.requestsApplicationsHint') }}</p>
            </div>
            <div class="flex gap-2 items-center flex-wrap">
              <select v-model="sortBy" class="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white min-h-[44px]">
                <option value="title">{{ t('orgDashboard.sortTitle') }}</option>
                <option value="date">{{ t('orgDashboard.sortDate') }}</option>
              </select>
              <button type="button" class="px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-medium text-sm hover:bg-amber-600 transition-colors min-h-[44px]" @click="openCreate('request')">
                {{ t('orgDashboard.createRequest') }}
              </button>
            </div>
          </div>
          <div v-if="sortedRequests.length" class="space-y-3">
          <div
            v-for="r in sortedRequests"
            :key="r.id"
            class="p-4 rounded-lg bg-slate-50/80 border border-slate-100"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="min-w-0">
                <h3 class="font-medium text-slate-900 text-sm">{{ r.title }}</h3>
                <p v-if="r.animal" class="text-sm text-slate-500 mt-0.5">{{ t('orgDashboard.animalLabel') }}: {{ r.animal.name }} ({{ getSpeciesLabel(r.animal.species) }})</p>
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
                <button type="button" class="text-slate-600 hover:text-slate-900 text-sm font-medium inline-flex items-center gap-1" @click="copyRequestLink(r)" :title="copiedRequestId === r.id ? t('orgDashboard.linkCopied') : t('orgDashboard.copyLinkTitle')">
                  <span v-if="copiedRequestId === r.id" class="text-emerald-600">{{ t('orgDashboard.linkCopied') }}</span>
                  <span v-else>{{ t('orgDashboard.copyLink') }}</span>
                </button>
                <button v-if="r.status === 'COMPLETED' && r.applications?.[0]" type="button" class="text-amber-600 hover:text-amber-700 text-sm font-medium" @click="openRatePatron(r)">{{ t('review.ratePatron') }}</button>
                <button type="button" class="text-slate-600 hover:text-slate-900 text-sm font-medium" @click="openEditRequest(r)">{{ t('orgDashboard.edit') }}</button>
                <button type="button" class="text-red-600 hover:text-red-700 text-sm font-medium" @click="deleteRequest(r.id)">{{ t('orgDashboard.delete') }}</button>
              </div>
            </div>
          </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-12 px-4 text-center">
            <span class="text-5xl mb-3" aria-hidden="true">✈️</span>
            <h3 class="text-base font-semibold text-slate-900">{{ t('orgDashboard.emptyRequestsTitle') }}</h3>
            <p class="mt-1 text-sm text-slate-500 max-w-sm">{{ t('orgDashboard.emptyRequestsText') }}</p>
            <button type="button" class="mt-4 px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-medium text-sm hover:bg-amber-600 transition-colors" @click="openCreate('request')">
              {{ t('orgDashboard.createFirstRequest') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Bewertungen -->
      <div v-if="activeTab === 'reviews'" class="space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">{{ t('orgDashboard.tabReviews') }}</h2>
        <p v-if="orgReviewsLoading" class="text-sm text-slate-500 py-4">{{ t('orgDashboard.reviews.loading') }}</p>
        <p v-else-if="!orgReviews.length" class="text-sm text-slate-500 py-4">{{ t('orgDashboard.reviews.empty') }}</p>
        <div v-else class="space-y-4">
          <div
            v-for="r in orgReviews"
            :key="r.id"
            class="p-4 rounded-xl bg-white border border-slate-200"
          >
            <div class="flex justify-between items-start gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-amber-500" v-for="i in 5" :key="i">{{ i <= r.rating ? '★' : '☆' }}</span>
                  <span class="text-sm text-slate-600">{{ r.reviewerName }}</span>
                  <span class="text-xs text-slate-400">· {{ r.requestTitle }}</span>
                </div>
                <p v-if="r.comment" class="mt-2 text-sm text-slate-700">{{ r.comment }}</p>
                <p class="text-xs text-slate-400 mt-1">{{ new Date(r.createdAt).toLocaleDateString(locale) }}</p>
              </div>
              <div class="flex gap-2 shrink-0">
                <button v-if="editingReviewId !== r.id" type="button" class="text-amber-600 hover:text-amber-700 text-sm font-medium" @click="openEditReview(r)">
                  {{ r.orgResponse ? t('orgDashboard.reviews.editResponse') : t('orgDashboard.reviews.respond') }}
                </button>
                <button v-if="editingReviewId !== r.id" type="button" class="text-red-600 hover:text-red-700 text-sm font-medium" @click="openReportReview(r)">
                  {{ t('orgDashboard.reviews.report') }}
                </button>
              </div>
            </div>
            <div v-if="r.orgResponse" class="mt-3 pl-4 border-l-2 border-amber-200">
              <p class="text-sm text-slate-600">{{ r.orgResponse }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ t('orgDashboard.reviews.orgResponse') }} · {{ r.orgResponseAt ? new Date(r.orgResponseAt).toLocaleDateString(locale) : '' }}</p>
            </div>
            <div v-if="editingReviewId === r.id" class="mt-4">
              <textarea v-model="orgResponseDraft" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" :placeholder="t('orgDashboard.reviews.responsePlaceholder')" />
              <div class="flex gap-2 mt-2">
                <button type="button" class="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-900 font-medium text-sm hover:bg-amber-600" @click="saveOrgResponse">
                  {{ t('orgDashboard.save') }}
                </button>
                <button type="button" class="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50" @click="cancelEditReview">
                  {{ t('orgDashboard.cancel') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bewerbungen & Chat -->
      <div v-if="activeTab === 'inbox' && selectedOrgId" class="space-y-4">
        <OrgApplicationsChatTab
          ref="applicationsHubRef"
          :organization-id="selectedOrgId"
          :query-org-id="isAdminViewAsOrg"
          @refresh="load"
          @edit-request="openEditRequestFromHub"
          @error="onApplicationsHubError"
        />
      </div>

      <!-- Settings: direkt angezeigt, alle Felder inkl. Logo -->
      <div v-if="activeTab === 'settings'" class="space-y-4">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">{{ t('orgDashboard.tabSettings') }}</h2>
        <div class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {{ t('orgDashboard.settingsHint') }}
        </div>
        <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6" @submit.prevent="saveSettings">
          <!-- Automatische Nachricht (oben, vereinfacht) -->
          <div class="pb-6 border-b border-slate-200">
            <h3 class="text-sm font-semibold text-slate-700 mb-3">{{ t('orgDashboard.automatedMessageTitle') }}</h3>
            <div class="space-y-3">
              <select
                :value="automatedMessagePresetKey"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
                @input="(e) => { automatedMessagePresetKey = (e.target as HTMLSelectElement).value; onAutomatedMessagePresetChange((e.target as HTMLSelectElement).value) }"
              >
                <option value="" disabled>{{ t('orgDashboard.automatedMessagePresetChoose') }}</option>
                <option value="short_ack">{{ t('orgDashboard.automatedMessagePresetShortAck') }}</option>
                <option value="individual">{{ t('orgDashboard.automatedMessagePresetIndividual') }}</option>
              </select>
              <textarea
                v-model="formSettings.automatedMessageTemplate1"
                class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm min-h-[140px]"
                :placeholder="t('orgDashboard.automatedMessagePlaceholder')"
                rows="6"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.logo') }}</label>
            <div class="flex flex-wrap items-start gap-3">
              <div v-if="formSettings.logoUrl" class="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                <img :src="formSettings.logoUrl" alt="Logo" class="w-full h-full object-contain" />
              </div>
              <input v-model="formSettings.logoUrl" type="url" class="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="https://…" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.description') }}</label>
            <input v-model="formSettings.description" type="text" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" placeholder="Eine Zeile für die Übersicht" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.landingContent') }}</label>
            <textarea v-model="formSettings.landingContent" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" rows="5" placeholder="Zusätzlicher Text auf eurer öffentlichen Seite" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.website') }}</label>
            <input v-model="formSettings.website" type="url" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" placeholder="https://…" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.contactEmail') }}</label>
            <input v-model="formSettings.contactEmail" type="email" required class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.contactPhone') }}</label>
            <input v-model="formSettings.contactPhone" type="text" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" placeholder="z.B. +49 172 5292097" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.contactInstagram') }}</label>
            <input v-model="formSettings.contactInstagram" type="text" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" placeholder="z.B. canarigatos" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.contactFacebook') }}</label>
            <input v-model="formSettings.contactFacebook" type="text" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" placeholder="z.B. Seitenname oder URL" />
          </div>

          <div class="flex gap-2 pt-2">
            <button type="submit" class="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-medium text-sm hover:bg-amber-600 transition-colors">{{ t('orgDashboard.save') }}</button>
          </div>
        </form>
      </div>

      </template>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
        <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
          <button
            type="button"
            class="absolute top-3 right-3 inline-flex items-center justify-center h-10 w-10 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Schließen"
            @click="showModal = false"
          >
            <span class="text-2xl leading-none">×</span>
          </button>
          <h3 class="text-lg font-bold text-slate-900 mb-4">
            {{ modalMode === 'location' ? (editingId ? t('orgDashboard.editLocation') : t('orgDashboard.addLocationModal')) : modalMode === 'animal' ? (editingId ? t('orgDashboard.editAnimal') : t('orgDashboard.addAnimalModal')) : (editingId ? t('orgDashboard.editRequest') : t('orgDashboard.createRequestModal')) }}
          </h3>

          <form v-if="modalMode === 'location'" class="space-y-4" @submit.prevent="saveLocation">
            <!-- Google-Maps-Link: eigenständiger Bereich ganz oben -->
            <div class="rounded-xl border-2 border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <p class="text-sm font-medium text-slate-800">{{ t('orgDashboard.mapsLinkLabel') }}</p>
              <p class="text-xs text-slate-500">{{ t('orgDashboard.mapsLinkHint') }}</p>
              <div v-if="locationMapsLinkStatus === 'coords_only'" class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                {{ t('orgDashboard.mapsLinkCoordsSuccess') }}
              </div>
              <div v-if="locationMapsLinkStatus === 'coords_only'" class="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {{ t('orgDashboard.mapsLinkAddressError') }}
              </div>
              <div v-if="locationMapsLinkStatus === 'parse_error' || (locationGeocodeError && locationMapsLinkStatus !== 'coords_only')" class="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {{ message || t('orgDashboard.geocodeError') }}
              </div>
              <div class="flex gap-2">
                <input
                  v-model="mapsLinkInput"
                  type="url"
                  class="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-500"
                  :placeholder="t('orgDashboard.mapsLinkPlaceholder')"
                  :disabled="locationFromLinkLoading"
                  @keydown.enter.prevent="applyAddressFromMapsLink()"
                />
                <button
                  type="button"
                  :disabled="locationFromLinkLoading"
                  class="shrink-0 px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 text-sm font-medium hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  @click="applyAddressFromMapsLink()"
                >
                  {{ locationFromLinkLoading ? t('orgDashboard.geocoding') : t('orgDashboard.mapsLinkApply') }}
                </button>
              </div>
            </div>

            <p class="text-xs text-slate-500">{{ t('orgDashboard.locationAddressHintFromLink') }}</p>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.requestTitle') }}</label>
              <input v-model="formLocation.title" type="text" required :placeholder="t('orgDashboard.locationNamePlaceholder')" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.street') }}</label>
              <input v-model="formLocation.address" type="text" :placeholder="t('orgDashboard.streetPlaceholder')" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.postalCode') }}</label>
                <input v-model="formLocation.postalCode" type="text" :placeholder="t('orgDashboard.postalCodePlaceholder')" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.city') }}</label>
                <input v-model="formLocation.city" type="text" required class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.countryCode') }}</label>
              <input v-model="formLocation.countryCode" type="text" maxlength="2" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" placeholder="DE" />
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p class="text-sm font-medium text-slate-800">{{ t('orgDashboard.coordsManualHint') }}</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">{{ t('orgDashboard.latitude') }}</label>
                  <input
                    v-model.number="formLocation.lat"
                    type="number"
                    step="0.000001"
                    min="-90"
                    max="90"
                    class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm bg-white"
                    :placeholder="t('orgDashboard.latitudePlaceholder')"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">{{ t('orgDashboard.longitude') }}</label>
                  <input
                    v-model.number="formLocation.lng"
                    type="number"
                    step="0.000001"
                    min="-180"
                    max="180"
                    class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm bg-white"
                    :placeholder="t('orgDashboard.longitudePlaceholder')"
                  />
                </div>
              </div>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                type="submit"
                :disabled="!hasValidLocationCoords()"
                class="px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-medium text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ t('orgDashboard.save') }}
              </button>
              <button type="button" class="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors" @click="showModal = false">{{ t('orgDashboard.cancel') }}</button>
            </div>
          </form>

          <form v-if="modalMode === 'animal'" class="space-y-4" @submit.prevent="saveAnimal">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.image') }}</label>
              <div class="flex items-start gap-4">
                <div class="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
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
                  <span v-else class="text-slate-400 text-xs">{{ t('orgDashboard.noImage') }}</span>
                </div>
                <div class="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm"
                    @change="onAnimalImageChange"
                  />
                  <p class="text-xs text-slate-500 mt-1">{{ t('orgDashboard.imageHint') }}</p>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.name') }}</label>
              <input v-model="formAnimal.name" type="text" required class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.species') }}</label>
              <select v-model="formAnimal.species" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm">
                <option v-for="opt in speciesOptions" :key="opt.value" :value="opt.value">{{ t(opt.labelKey) }}</option>
              </select>
              <input
                v-if="formAnimal.species === 'other'"
                v-model="formAnimal.speciesOtherText"
                type="text"
                :placeholder="t('orgDashboard.speciesOtherPlaceholder')"
                class="mt-2 border border-slate-300 rounded-lg px-3 py-2 w-full text-sm"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.size') }}</label>
              <select v-model="formAnimal.sizeClass" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm">
                <option value="">– {{ t('orgDashboard.noAnimal') }} –</option>
                <option value="S">{{ t('orgDashboard.sizeS') }}</option>
                <option value="M">{{ t('orgDashboard.sizeM') }}</option>
                <option value="L">{{ t('orgDashboard.sizeL') }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.specialNeeds') }}</label>
              <textarea v-model="formAnimal.notes" :placeholder="t('orgDashboard.specialNeedsPlaceholder')" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm" rows="2" />
            </div>
            <div class="flex gap-2 pt-2">
              <button type="submit" class="px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-medium text-sm hover:bg-amber-600 transition-colors">{{ t('orgDashboard.save') }}</button>
              <button type="button" class="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors" @click="showModal = false">{{ t('orgDashboard.cancel') }}</button>
            </div>
          </form>

          <form v-if="modalMode === 'request'" class="space-y-4" @submit.prevent="saveRequest">
            <div>
              <label class="block text-sm font-medium mb-1">{{ t('orgDashboard.requestTitle') }}</label>
              <input v-model="formRequest.title" type="text" required class="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">{{ t('orgDashboard.details') }}</label>
              <textarea v-model="formRequest.details" class="border rounded px-3 py-2 w-full" rows="2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.assignAnimal') }}</label>
              <select v-model="formRequest.animalId" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm">
                <option value="">– {{ t('orgDashboard.noAnimal') }} –</option>
                <option v-for="a in selectedOrg?.animals" :key="a.id" :value="a.id">{{ a.name }} ({{ getSpeciesLabel(a.species) }})</option>
              </select>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p class="text-sm font-medium text-slate-800">Gemeinsam fliegen</p>
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input v-model="formRequest.groupMode" type="radio" value="none" class="text-amber-500 focus:ring-amber-500" />
                  Keine Gruppe
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input v-model="formRequest.groupMode" type="radio" value="existing" class="text-amber-500 focus:ring-amber-500" />
                  Bestehende Gruppe auswählen
                </label>
                <div v-if="formRequest.groupMode === 'existing'" class="pl-6">
                  <select v-model="formRequest.groupId" class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm bg-white">
                    <option value="">– Gruppe wählen –</option>
                    <option v-for="g in requestGroupOptions" :key="g.id" :value="g.id">{{ g.title }}</option>
                  </select>
                </div>
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input v-model="formRequest.groupMode" type="radio" value="new" class="text-amber-500 focus:ring-amber-500" />
                  Neue Gruppe anlegen
                </label>
                <div v-if="formRequest.groupMode === 'new'" class="pl-6">
                  <input
                    v-model="formRequest.groupTitle"
                    type="text"
                    class="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm bg-white"
                    placeholder="z. B. 2 Katzen gemeinsam nach MUC"
                  />
                  <p class="text-xs text-slate-600 mt-1">Diese Gruppe wird für diese Organisation gespeichert und kann später wiederverwendet werden.</p>
                </div>
              </div>
            </div>
            <div v-if="editingId" class="grid grid-cols-1 gap-4">
              <label class="block text-sm font-medium mb-1">{{ t('admin.acquise.status') }}</label>
              <select v-model="formRequest.status" class="border rounded px-3 py-2 w-full">
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p class="text-sm font-medium text-slate-800">{{ t('map.animalTransportTitle', 'Tiertransport') }}</p>
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input v-model="formRequest.animalCanFlyInCargo" type="checkbox" class="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  {{ t('map.animalTransportCargo') }}
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input v-model="formRequest.animalCanFlyInCabin" type="checkbox" class="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  {{ t('map.animalTransportCabin') }}
                </label>
              </div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex items-start justify-between gap-3">
                <label class="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input v-model="formRequest.waitingListEnabled" type="checkbox" class="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  {{ t('orgDashboard.waitingListEnable') }}
                </label>
                <span class="text-slate-500 text-sm" :title="t('orgDashboard.waitingListEnableHint')">i</span>
              </div>
              <p class="text-xs text-slate-600 mt-2">
                {{ t('orgDashboard.waitingListEnableHint') }}
              </p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">{{ t('orgDashboard.earliestDate') }}</label>
                <input v-model="formRequest.earliestDate" type="date" required class="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">{{ t('orgDashboard.latestDate') }}</label>
                <input v-model="formRequest.latestDate" type="date" required class="border rounded px-3 py-2 w-full" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.originAirport') }}</label>
              <AirportAutocomplete
                :model-value="formRequest.originAirport"
                :placeholder="t('map.filterOriginPlaceholder', 'Abflughafen suchen…')"
                @update:model-value="(v) => { formRequest.originAirport = v; if (!v) { formRequest.originLat = null; formRequest.originLng = null } }"
                @select="(a) => { formRequest.originLat = a.lat; formRequest.originLng = a.lon }"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('orgDashboard.destAirport') }}</label>
              <AirportAutocomplete
                :model-value="formRequest.destAirport"
                :placeholder="t('map.filterDestPlaceholder', 'Zielflughafen suchen…')"
                @update:model-value="(v) => { formRequest.destAirport = v; if (!v) { formRequest.destLat = null; formRequest.destLng = null } }"
                @select="(a) => { formRequest.destLat = a.lat; formRequest.destLng = a.lon }"
              />
            </div>
            <div class="flex gap-2 pt-2">
              <button type="submit" :disabled="requestSaving" class="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {{ t('orgDashboard.save') }}
              </button>
              <button type="button" class="px-4 py-2 rounded-lg bg-slate-200" @click="showModal = false">{{ t('orgDashboard.cancel') }}</button>
            </div>
          </form>

        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="reportingReviewId" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="w-full max-w-md rounded-xl bg-white shadow-xl p-6 relative">
          <button
            type="button"
            class="absolute top-3 right-3 inline-flex items-center justify-center h-10 w-10 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Schließen"
            @click="cancelReportReview"
          >
            <span class="text-2xl leading-none">×</span>
          </button>
          <h3 class="text-lg font-semibold text-slate-900 mb-4">{{ t('orgDashboard.reviews.reportTitle') }}</h3>
          <textarea v-model="reportReason" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4" :placeholder="t('orgDashboard.reviews.reportPlaceholder')" />
          <div class="flex gap-2">
            <button type="button" class="px-4 py-2 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-500" @click="submitReportReview">
              {{ t('orgDashboard.reviews.reportSubmit') }}
            </button>
            <button type="button" class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50" @click="cancelReportReview">
              {{ t('orgDashboard.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ReviewModal
      v-if="reviewModalRequest"
      :show="!!reviewModalRequest"
      :title="t('review.ratePatronTitle', { name: reviewModalRequest.patronName })"
      :request-id="reviewModalRequest.requestId"
      :reviewee-user-id="reviewModalRequest.patronId"
      @close="closeReviewModal"
      @submitted="onReviewSubmitted"
    />
  </div>
</template>
