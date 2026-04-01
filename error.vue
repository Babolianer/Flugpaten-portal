<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError,
})

const { user, fetchUser } = useAuth()

const is404 = computed(() => Number(props.error?.statusCode) === 404)

const primaryTarget = computed(() => {
  if (!user.value) {
    return { to: '/register', label: 'Jetzt registrieren' }
  }
  if (user.value.role === 'ADMIN') {
    return { to: '/admin', label: 'Zum Admin-Bereich' }
  }
  if (user.value.role === 'ORG_USER') {
    return { to: '/org/dashboard', label: 'Zum Organisations-Dashboard' }
  }
  return { to: '/dashboard', label: 'Zum Dashboard' }
})

const secondaryTarget = computed(() => {
  if (!user.value) {
    return { to: '/map', label: 'Flugpate werden (Karte)' }
  }
  return { to: '/map', label: 'Zur Transportkarte' }
})

const countdown = ref(8)
let timer: ReturnType<typeof setInterval> | null = null

function goTo(path: string) {
  clearError({ redirect: path })
}

onMounted(async () => {
  await fetchUser()

  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      if (timer) clearInterval(timer)
      goTo(primaryTarget.value.to)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
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
              ? 'Vielleicht ist der Link veraltet oder falsch geschrieben. Wir bringen dich auf einen passenden Bereich zurueck.'
              : (error?.statusMessage || 'Bitte versuche es erneut.')
          }}
        </p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            class="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold transition-colors"
            @click="goTo(primaryTarget.to)"
          >
            {{ primaryTarget.label }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
            @click="goTo(secondaryTarget.to)"
          >
            {{ secondaryTarget.label }}
          </button>
        </div>

        <p class="mt-6 text-sm text-slate-500">
          Automatische Weiterleitung in {{ countdown }}s...
        </p>
      </section>
    </main>
  </NuxtLayout>
</template>
