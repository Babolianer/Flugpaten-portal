<script setup lang="ts">
const { t } = useI18n()

const sections = [
  { title: 'privacy.section1Title', content: 'privacy.section1Content' },
  { title: 'privacy.section2Title', content: 'privacy.section2Content' },
  { title: 'privacy.section3Title', content: 'privacy.section3Content' },
  { title: 'privacy.section4Title', content: 'privacy.section4Content' },
  { title: 'privacy.section5Title', content: 'privacy.section5Content' },
  { title: 'privacy.section6Title', content: 'privacy.section6Content' },
  { title: 'privacy.section7Title', content: 'privacy.section7Content' },
  { title: 'privacy.section8Title', content: 'privacy.section8Content' },
]
</script>

<template>
  <div class="container mx-auto px-4 py-12 max-w-3xl">
    <h1 class="text-3xl font-bold text-slate-900 mb-8">{{ t('privacy.title') }}</h1>
    <div class="prose prose-slate max-w-none space-y-6 text-slate-700">
      <section v-for="(sec, i) in sections" :key="i">
        <h2 class="text-xl font-semibold text-slate-900 mt-6 mb-2">{{ t(sec.title) }}</h2>
        <p class="whitespace-pre-line">{{ t(sec.content) }}</p>
      </section>
    </div>
    <NuxtLink to="/" class="inline-block mt-8 text-amber-600 hover:text-amber-500 font-medium">
      {{ t('impressum.backToHome') }}
    </NuxtLink>
  </div>
</template>
