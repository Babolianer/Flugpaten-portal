<script setup lang="ts">
definePageMeta({ layout: false })

const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/maintenance-login', {
      method: 'POST',
      body: { password: password.value },
    })
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Ungültiges Passwort.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <!-- Dekorative Elemente -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-20 left-10 text-8xl opacity-20 animate-bounce" style="animation-duration: 2s">🐕</div>
      <div class="absolute top-40 right-20 text-6xl opacity-20 animate-bounce" style="animation-duration: 2.5s; animation-delay: 0.3s">🐈</div>
      <div class="absolute bottom-32 left-1/4 text-7xl opacity-20 animate-bounce" style="animation-duration: 2.2s; animation-delay: 0.5s">✈️</div>
      <div class="absolute bottom-40 right-1/4 text-6xl opacity-20 animate-pulse">🔧</div>
    </div>

    <div class="relative z-10 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-4xl sm:text-5xl font-black text-slate-800 mb-2 tracking-tight">
          Wir sind gleich wieder da!
        </h1>
        <p class="text-lg text-slate-600">
          Die Flugpaten-Bühne wird gerade geputzt. 🧹
        </p>
      </div>

      <div class="bg-white/90 backdrop-blur rounded-3xl shadow-2xl border-2 border-amber-200/50 p-8 sm:p-10">
        <p class="text-center text-slate-600 mb-6">
          Nur mit Berechtigung kannst du während der Wartung weiter.
        </p>
        <form @submit.prevent="submit" class="space-y-5">
          <div v-if="error" class="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
            {{ error }}
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Passwort</label>
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              placeholder="••••••••••"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {{ loading ? 'Wird geladen …' : '🔓 Zugang anfordern' }}
          </button>
        </form>
      </div>

    </div>
  </div>
</template>
