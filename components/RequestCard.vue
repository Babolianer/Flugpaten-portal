<script setup lang="ts">
const { t, locale } = useI18n()
const { getRequestStatusLabel } = useRequestStatus()

type MatchType = 'DIRECT' | 'RADIUS' | 'COUNTRY'

interface Request {
  id: string
  title: string
  originAirport: string
  destAirport: string
  earliestDate: string
  latestDate: string
  status?: string
  organization?: { name: string; slug: string }
  animal?: { name: string; species: string; imageUrl?: string | null } | null
  matchType?: MatchType
  distanceKm?: number
}

defineProps<{
  request: Request
  selected?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <div
    class="p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-amber-400 flex gap-3 sm:gap-4 min-w-0"
    :class="selected ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'"
    @click="$emit('click')"
  >
    <!-- Tierbild oder Platzhalter -->
    <div class="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
      <img
        v-if="request.animal?.imageUrl"
        :src="request.animal.imageUrl"
        :alt="request.animal.name"
        class="w-full h-full object-cover"
        @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-2xl text-slate-400">
        {{ request.animal?.species === 'dog' ? '🐕' : '🐈' }}
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap gap-2 mb-2">
        <span
          v-if="request.status"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          :class="{
            'bg-emerald-100 text-emerald-800': request.status === 'OPEN',
            'bg-blue-100 text-blue-800': request.status === 'MATCHED',
            'bg-slate-100 text-slate-700': request.status === 'COMPLETED',
            'bg-red-100 text-red-800': request.status === 'CANCELLED',
          }"
        >
          {{ getRequestStatusLabel(request.status) }}
        </span>
        <span
          v-if="request.matchType === 'DIRECT'"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800"
        >
          {{ t('map.badgeDirect') }}
        </span>
        <span
          v-else-if="request.matchType === 'RADIUS' && request.distanceKm != null"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
        >
          {{ t('map.badgeRadius', { km: request.distanceKm }) }}
        </span>
        <span
          v-else-if="request.matchType === 'COUNTRY'"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
        >
          {{ t('map.badgeCountry') }}
        </span>
      </div>
      <h3 class="font-semibold text-slate-900">{{ request.title }}</h3>
      <p v-if="request.animal" class="text-sm text-slate-600 mt-1">
        {{ request.animal.name }} ({{ request.animal.species }})
      </p>
      <p class="text-sm text-slate-600 mt-1">
        {{ request.originAirport }} → {{ request.destAirport }}
      </p>
      <p class="text-xs text-slate-500 mt-2">
        {{ new Date(request.earliestDate).toLocaleDateString(locale) }} –
        {{ new Date(request.latestDate).toLocaleDateString(locale) }}
      </p>
      <p
        v-if="request.matchType === 'COUNTRY'"
        class="text-xs text-slate-600 mt-2 italic"
      >
        {{ t('map.countryHint') }}
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <NuxtLink
          v-if="request.organization"
          :to="`/org/${request.organization.slug}`"
          class="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          @click.stop
        >
          {{ request.organization.name }}
        </NuxtLink>
        <NuxtLink
          :to="`/requests/${request.id}`"
          class="inline-flex items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 transition-colors"
          @click.stop
        >
          {{ t('map.detailsApply') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
