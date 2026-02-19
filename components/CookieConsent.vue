<script setup lang="ts">
const { t } = useI18n()
const { setConsent, shouldShowBanner, forceShowBanner } = useCookieConsent()

const visible = ref(false)
const mounted = ref(false)

function accept() {
  setConsent('accepted')
  visible.value = false
  const { loadAnalytics } = useAnalytics()
  loadAnalytics()
}

function decline() {
  setConsent('declined')
  visible.value = false
  if (import.meta.client && typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: 'denied' })
  }
}

function updateVisible() {
  visible.value = shouldShowBanner()
}

onMounted(() => {
  mounted.value = true
  nextTick(updateVisible)
})

watch(forceShowBanner, updateVisible)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="mounted && visible"
        class="fixed inset-x-0 bottom-0 z-[9999] px-4 py-4 sm:px-6 sm:py-5"
        role="dialog"
        aria-live="polite"
        aria-label="Cookie-Hinweis"
      >
        <div
          class="mx-auto max-w-4xl rounded-2xl bg-slate-800/95 backdrop-blur-md shadow-2xl border border-slate-700/50 px-4 py-4 sm:px-6 sm:py-5"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm sm:text-base text-slate-200 leading-relaxed">
                {{ t('cookie.text') }}
                <NuxtLink
                  to="/datenschutz"
                  class="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800 rounded"
                >
                  {{ t('cookie.privacyLink') }}
                </NuxtLink>
                {{ t('cookie.textSuffix') }}
              </p>
            </div>
            <div class="flex flex-shrink-0 flex-wrap gap-3">
              <NuxtLink
                to="/datenschutz"
                class="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                {{ t('cookie.moreInfo') }}
              </NuxtLink>
              <button
                type="button"
                class="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                @click="decline"
              >
                {{ t('cookie.decline') }}
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                @click="accept"
              >
                {{ t('cookie.accept') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
