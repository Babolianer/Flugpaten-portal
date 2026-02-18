<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  planeScene: boolean
  silhouetteScene: boolean
  familyScene: boolean
}>()
</script>

<template>
  <div class="relative w-full max-w-2xl mx-auto aspect-[4/3] flex items-center justify-center">
    <!-- Scene 1: Airplane flying across -->
    <div
      class="absolute inset-0 flex items-center justify-center transition-opacity duration-700"
      :class="planeScene ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <div class="plane-crossing w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 24 24" class="w-24 h-24 md:w-32 md:h-32 text-slate-600/90 drop-shadow-xl" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      </div>
    </div>

    <!-- Scene 2: Silhouette person + pet carrier -->
    <div
      class="absolute inset-0 flex items-center justify-center transition-opacity duration-700"
      :class="silhouetteScene ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <div class="flex flex-col items-center gap-4">
        <svg class="w-32 h-40 md:w-40 md:h-48 text-slate-700" viewBox="0 0 80 100" fill="currentColor" aria-hidden="true">
          <ellipse cx="40" cy="18" rx="12" ry="14" />
          <path d="M 28 32 L 28 70 Q 40 78 52 70 L 52 32 Z" />
          <rect x="36" y="70" width="8" height="20" rx="2" />
          <rect x="24" y="58" width="10" height="24" rx="4" />
          <rect x="46" y="58" width="10" height="24" rx="4" />
          <!-- Carrier -->
          <rect x="32" y="88" width="16" height="14" rx="4" opacity="0.9" />
          <circle cx="40" cy="95" r="3" />
        </svg>
        <p class="text-slate-600 text-sm font-medium">{{ t('home.step3YouAndCarrier') }}</p>
      </div>
    </div>

    <!-- Scene 3: Happy family + cat, emotional glow -->
    <div
      class="absolute inset-0 flex items-center justify-center transition-opacity duration-700"
      :class="familyScene ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <div class="family-glow rounded-[24px] p-8 md:p-12 bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl text-center">
        <div class="flex justify-center gap-4 mb-4">
          <span class="text-5xl md:text-6xl">👨</span>
          <span class="text-5xl md:text-6xl">👩</span>
          <span class="text-5xl md:text-6xl">🐱</span>
          <span class="text-5xl md:text-6xl">👶</span>
        </div>
        <p class="text-slate-700 font-semibold text-lg">{{ t('home.step3NewHome') }}</p>
        <p class="text-slate-500 text-sm mt-1">{{ t('home.step3FamilyReceives') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plane-crossing svg {
  animation: planeCross 3s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

@keyframes planeCross {
  0% {
    transform: translateX(-120%) translateY(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translateX(120%) translateY(-20px);
    opacity: 0;
  }
}

.family-glow {
  animation: emotionalGlow 3s ease-in-out infinite;
}

@keyframes emotionalGlow {
  0%, 100% {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5);
  }
  50% {
    box-shadow: 0 25px 50px -12px rgba(245, 158, 11, 0.15), 0 0 40px -10px rgba(245, 158, 11, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5);
  }
}
</style>
