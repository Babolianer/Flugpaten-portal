<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  visible: boolean
  priceVisible: boolean
  expanded: boolean
}>()
</script>

<template>
  <div class="w-full max-w-lg mx-auto">
    <!-- Glass card -->
    <div
      class="rounded-[24px] overflow-hidden shadow-2xl border border-white/40 backdrop-blur-xl bg-white/70 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      :class="[
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-98',
        expanded ? 'ring-4 ring-amber-200/60' : ''
      ]"
    >
      <!-- Animal image (cat placeholder) -->
      <div class="aspect-video bg-gradient-to-br from-amber-100 to-slate-200 flex items-center justify-center">
        <span class="text-6xl opacity-70" aria-hidden="true">🐱</span>
      </div>

      <div class="p-6 md:p-8">
        <!-- Route -->
        <div class="flex items-center gap-2 text-slate-600 mb-2">
          <span class="font-medium">MUC</span>
          <span class="text-amber-500">→</span>
          <span class="font-medium">ZRH</span>
        </div>
        <div class="text-sm text-slate-500 mb-4">
          {{ new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }}
        </div>
        <div class="text-sm text-slate-600 mb-4">
          Tierschutz Verein e.V.
        </div>

        <!-- Price block -->
        <div
          class="mt-6 pt-6 border-t border-slate-200/80 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          :class="priceVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 h-0 mt-0 pt-0 overflow-hidden'"
        >
          <p class="text-slate-600 text-sm mb-1">{{ t('home.step2Cost') }}</p>
          <p class="text-4xl md:text-5xl font-bold text-amber-600 cost-glow">
            0 €
          </p>
          <p class="text-slate-500 text-sm mt-2">
            {{ t('home.step2CostFree') }}
          </p>
        </div>

        <!-- View details -->
        <button
          type="button"
          class="mt-6 w-full py-3 px-4 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors text-sm"
        >
          {{ t('home.step2ViewDetails') }}
        </button>

        <!-- Expanded description -->
        <div
          class="mt-4 p-4 rounded-xl bg-slate-50/80 text-slate-600 text-sm leading-relaxed transition-all duration-500 overflow-hidden"
          :class="expanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 p-0 mt-0'"
        >
          {{ t('home.step2DetailsText') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scale-98 {
  transform: scale(0.98);
}

.cost-glow {
  text-shadow: 0 0 24px rgba(245, 158, 11, 0.35);
  animation: costPulse 2s ease-in-out infinite;
}

@keyframes costPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
}
</style>
