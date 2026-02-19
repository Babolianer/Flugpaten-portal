<script setup lang="ts">
import logoImg from '~/assets/images/logo.png'

definePageMeta({ layout: false })
const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-amber-50/80 via-white to-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <!-- Dekorative Hintergrund-Kreise -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-200/20 blur-3xl animate-pulse-slow" />
      <div class="absolute top-1/2 -left-20 w-48 h-48 rounded-full bg-amber-100/30 blur-2xl animate-float-slow" />
      <div class="absolute -bottom-10 right-1/4 w-40 h-40 rounded-full bg-slate-200/20 blur-2xl animate-pulse-slow" style="animation-delay: 1s" />
    </div>

    <div class="relative z-10 w-full max-w-md animate-fade-in">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100/80 mb-4 shadow-inner">
          <img :src="logoImg" alt="" class="h-10 w-10 object-contain" width="40" height="40" />
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 tracking-tight">
          {{ t('app.name') }}
        </h1>
        <p class="text-slate-600 text-sm">
          {{ t('app.tagline') }}
        </p>
      </div>
      <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium mb-4">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {{ t('maintenance.title') }}
        </div>
        <p class="text-slate-600 text-sm mb-8 leading-relaxed">
          {{ t('maintenance.intro') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <NuxtLink
            to="/maintenance/register"
            class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {{ t('nav.register') }}
          </NuxtLink>
          <NuxtLink
            to="/maintenance/login"
            class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-slate-300 hover:border-amber-400 hover:bg-amber-50 text-slate-700 font-semibold text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {{ t('nav.login') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes float-slow {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(6px, -6px); }
}
@keyframes pulse-slow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}
.animate-float-slow {
  animation: float-slow 8s ease-in-out infinite;
}
.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}
</style>
