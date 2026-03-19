<script setup lang="ts">
import hintergrundImg from '~/assets/images/hintergrund.png'

const { t } = useI18n()
const { getSpeciesLabel } = useSpeciesLabel()

const { data: latestData } = await useFetch<{
  requests: {
    id: string
    title: string
    originAirport: string
    destAirport: string
    earliestDate: string
    latestDate: string
    animal: { name: string; species: string; imageUrl?: string | null } | null
    organization: { name: string; slug: string }
  }[]
}>('/api/requests/latest')
const latestRequests = computed(() => latestData.value?.requests ?? [])
const exampleNote = computed(() => t('home.exampleNote'))

function formatDateRange(earliest: string, latest: string) {
  const d1 = new Date(earliest)
  const d2 = new Date(latest)
  if (d1.toDateString() === d2.toDateString()) return d1.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${d1.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – ${d2.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

useHead({
  title: 'PawBridge – Dein Flug kann Leben retten',
  meta: [
    { name: 'description', content: 'Werde Flugpate: Begleite Tiere auf deinem Flug in ein neues Zuhause. Kostenlos, sicher, mit geprüften Tierschutzorganisationen.' },
  ],
})
</script>

<template>
  <div class="relative overflow-x-hidden">
    <!-- HERO – Mobile-first: kleinere Abstände, dann md+ -->
    <section
      class="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-20 md:py-28 text-white bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${hintergrundImg})` }"
      aria-label="Hero"
    >
      <div class="absolute inset-0 bg-slate-900/65" aria-hidden="true" />
      <div class="relative z-10 text-center max-w-4xl mx-auto">
        <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-bold tracking-tight mb-4 sm:mb-6 leading-tight px-1 sm:px-0 break-words">
          {{ t('home.heroTitle') }}
        </h1>
        <p class="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed">
          {{ t('home.heroSubtitle') }}
        </p>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 w-full sm:w-auto">
          <NuxtLink
            to="/map"
            class="inline-flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-base md:text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98] min-h-[48px] sm:min-h-[52px]"
          >
            {{ t('home.heroCta') }}
          </NuxtLink>
          <NuxtLink
            to="#so-funktioniert-es"
            class="inline-flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl border-2 border-white/80 text-white hover:bg-white/10 font-semibold text-base transition-all min-h-[48px] sm:min-h-[52px]"
          >
            {{ t('home.heroCtaSecondary') }}
          </NuxtLink>
        </div>
        <p class="text-sm md:text-base text-slate-300/95 font-medium">
          {{ t('home.heroTrust') }}
        </p>
      </div>
    </section>

    <!-- SECTION 2 – Mobile-first: 1 Spalte, dann md: 3 -->
    <section class="bg-white py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6" aria-labelledby="section2-title">
      <div class="container mx-auto max-w-5xl">
        <h2 id="section2-title" class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4 sm:mb-6">
          {{ t('home.section2Title') }}
        </h2>
        <p class="text-base sm:text-lg text-slate-600 text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          {{ t('home.section2Text') }}
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
          <div class="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl mb-5" aria-hidden="true">
              💰
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">{{ t('home.benefit1Title') }}</h3>
            <p class="text-slate-600 leading-relaxed">{{ t('home.benefit1Text') }}</p>
          </div>
          <div class="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl mb-5" aria-hidden="true">✓</div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">{{ t('home.benefit2Title') }}</h3>
            <p class="text-slate-600 leading-relaxed">{{ t('home.benefit2Text') }}</p>
          </div>
          <div class="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1">
            <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl mb-5" aria-hidden="true">🐾</div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">{{ t('home.benefit3Title') }}</h3>
            <p class="text-slate-600 leading-relaxed">{{ t('home.benefit3Text') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 3 – Mobile-first: 1 Spalte, dann md: 3 -->
    <section
      id="so-funktioniert-es"
      class="bg-slate-100 py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 scroll-mt-20"
      aria-labelledby="section3-title"
    >
      <div class="container mx-auto max-w-5xl">
        <h2 id="section3-title" class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 text-center mb-10 sm:mb-16">
          {{ t('home.section3Title') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg" aria-hidden="true">1</div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">{{ t('home.step1Title') }}</h3>
            <p class="text-slate-600 leading-relaxed">{{ t('home.step1Text') }}</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg" aria-hidden="true">2</div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">{{ t('home.step2Title') }}</h3>
            <p class="text-slate-600 leading-relaxed">{{ t('home.step2Text') }}</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg" aria-hidden="true">3</div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">{{ t('home.step3Title') }}</h3>
            <p class="text-slate-600 leading-relaxed">{{ t('home.step3Text') }}</p>
          </div>
        </div>
        <div class="text-center mt-10 sm:mt-14">
          <NuxtLink
            to="/map"
            class="inline-flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-base transition-all shadow-lg hover:shadow-xl min-h-[48px] sm:min-h-[52px]"
          >
            {{ t('home.heroCta') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- SECTION 4 – Mobile-first: 1 Karte, dann sm/md 3.
         ClientOnly verhindert Hydration-Mismatch: Server und Client können unterschiedliche API-Daten haben. -->
    <section class="bg-white py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6" aria-labelledby="section4-title">
      <div class="container mx-auto max-w-5xl">
        <h2 id="section4-title" class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 text-center mb-8 sm:mb-12">
          {{ t('home.section4Title') }}
        </h2>
        <ClientOnly>
          <div v-if="latestRequests.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <NuxtLink
            v-for="r in latestRequests"
            :key="r.id"
            :to="`/requests/${r.id}`"
            class="group rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden hover:shadow-xl hover:border-amber-200 transition-all flex flex-col"
          >
            <div class="aspect-[4/3] bg-gradient-to-br from-amber-50 to-slate-100 flex items-center justify-center shrink-0">
              <img
                v-if="r.animal?.imageUrl"
                :src="r.animal.imageUrl"
                :alt="r.animal.name"
                class="w-full h-full object-cover"
                @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
              />
              <span v-else class="text-5xl opacity-80" aria-hidden="true">
                {{ r.animal?.species === 'dog' ? '🐕' : r.animal?.species === 'cat' ? '🐈' : '🐾' }}
              </span>
            </div>
            <div class="p-4 md:p-5 flex flex-col flex-1">
              <p class="font-semibold text-slate-800 mb-2">
                {{ r.originAirport }} → {{ r.destAirport }}
              </p>
              <p class="text-sm text-slate-500 mb-2">
                {{ formatDateRange(r.earliestDate, r.latestDate) }}
              </p>
              <p v-if="r.animal" class="text-sm text-slate-600 mb-3">
                {{ r.animal.name }} · {{ getSpeciesLabel(r.animal.species) }}
              </p>
              <p class="text-sm font-bold text-amber-600 mb-4">
                {{ t('home.exampleCost') }}
              </p>
              <span
                class="mt-auto block w-full py-2.5 px-3 rounded-xl bg-slate-800 text-white font-semibold text-center text-sm group-hover:bg-slate-700 transition-colors"
              >
                {{ t('home.exampleCta') }}
              </span>
            </div>
          </NuxtLink>
        </div>
        <div v-else class="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <p class="text-slate-600 mb-4">Aktuell keine offenen Transportanfragen.</p>
          <NuxtLink
            to="/map"
            class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm transition-colors"
          >
            Zur Karte
          </NuxtLink>
        </div>
        <p v-if="latestRequests.length && exampleNote" class="mt-6 text-sm text-slate-500 text-center max-w-xl mx-auto">
          {{ exampleNote }}
        </p>
        <div v-if="latestRequests.length" class="mt-8 text-center">
          <NuxtLink
            to="/map"
            class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm transition-colors"
          >
            Alle Transporte auf der Karte anzeigen
          </NuxtLink>
        </div>
          <template #fallback>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
              <p class="text-slate-600 mb-4">{{ t('common.searching') }}</p>
            </div>
          </template>
        </ClientOnly>
      </div>
    </section>

    <!-- SECTION 5 – Mobile-first -->
    <section class="bg-slate-100 py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6" aria-labelledby="section5-title">
      <div class="container mx-auto max-w-4xl text-center">
        <h2 id="section5-title" class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">
          {{ t('home.section5Title') }}
        </h2>
        <p class="text-base sm:text-lg text-slate-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-0">
          {{ t('home.section5Text') }}
        </p>
        <div class="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-12">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold" aria-hidden="true">✓</span>
            <span class="font-medium text-slate-800">{{ t('home.trust1') }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold" aria-hidden="true">✓</span>
            <span class="font-medium text-slate-800">{{ t('home.trust2') }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold" aria-hidden="true">✓</span>
            <span class="font-medium text-slate-800">{{ t('home.trust3') }}</span>
          </div>
        </div>
        <div class="mt-10 sm:mt-14 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <NuxtLink
            to="/register"
            class="inline-flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-base transition-all min-h-[48px] sm:min-h-[52px]"
          >
            {{ t('nav.register') }}
          </NuxtLink>
          <NuxtLink to="#so-funktioniert-es" class="text-slate-600 hover:text-slate-900 font-semibold transition-colors">
            {{ t('home.heroCtaSecondary') }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
