<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="container mx-auto px-4 py-12 max-w-3xl">
    <h1 class="text-3xl font-bold text-slate-900 mb-8">{{ t('impressum.title') }}</h1>
    <div class="prose prose-slate max-w-none space-y-6 text-slate-700">
      <p class="text-sm text-slate-500">
        {{ t('impressum.disclaimer') }}
      </p>
      <section>
        <h2 class="text-xl font-semibold text-slate-900 mt-6 mb-2">{{ t('impressum.provider') }}</h2>
        <p>
          [Name des Betreibers]<br>
          [Straße und Hausnummer]<br>
          [PLZ und Ort]
        </p>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-900 mt-6 mb-2">{{ t('impressum.contact') }}</h2>
        <p>
          E-Mail: [Kontakt-E-Mail]<br>
          Telefon: [optional]
        </p>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-900 mt-6 mb-2">{{ t('impressum.responsible') }}</h2>
        <p>[Name und Anschrift wie oben]</p>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-900 mt-6 mb-2">{{ t('impressum.liability') }}</h2>
        <p>
          {{ t('impressum.liabilityText') }}
        </p>
      </section>
    </div>
    <NuxtLink to="/" class="inline-block mt-8 text-amber-600 hover:text-amber-500 font-medium">
      {{ t('impressum.backToHome') }}
    </NuxtLink>
  </div>
</template>
