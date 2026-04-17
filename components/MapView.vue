<script setup lang="ts">
import maplibregl from 'maplibre-gl'

interface Pin {
  id: string
  type: 'request'
  lat: number
  lng: number
  title?: string
  requestId?: string
  orgId?: string
  organization?: { name: string; slug: string }
  animal?: { name: string; species: string }
  matchType?: 'DIRECT' | 'RADIUS' | 'COUNTRY'
  distanceKm?: number
}

export interface Connection {
  from: [number, number]
  to: [number, number]
}

/** Bei ausgewählter Route: Start- und Zielpunkt markieren und gestrichelt verbinden */
export interface SelectedRoute {
  from: [number, number]
  to: [number, number]
}

const props = withDefaults(
  defineProps<{
    pins: Pin[]
    connections?: Connection[]
    selectedRoute?: SelectedRoute | null
    /** Mehrere Strecken (z.B. 1 Start + 2 Ziele): wird bevorzugt vor selectedRoute */
    selectedRoutes?: SelectedRoute[] | null
    selectedId?: string | null
    center?: [number, number]
    zoom?: number
    /** Bei true: min-height deaktiviert (für Banner-Ansicht auf Mobile) */
    compact?: boolean
  }>(),
  {
    connections: () => [],
    selectedRoute: null,
    selectedRoutes: null,
    selectedId: null,
    center: () => [10.4515, 51.1657] as [number, number],
    zoom: 4,
    compact: false,
  }
)

const emit = defineEmits<{
  pinClick: [pin: Pin]
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: maplibregl.Map | null = null
let markers: maplibregl.Marker[] = []

function isFiniteLngLat(lng: number, lat: number): boolean {
  return Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

function initMap() {
  if (!mapContainer.value) return

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
        connections: {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        },
        selectedRoute: {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        },
      },
      layers: [
        { id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 },
        {
          id: 'connections-line',
          type: 'line',
          source: 'connections',
          paint: { 'line-color': '#f59e0b', 'line-width': 2 },
          layout: { 'line-join': 'round', 'line-cap': 'round' },
        },
        {
          id: 'selected-route-line',
          type: 'line',
          source: 'selectedRoute',
          paint: {
            'line-color': '#ea580c',
            'line-width': 4,
            'line-opacity': 0.95,
          },
          layout: { 'line-join': 'round', 'line-cap': 'round' },
        },
      ],
    },
    center: props.center,
    zoom: props.zoom,
  })

  map.on('load', () => {
    updateConnections()
    updateSelectedRoute()
    updateMarkers()
  })
}

const selectedRouteMarkers = ref<maplibregl.Marker[]>([])

function updateSelectedRoute() {
  if (!map) return
  try {
    const source = map.getSource('selectedRoute') as maplibregl.GeoJSONSource | undefined
    if (!source) return
    const routes = props.selectedRoutes && props.selectedRoutes.length > 0
      ? props.selectedRoutes
      : props.selectedRoute
        ? [props.selectedRoute]
        : null
    if (routes && routes.length > 0) {
      const normalizedRoutes = routes
        .map((r) => ({
          from: [Number(r.from[0]), Number(r.from[1])] as [number, number],
          to: [Number(r.to[0]), Number(r.to[1])] as [number, number],
        }))
        .filter((r) => isFiniteLngLat(r.from[0], r.from[1]) && isFiniteLngLat(r.to[0], r.to[1]))
      if (normalizedRoutes.length === 0) {
        source.setData({ type: 'FeatureCollection', features: [] })
        selectedRouteMarkers.value.forEach((m) => m.remove())
        selectedRouteMarkers.value = []
        return
      }
      source.setData({
        type: 'FeatureCollection',
        features: normalizedRoutes.map((r) => ({
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: [r.from, r.to],
          },
        })),
      })
      selectedRouteMarkers.value.forEach((m) => m.remove())
      selectedRouteMarkers.value = []
      const routePointStyle = {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#ea580c',
        color: '#fff',
        border: '2px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
      }
      const bounds = new maplibregl.LngLatBounds()
      const startAdded = new Set<string>()
      normalizedRoutes.forEach((r, idx) => {
        const startKey = `${r.from[0]},${r.from[1]}`
        if (!startAdded.has(startKey)) {
          startAdded.add(startKey)
          const startEl = document.createElement('div')
          startEl.title = 'Start (A)'
          startEl.textContent = 'A'
          Object.assign(startEl.style, routePointStyle)
          const mStart = new maplibregl.Marker({ element: startEl })
            .setLngLat(r.from)
            .addTo(map!)
          selectedRouteMarkers.value.push(mStart)
        }
        bounds.extend(r.from)
        bounds.extend(r.to)
        const endEl = document.createElement('div')
        endEl.title = normalizedRoutes.length > 1 ? `Ziel ${idx + 1} (${String.fromCharCode(66 + idx)})` : 'Ziel (B)'
        endEl.textContent = normalizedRoutes.length > 1 ? String(idx + 1) : 'B'
        Object.assign(endEl.style, { ...routePointStyle })
        const mEnd = new maplibregl.Marker({ element: endEl })
          .setLngLat(r.to)
          .addTo(map!)
        selectedRouteMarkers.value.push(mEnd)
      })
      map.fitBounds(bounds, { padding: 60, maxZoom: 10 })
    } else {
      source.setData({ type: 'FeatureCollection', features: [] })
      selectedRouteMarkers.value.forEach((m) => m.remove())
      selectedRouteMarkers.value = []
    }
  } catch {
    // Style not loaded yet
  }
}

