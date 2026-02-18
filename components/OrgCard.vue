<script setup lang="ts">
interface Org {
  id: string
  name: string
  slug: string
  description?: string | null
}

defineProps<{
  org: Org
}>()
</script>

<template>
  <NuxtLink
    :to="`/org/${org.slug}`"
    class="block p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-amber-400 hover:shadow-lg transition-all"
  >
    <h3 class="text-lg font-semibold text-slate-900">{{ org.name }}</h3>
    <p v-if="org.description" class="text-slate-600 mt-2 line-clamp-2">{{ org.description }}</p>
    <span class="inline-block mt-3 text-amber-600 font-medium text-sm">Mehr erfahren →</span>
  </NuxtLink>
</template>
