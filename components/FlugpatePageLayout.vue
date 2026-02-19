<script setup lang="ts">
const props = defineProps<{
  slug: string
}>()

const { t } = useI18n()
const { getPageContent } = useFlugpateContent()

const content = computed(() => getPageContent(props.slug))

const pageTitle = computed(() => t(`flugpate.topics.${props.slug}.title`))

watchEffect(() => {
  const c = content.value
  if (c?.meta) {
    useHead({
      title: c.meta.title,
      meta: [
        { name: 'description', content: c.meta.description },
        { property: 'og:title', content: c.meta.ogTitle || c.meta.title },
        { property: 'og:description', content: c.meta.ogDescription || c.meta.description },
        { property: 'og:type', content: 'article' },
      ],
    })
  }
})
</script>

<template>
  <div v-if="content" class="bg-slate-50 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <div class="flex flex-col lg:flex-row gap-10">
        <aside class="lg:w-64 shrink-0">
          <div class="sticky top-24 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <FlugpatenGuideNavigation :current-slug="slug" />
          </div>
        </aside>
        <main class="flex-1 min-w-0">
          <h1 class="text-3xl font-bold text-slate-900 mb-6">
            {{ pageTitle }}
          </h1>
          <FlugpatenContentBlock :sections="content.sections" />
          <FlugpatenFaq v-if="content.faqs?.length" :faqs="content.faqs" class="mt-12" />
          <div class="mt-12 p-6 bg-amber-50 rounded-xl border border-amber-100">
            <p class="font-medium text-slate-800 mb-3">{{ t('flugpate.ctaNowTitle') }}</p>
            <div class="flex flex-wrap gap-3">
              <NuxtLink
                to="/register"
                class="inline-flex items-center px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium"
              >
                {{ t('flugpate.ctaNowRegister') }}
              </NuxtLink>
              <NuxtLink
                to="/flugpate"
                class="inline-flex items-center px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium"
              >
                {{ t('flugpate.ctaBackToOverview') }}
              </NuxtLink>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