function updateConnections() {
  if (!map) return
  try {
    const source = map.getSource('connections') as maplibregl.GeoJSONSource | undefined
    if (!source) return
    const features = props.connections
      .filter((c) => isFiniteLngLat(c.from[0], c.from[1]) && isFiniteLngLat(c.to[0], c.to[1]))
      .map((c) => ({
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: [c.from, c.to],
        },
      }))
    source.setData({ type: 'FeatureCollection', features })
  } catch {
    // Style not loaded yet
  }
}

function updateMarkers() {
  if (!map) return

  markers.forEach((m) => m.remove())
  markers = []

  for (const pin of props.pins) {
    const lng = Number(pin.lng)
    const lat = Number(pin.lat)
    if (!isFiniteLngLat(lng, lat)) continue

    const el = document.createElement('div')
    let bg = pin.type === 'request' ? 'bg-amber-500' : 'bg-emerald-600'
    if (pin.type === 'request' && pin.matchType === 'DIRECT') bg = 'bg-emerald-500'
    else if (pin.type === 'request' && pin.matchType === 'RADIUS') bg = 'bg-blue-500'
    else if (pin.type === 'request' && pin.matchType === 'COUNTRY') bg = 'bg-amber-400'
    el.className =
      'w-6 h-6 rounded-full cursor-pointer border-2 border-white shadow-md transition-transform hover:scale-110 ' + bg
    if (props.selectedId === pin.id || props.selectedId === pin.requestId) {
      el.classList.add('ring-4', 'ring-amber-300', 'scale-125')
    }

    const routeText = pin.title ? `${pin.title}` : ''
    const distText = pin.distanceKm != null ? `, ${pin.distanceKm} km` : ''
    const orgText = pin.organization ? ` • ${pin.organization.name}` : ''
    const extraText = pin.matchType === 'COUNTRY' ? ' • Weitertransport durch Organisation möglich' : ''
    el.title = [routeText, distText, orgText, extraText].filter(Boolean).join('').replace(/^[ •,]+/, '') || 'Transportanfrage'

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map)

    el.addEventListener('click', () => {
      emit('pinClick', pin)
      map?.flyTo({ center: [lng, lat], zoom: 10 })
    })

    markers.push(marker)
  }
}

function flyTo(lng: number, lat: number, zoom = 10) {
  map?.flyTo({ center: [lng, lat], zoom })
}

function resize() {
  if (!map) return
  map.resize()
  updateConnections()
  updateSelectedRoute()
  updateMarkers()
}

function fitToPins() {
  if (!map || props.pins.length === 0) return
  const bounds = new maplibregl.LngLatBounds()
  let hasValidPin = false
  for (const pin of props.pins) {
    const lng = Number(pin.lng)
    const lat = Number(pin.lat)
    if (!isFiniteLngLat(lng, lat)) continue
    bounds.extend([lng, lat])
    hasValidPin = true
  }
  if (!hasValidPin) return
  try {
    map.fitBounds(bounds, { padding: 60, maxZoom: 10 })
  } catch {
    // ignore
  }
}

watch(
  () => [props.pins, props.selectedId],
  () => {
    updateMarkers()
    // Ensure A/B or A/1/2 markers stay visible above pin markers
    // after pin updates (render order can differ between envs).
    updateSelectedRoute()
    const hasRouteHighlight =
      (props.selectedRoutes && props.selectedRoutes.length > 0) || props.selectedRoute != null
    if (!hasRouteHighlight && props.pins.length > 0) fitToPins()
  },
  { deep: true }
)
watch(
  () => props.connections,
  () => updateConnections(),
  { deep: true }
)
watch(
  () => [props.selectedRoute, props.selectedRoutes],
  () => updateSelectedRoute(),
  { deep: true }
)

onMounted(() => {
  nextTick(initMap)
})

onUnmounted(() => {
  markers.forEach((m) => m.remove())
  selectedRouteMarkers.value.forEach((m) => m.remove())
  map?.remove()
  map = null
})

defineExpose({ flyTo, fitToPins, resize })
</script>

<template>
  <div
    ref="mapContainer"
    class="w-full h-full rounded-lg overflow-hidden"
    :class="compact ? 'min-h-0' : 'min-h-[400px]'"
  />
</template>
