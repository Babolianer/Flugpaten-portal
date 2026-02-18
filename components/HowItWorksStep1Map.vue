<script setup lang="ts">
const { t } = useI18n()

const transportTag = t('home.step1MapTag')

defineProps<{
  revealed: boolean
  cursorVisible: boolean
  routeDrawn: boolean
  planeFlying: boolean
  tagVisible: boolean
}>()
</script>

<template>
  <div class="relative w-full aspect-[4/3] max-w-xl mx-auto">
    <!-- Glassmorphism map container -->
    <div
      class="absolute inset-0 rounded-[24px] overflow-hidden shadow-2xl border border-white/20 backdrop-blur-xl bg-white/10 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
      :class="[
        revealed ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-md'
      ]"
    >
      <!-- Map style background (minimal map tiles look) -->
      <div class="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-amber-50/50">
        <div class="absolute inset-0 opacity-30" style="background-image: url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\'/%3E%3Cpath d=\'M20 0v40M0 20h40\' stroke=\'%2394a3b8\' stroke-width=\'.5\'/%3E%3C/svg%3E');" />
      </div>

      <!-- Simplified landmass shapes (abstract) -->
      <svg class="absolute inset-0 w-full h-full text-slate-200/80" viewBox="0 0 400 300" fill="currentColor" aria-hidden="true">
        <ellipse cx="120" cy="140" rx="90" ry="70" />
        <ellipse cx="280" cy="120" rx="70" ry="55" />
        <path d="M180 180 Q220 120 280 160 Q320 200 360 180" opacity="0.6" />
      </svg>

      <!-- Route line (MUC → ZRH) -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300">
        <path
          id="route-path"
          d="M 100 180 Q 200 80 300 120"
          fill="none"
          stroke="rgb(245 158 11)"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="320"
          class="transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
          :style="{ strokeDashoffset: routeDrawn ? 0 : 320 }"
        />
      </svg>

      <!-- Airport pins -->
      <div
        class="absolute w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-lg"
        style="left: 22%; top: 58%;"
      />
      <div
        class="absolute w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-lg"
        style="right: 22%; top: 38%;"
      />
      <div class="absolute text-xs font-medium text-slate-600 bg-white/90 px-2 py-1 rounded-lg shadow-sm" style="left: 18%; top: 52%;">
        MUC
      </div>
      <div class="absolute text-xs font-medium text-slate-600 bg-white/90 px-2 py-1 rounded-lg shadow-sm" style="right: 18%; top: 32%;">
        ZRH
      </div>

      <!-- Simulated cursor: moves to MUC, “clicks”, then stays -->
      <div
        v-show="cursorVisible"
        class="cursor-at-muc absolute w-6 h-6 pointer-events-none z-20"
      >
        <svg viewBox="0 0 24 24" class="w-6 h-6 text-slate-800 drop-shadow-lg" fill="currentColor">
          <path d="M5 3l14 9-6 1-3 8z" />
        </svg>
      </div>

      <!-- Search bar mock -->
      <div class="absolute top-4 left-4 right-4 h-10 rounded-xl bg-white/90 shadow-md flex items-center px-4 text-slate-400 text-sm">
        <span>Search route, date, animal type...</span>
      </div>
    </div>

    <!-- Airplane flying along route (overlay) -->
    <div
      v-show="planeFlying"
      class="absolute inset-0 w-full h-full pointer-events-none rounded-[24px] overflow-visible"
      style="aspect-ratio: 4/3;"
    >
      <div class="plane-along-path absolute w-8 h-8" style="left: 22%; top: 58%;">
        <svg viewBox="0 0 24 24" class="w-full h-full text-slate-700 drop-shadow-md -rotate-45" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      </div>
    </div>

    <!-- Floating tag -->
    <div
      class="absolute -top-2 right-0 md:right-4 px-4 py-2 rounded-2xl bg-amber-400/95 backdrop-blur text-slate-900 font-semibold text-sm shadow-lg border border-amber-300/50 transition-all duration-500 ease-out"
      :class="tagVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'"
    >
      {{ transportTag }}
    </div>
  </div>
</template>

<style scoped>
/* Cursor: start left, move to MUC, small “click” at Munich */
.cursor-at-muc {
  left: 10%;
  top: 45%;
  animation: cursorToMuc 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes cursorToMuc {
  0% {
    left: 10%;
    top: 45%;
    opacity: 0;
    transform: scale(1);
  }
  15% {
    opacity: 1;
  }
  55% {
    left: 18%;
    top: 54%;
    opacity: 1;
    transform: scale(1);
  }
  60% {
    transform: scale(0.88);
  }
  65% {
    transform: scale(1);
  }
  100% {
    left: 18%;
    top: 54%;
    opacity: 1;
    transform: scale(1);
  }
}

.plane-along-path {
  animation: planeFly 2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes planeFly {
  0% {
    left: 22%;
    top: 58%;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    left: 72%;
    top: 32%;
    opacity: 1;
  }
}
</style>
