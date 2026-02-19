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
    selectedId?: string | null
    center?: [number, number]
    zoom?: number
  }>(),
  {
    connections: () => [],
    selectedRoute: null,
    selectedId: null,
    center: () => [10.4515, 51.1657] as [number, number],
    zoom: 4,
  }
)

const emit = defineEmits<{
  pinClick: [pin: Pin]
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: maplibregl.Map | null = null
let markers: maplibregl.Marker[] = []

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
            'line-width': 3,
            'line-dasharray': [2, 1],
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
    if (props.selectedRoute) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [props.selectedRoute.from, props.selectedRoute.to],
            },
          },
        ],
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
      const startEl = document.createElement('div')
      startEl.title = 'Start (A)'
      startEl.textContent = 'A'
      Object.assign(startEl.style, routePointStyle)
      const endEl = document.createElement('div')
      endEl.title = 'Ziel (B)'
      endEl.textContent = 'B'
      Object.assign(endEl.style, { ...routePointStyle })
      const mStart = new maplibregl.Marker({ element: startEl })
        .setLngLat(props.selectedRoute.from)
        .addTo(map)
      const mEnd = new maplibregl.Marker({ element: endEl })
        .setLngLat(props.selectedRoute.to)
        .addTo(map)
      selectedRouteMarkers.value = [mStart, mEnd]
      const bounds = new maplibregl.LngLatBounds()
      bounds.extend(props.selectedRoute.from)
      bounds.extend(props.selectedRoute.to)
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
    const features = props.connections.map((c) => ({
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
      .setLngLat([pin.lng, pin.lat])
      .addTo(map)

    el.addEventListener('click', () => {
      emit('pinClick', pin)
      map?.flyTo({ center: [pin.lng, pin.lat], zoom: 10 })
    })

    markers.push(marker)
  }
}

function flyTo(lng: number, lat: number, zoom = 10) {
  map?.flyTo({ center: [lng, lat], zoom })
}

function fitToPins() {
  if (!map || props.pins.length === 0) return
  const bounds = new maplibregl.LngLatBounds()
  for (const pin of props.pins) {
    bounds.extend([pin.lng, pin.lat])
  }
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
    if (!props.selectedRoute && props.pins.length > 0) fitToPins()
  },
  { deep: true }
)
watch(
  () => props.connections,
  () => updateConnections(),
  { deep: true }
)
watch(
  () => props.selectedRoute,
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

defineExpose({ flyTo, fitToPins })
</script>

<template>
  <div ref="mapContainer" class="w-full h-full min-h-[400px] rounded-lg overflow-hidden" />
</template>
