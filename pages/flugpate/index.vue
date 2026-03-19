<script setup lang="ts">
import { FLUGPATE_LANDING } from '~/content/flugpate'

const { t } = useI18n()
const { topics } = useFlugpateContent()

useHead({
  title: FLUGPATE_LANDING.metaTitle,
  meta: [
    { name: 'description', content: FLUGPATE_LANDING.metaDescription },
    { property: 'og:title', content: FLUGPATE_LANDING.ogTitle },
    { property: 'og:description', content: FLUGPATE_LANDING.ogDescription },
    { property: 'og:type', content: 'website' },
  ],
})
</script>

<template>
  <div class="bg-slate-50 min-h-screen">
    <!-- Hero -->
    <section class="bg-slate-800 text-white py-12 sm:py-16 px-4">
      <div class="container mx-auto max-w-4xl text-center">
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 break-words">
          {{ t('flugpate.heroTitle') }}
        </h1>
        <p class="text-base sm:text-lg md:text-xl text-slate-200 leading-relaxed max-w-2xl mx-auto">
          {{ t('flugpate.heroSubtitle') }}
        </p>
      </div>
    </section>

    <!-- Content Cards -->
    <section class="container mx-auto px-4 py-12 max-w-6xl">
      <h2 class="text-xl sm:text-2xl font-semibold text-slate-900 mb-6 sm:mb-8 text-center">
        {{ t('flugpate.overviewTitle') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="topic in topics"
          :key="topic.slug"
          :to="`/flugpate/${topic.slug}`"
          class="block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all text-left group"
        >
          <h3 class="text-lg font-semibold text-slate-900 group-hover:text-amber-700 transition-colors mb-2">
            {{ topic.title }}
          </h3>
          <p class="text-slate-600 text-sm leading-relaxed">
            {{ topic.shortDescription }}
          </p>
        </NuxtLink>
      </div>

      <!-- CTAs -->
      <div class="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <NuxtLink
          to="/register"
          class="flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold transition-colors min-h-[48px] text-center"
        >
          {{ t('flugpate.ctaRegisterPatron') }}
        </NuxtLink>
        <NuxtLink
          to="/org/register"
          class="flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors min-h-[48px] text-center"
        >
          {{ t('flugpate.ctaRegisterOrg') }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
