<script setup lang="ts">
const { t } = useI18n()
const { topics } = useFlugpateContent()

const props = defineProps<{
  currentSlug?: string
  title?: string
}>()
</script>

<template>
  <nav class="flugpate-guide-nav" :aria-label="t('flugpate.navAriaLabel')">
    <h2 v-if="title" class="text-lg font-semibold text-slate-800 mb-3">
      {{ title || t('flugpate.topicsTitle') }}
    </h2>
    <ul class="space-y-1">
      <li v-for="topic in topics" :key="topic.slug">
        <NuxtLink
          :to="`/flugpate/${topic.slug}`"
          class="flex items-center min-h-[44px] py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-sm break-words"
          :class="currentSlug === topic.slug ? 'bg-amber-50 text-amber-900 font-medium' : ''"
        >
          {{ topic.title }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
