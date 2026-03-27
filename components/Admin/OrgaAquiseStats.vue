<script setup lang="ts">
interface Props {
  stats: {
    total: number
    nichtKontaktiert: number
    keineAntwort: number
    interessiert: number
    overdueFollowUps: number
    conversionPct: number
  } | null
  loading?: boolean
}
defineProps<Props>()
const { t } = useI18n()
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
    <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ t('admin.orgaAquise.statsTitle') }}</h2>
    <div v-if="loading" class="text-slate-600 text-sm">{{ t('admin.loading') }}</div>
    <div v-else-if="stats" class="grid grid-cols-2 sm:grid-cols-5 gap-4">
      <div class="rounded-lg bg-slate-50 p-3">
        <div class="text-2xl font-bold text-slate-900">{{ stats.total }}</div>
        <div class="text-sm text-slate-600">{{ t('admin.orgaAquise.statsTotal') }}</div>
      </div>
      <div class="rounded-lg bg-amber-50 p-3">
        <div class="text-2xl font-bold text-amber-800">{{ stats.nichtKontaktiert }}</div>
        <div class="text-sm text-slate-600">{{ t('admin.orgaAquise.statsNichtKontaktiert') }}</div>
      </div>
      <div class="rounded-lg bg-orange-50 p-3">
        <div class="text-2xl font-bold text-orange-800">{{ stats.keineAntwort }}</div>
        <div class="text-sm text-slate-600">{{ t('admin.orgaAquise.statsKeineAntwort') }}</div>
      </div>
      <div class="rounded-lg bg-emerald-50 p-3">
        <div class="text-2xl font-bold text-emerald-800">{{ stats.interessiert }}</div>
        <div class="text-sm text-slate-600">{{ t('admin.orgaAquise.statsInteressiert') }}</div>
      </div>
      <div class="rounded-lg p-3" :class="stats.overdueFollowUps > 0 ? 'bg-red-50' : 'bg-slate-50'">
        <div class="text-2xl font-bold" :class="stats.overdueFollowUps > 0 ? 'text-red-700' : 'text-slate-900'">
          {{ stats.overdueFollowUps }}
        </div>
        <div class="text-sm text-slate-600">{{ t('admin.orgaAquise.statsOverdue') }}</div>
      </div>
    </div>
    <div v-if="stats && stats.total > 0" class="mt-4 pt-4 border-t border-slate-200">
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-600">{{ t('admin.orgaAquise.conversionLabel') }}</span>
        <span class="text-sm font-medium text-slate-800">{{ stats.conversionPct }}%</span>
        <span class="text-xs text-slate-500">({{ stats.interessiert }}/{{ stats.total }})</span>
      </div>
    </div>
  </section>
</template>
