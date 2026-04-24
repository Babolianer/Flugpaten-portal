<script setup lang="ts">
/**
 * Lädt MapLibre und die Karten-Implementierung erst clientseitig (eigener Chunk),
 * damit die initiale Route nicht das volle maplibre-Bundle zieht.
 */
defineOptions({ inheritAttrs: false })

const MapViewImpl = defineAsyncComponent(() => import('~/components/MapViewImpl.vue'))
import type { MapViewConnection, MapViewPin, SelectedRoute } from '~/components/mapViewTypes'

const props = withDefaults(
  defineProps<{
    pins: MapViewPin[]
    connections?: MapViewConnection[]
    selectedRoute?: SelectedRoute | null
    selectedRoutes?: SelectedRoute[] | null
    selectedId?: string | null
    center?: [number, number]
    zoom?: number
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
  pinClick: [pin: any]
}>()

const implRef = ref<{
  flyTo: (lng: number, lat: number, zoom?: number) => void
  fitToPins: () => void
  resize: () => void
} | null>(null)

defineExpose({
  flyTo: (lng: number, lat: number, zoom?: number) => implRef.value?.flyTo(lng, lat, zoom),
  fitToPins: () => implRef.value?.fitToPins(),
  resize: () => implRef.value?.resize(),
})
</script>

<template>
  <ClientOnly>
    <MapViewImpl
      ref="implRef"
      :pins="props.pins"
      :connections="props.connections"
      :selected-route="props.selectedRoute"
      :selected-routes="props.selectedRoutes"
      :selected-id="props.selectedId"
      :center="props.center"
      :zoom="props.zoom"
      :compact="props.compact"
      @pin-click="emit('pinClick', $event)"
    />
    <template #fallback>
      <div
        class="w-full h-full rounded-lg overflow-hidden min-h-[400px] bg-slate-200/80 animate-pulse"
        aria-hidden="true"
      />
    </template>
  </ClientOnly>
</template>
