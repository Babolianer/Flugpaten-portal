<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const userId = route.params.id as string
const { user } = useAuth()
const { t } = useI18n()

interface ProfileData {
  user: {
    id: string
    displayName: string
    profile: {
      avatarUrl: string | null
      city: string | null
      countryCode: string | null
      aboutMe: string | null
      languages: string[]
      preferredRoutes: string[]
      frequentAirports: string[]
    } | null
    emailVerified: boolean
    phoneVerified: boolean
  }
  stats: {
    completedFlightsCount: number
    transportedAnimalsCount: number
    averageRating: number | null
    reviewsCount: number
  }
  reviews: Array<{
    id: string
    rating: number
    comment: string | null
    createdAt: string
    reviewerName: string
    requestTitle: string | null
    route: string | null
  }>
}

const { data, error } = await useFetch<ProfileData>(`/api/user/${userId}/profile`)
const profileData = computed(() => data.value as ProfileData | undefined)
const isOwnProfile = computed(() => Boolean(user.value?.id && profileData.value?.user?.id && user.value.id === profileData.value.user.id))

if (error.value) throw createError({ statusCode: 404 })

function starDisplay(rating: number) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return { full, half, empty }
}
</script>

<template>
  <div v-if="profileData" class="container mx-auto w-4/5 max-w-full px-4 sm:px-6 py-6 sm:py-8">
    <div class="max-w-2xl mx-auto">
      <div class="flex flex-col sm:flex-row gap-6 items-start">
        <div class="shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-slate-200 border-2 border-slate-300">
          <img
            v-if="profileData.user.profile?.avatarUrl"
            :src="profileData.user.profile.avatarUrl"
            :alt="profileData.user.displayName"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-4xl text-slate-500">
            {{ profileData.user.displayName.charAt(0).toUpperCase() }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-slate-900">{{ profileData.user.displayName }}</h1>
            <NuxtLink
              v-if="isOwnProfile"
              to="/profile-settings"
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              :title="t('profile.editProfile')"
              :aria-label="t('profile.editProfile')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </NuxtLink>
          </div>
          <p
            v-if="profileData.user.profile?.city || profileData.user.profile?.countryCode"
            class="text-slate-600 mt-1"
          >
            {{ [profileData.user.profile?.city, profileData.user.profile?.countryCode].filter(Boolean).join(', ') }}
          </p>
          <div class="flex flex-wrap gap-3 mt-3">
            <span
              v-if="profileData.stats.averageRating != null"
              class="inline-flex items-center gap-1 text-amber-600 font-medium"
            >
              <span v-for="i in starDisplay(profileData.stats.averageRating).full" :key="'f'+i">★</span>
              <span v-if="starDisplay(profileData.stats.averageRating).half">½</span>
              <span v-for="i in starDisplay(profileData.stats.averageRating).empty" :key="'e'+i" class="text-slate-300">★</span>
              {{ profileData.stats.averageRating.toFixed(1) }} ({{ profileData.stats.reviewsCount }} {{ t('profile.reviews') }})
            </span>
            <span class="text-slate-600">
              {{ profileData.stats.completedFlightsCount }} {{ t('profile.completedFlights') }}
            </span>
            <span class="text-slate-600">
              {{ profileData.stats.transportedAnimalsCount }} {{ t('profile.transportedAnimals') }}
            </span>
          </div>
          <div class="flex gap-2 mt-2">
            <span v-if="profileData.user.emailVerified" class="text-xs px-2 py-1 rounded bg-green-100 text-green-800" title="E-Mail verifiziert">✓ E-Mail</span>
            <span v-if="profileData.user.phoneVerified" class="text-xs px-2 py-1 rounded bg-green-100 text-green-800" title="Telefon verifiziert">✓ Telefon</span>
          </div>
        </div>
      </div>

      <div v-if="profileData.user.profile?.aboutMe" class="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <h2 class="font-semibold text-slate-900 mb-2">{{ t('profile.aboutMe') }}</h2>
        <p class="text-slate-700 whitespace-pre-wrap">{{ profileData.user.profile.aboutMe }}</p>
      </div>

      <div v-if="profileData.user.profile?.languages?.length" class="mt-4">
        <h2 class="font-semibold text-slate-900 mb-2">{{ t('profile.languages') }}</h2>
        <p class="text-slate-600">{{ profileData.user.profile.languages.join(', ') }}</p>
      </div>

      <div v-if="profileData.user.profile?.frequentAirports?.length" class="mt-4">
        <h2 class="font-semibold text-slate-900 mb-2">{{ t('profile.frequentAirports') }}</h2>
        <p class="text-slate-600">{{ profileData.user.profile.frequentAirports.join(', ') }}</p>
      </div>

      <div v-if="profileData.reviews.length" class="mt-8">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">{{ t('profile.reviewsSection') }}</h2>
        <div class="space-y-4">
          <div
            v-for="review in profileData.reviews"
            :key="review.id"
            class="p-4 rounded-xl bg-white border border-slate-200"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-amber-500">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span>
              <span class="text-sm text-slate-600">{{ review.reviewerName }}</span>
              <span v-if="review.route" class="text-xs text-slate-500">· {{ review.route }}</span>
            </div>
            <p v-if="review.comment" class="text-slate-700 text-sm">{{ review.comment }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
