<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: () => `${t('contact.title')} – ${t('app.name')}`,
  meta: [{ name: 'description', content: t('contact.metaDescription') }],
})
</script>

<template>
  <div class="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-2xl min-w-0">
    <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6">{{ t('contact.title') }}</h1>
    <p class="text-slate-600 text-sm sm:text-base mb-4">
      {{ t('contact.intro') }}
    </p>
    <div class="prose prose-slate max-w-none mb-6 sm:mb-8 space-y-1 text-slate-700">
      <p>
        <span class="font-medium text-slate-600">{{ t('contact.email') }}:</span>
        <a :href="`mailto:${t('impressum.email')}`" class="text-amber-600 hover:text-amber-500 font-medium">{{ t('impressum.email') }}</a>
      </p>
      <p>
        <span class="font-medium text-slate-600">{{ t('contact.phone') }}:</span>
        <a :href="`tel:${t('impressum.phone').replace(/\s/g, '')}`" class="text-amber-600 hover:text-amber-500 font-medium">{{ t('impressum.phone') }}</a>
      </p>
      <p>
        <span class="font-medium text-slate-600">{{ t('contact.address') }}:</span>
        <span class="whitespace-pre-line">{{ t('impressum.providerContent') }}</span>
      </p>
    </div>
    <p class="text-slate-600 text-sm mb-6 sm:mb-8">
      {{ t('contact.impressumIntro') }}
      <NuxtLink to="/impressum" class="text-amber-600 hover:text-amber-500 font-medium">{{ t('contact.impressumLink') }}</NuxtLink>.
    </p>
    <NuxtLink
      to="/"
      class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors min-h-[48px]"
    >
      {{ t('contact.backToHome') }}
    </NuxtLink>
  </div>
</template>
