<script setup lang="ts">
const { t } = useI18n()

const sections = [
  { title: 'terms.section1Title', content: 'terms.section1Content' },
  { title: 'terms.section2Title', content: 'terms.section2Content' },
  { title: 'terms.section3Title', content: 'terms.section3Content' },
  { title: 'terms.section4Title', content: 'terms.section4Content' },
  { title: 'terms.section5Title', content: 'terms.section5Content' },
  { title: 'terms.section6Title', content: 'terms.section6Content' },
  { title: 'terms.section7Title', content: 'terms.section7Content' },
]
</script>

<template>
  <div class="container mx-auto px-4 py-12 max-w-3xl">
    <h1 class="text-3xl font-bold text-slate-900 mb-8">{{ t('terms.title') }}</h1>
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
