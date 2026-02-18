<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

interface Org {
  id: string
  name: string
  slug: string
  description?: string | null
  landingContent?: string | null
  website?: string | null
  contactEmail: string
  contactPhone?: string | null
  contactInstagram?: string | null
  contactFacebook?: string | null
  logoUrl?: string | null
  locations: { id: string; title: string; city: string; countryCode: string; lat: number; lng: number }[]
  requests: {
    id: string
    title: string
    originAirport: string
    destAirport: string
    earliestDate: string
    latestDate: string
    animal?: { name: string; species: string } | null
  }[]
}

const { data, error } = await useFetch<{ organization: Org }>(`/api/org/${slug}`)

const org = computed(() => data.value?.organization)
const pins = computed(() =>
  (org.value?.locations || []).map((loc) => ({
    id: `loc-${loc.id}`,
    type: 'org' as const,
    lat: loc.lat,
    lng: loc.lng,
    title: loc.title,
    orgId: org.value?.id,
    organization: org.value ? { name: org.value.name, slug: org.value.slug } : undefined,
  }))
)

if (error.value) throw createError({ statusCode: 404, message: 'Organization not found' })
</script>

<template>
  <div v-if="org" class="container mx-auto w-4/5 max-w-full px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
      <!-- Links: Titel, Subtitle, HTML, Kontaktbox, Karte -->
      <div class="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
        <div class="flex flex-wrap items-center gap-4">
          <div v-if="org.logoUrl" class="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <img :src="org.logoUrl" :alt="org.name" class="w-full h-full object-contain" />
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 break-words">{{ org.name }}</h1>
        </div>
        <p v-if="org.description" class="text-base sm:text-lg text-slate-600">{{ org.description }}</p>
        <div
          v-if="org.landingContent"
          class="prose prose-slate max-w-none text-slate-700"
          v-html="org.landingContent"
        />

        <div class="max-w-md">
          <Kontaktbox
            :email="org.contactEmail"
            :website="org.website"
            :phone="org.contactPhone"
            :instagram="org.contactInstagram"
            :facebook="org.contactFacebook"
          />
        </div>

        <div>
          <h2 class="font-semibold text-slate-900 mb-3">Standorte</h2>
          <div v-if="pins.length > 0" class="rounded-xl overflow-hidden shadow-lg border border-slate-200 h-48 sm:h-56 md:h-64 min-w-0">
            <ClientOnly>
              <MapView :pins="pins" :center="[pins[0]?.lng ?? 10, pins[0]?.lat ?? 51]" :zoom="6" />
              <template #fallback>
                <div class="h-64 bg-slate-200 flex items-center justify-center">Karte wird geladen...</div>
              </template>
            </ClientOnly>
          </div>
          <p v-else class="text-slate-600 text-sm">Keine Standorte hinterlegt.</p>
        </div>
      </div>

      <!-- Rechts: Aktive Transport-Anfragen -->
      <div class="lg:col-span-1 min-w-0">
        <h2 class="text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Aktive Transport-Anfragen</h2>
        <div v-if="org.requests.length" class="space-y-3">
          <RequestCard
            v-for="req in org.requests"
            :key="req.id"
            :request="{ ...req, organization: { name: org.name, slug: org.slug } }"
          />
        </div>
        <p v-else class="text-slate-600">Keine offenen Anfragen.</p>
      </div>
    </div>
  </div>
</template>
