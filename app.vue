<script setup lang="ts">
const { data: maintenanceData } = await useFetch<{ maintenance: boolean }>('/api/site/maintenance')
const showCookieBanner = computed(() => maintenanceData.value?.maintenance === false)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <CookieConsent v-if="showCookieBanner" />
</template>
