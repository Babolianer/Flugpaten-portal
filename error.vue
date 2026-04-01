<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError,
})

const is404 = computed(() => Number(props.error?.statusCode) === 404)

function goTo(path: string) {
  clearError({ redirect: path })
}
</script>

<template>
  <NuxtLayout>
    <main class="min-h-[70vh] px-4 py-16 sm:py-24 flex items-center justify-center">
      <section class="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-lg p-6 sm:p-10 text-center">
        <p class="text-sm font-semibold uppercase tracking-wide text-amber-600 mb-3">
          {{ is404 ? '404 - Seite nicht gefunden' : `Fehler ${error?.statusCode || ''}` }}
        </p>

        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
          {{ is404 ? 'Diese Seite gibt es nicht (mehr).' : 'Es ist ein Fehler aufgetreten.' }}
        </h1>

        <p class="text-slate-600 mb-8">
          {{
            is404
              ? 'Vielleicht ist der Link veraltet oder falsch geschrieben.'
              : (error?.statusMessage || 'Bitte versuche es erneut.')
          }}
        </p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            class="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold transition-colors"
            @click="goTo('/')"
          >
            Zur Startseite
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
            @click="goTo('/map')"
          >
            Zur Karte
          </button>
        </div>
      </section>
    </main>
  </NuxtLayout>
</template>
