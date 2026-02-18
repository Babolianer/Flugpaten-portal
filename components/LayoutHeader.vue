<script setup lang="ts">
import logoImg from '~/assets/images/logo.png'
import logoImgHover from '~/assets/images/logo_2.png'

const { user, fetchUser, logout } = useAuth()
const { locale, locales, t, setLocale } = useI18n()
const mobileMenuOpen = ref(false)
const logoHover = ref(false)

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

onMounted(fetchUser)
</script>

<template>
  <header class="bg-slate-900 text-white shadow-lg sticky top-0 z-40">
    <div class="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 sm:gap-3 text-base sm:text-xl font-bold tracking-tight hover:text-amber-400 transition-colors min-w-0 shrink-0 cursor-pointer"
        @click="closeMobileMenu"
        @mouseenter="logoHover = true"
        @mouseleave="logoHover = false"
      >
        <img
          :src="logoHover ? logoImgHover : logoImg"
          alt=""
          class="h-10 w-10 sm:h-14 sm:w-14 object-contain shrink-0 transition-opacity duration-150"
          width="56"
          height="56"
        />
        <div class="flex flex-col min-w-0">
          <span class="truncate">{{ t('app.name') }}</span>
          <span class="text-xs sm:text-sm font-normal text-slate-300 hidden sm:block">{{ t('app.tagline') }}</span>
        </div>
      </NuxtLink>

      <!-- Desktop nav (ab md): Wissen + Flugpaten werden (Button) -->
      <nav class="hidden md:flex items-center gap-4 lg:gap-6 shrink-0">
        <NuxtLink to="/flugpate" class="hover:text-amber-400 transition-colors whitespace-nowrap">{{ t('nav.wissen') }}</NuxtLink>
        <NuxtLink to="/orgs-map" class="hover:text-amber-400 transition-colors whitespace-nowrap">{{ t('nav.organisations') }}</NuxtLink>
        <NuxtLink
          to="/map"
          class="px-4 py-2 rounded-lg border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 font-medium transition-colors whitespace-nowrap min-h-[44px] inline-flex items-center justify-center"
        >
          {{ t('nav.flugpatenWerden') }}
        </NuxtLink>
        <template v-if="user">
          <NuxtLink v-if="user.role === 'ADMIN'" to="/admin" class="hover:text-amber-400 transition-colors whitespace-nowrap">{{ t('nav.admin') }}</NuxtLink>
          <NuxtLink v-if="user.role === 'ORG_USER'" to="/org/dashboard" class="hover:text-amber-400 transition-colors whitespace-nowrap">{{ t('nav.dashboard') }}</NuxtLink>
          <NuxtLink v-if="user.role === 'USER'" to="/dashboard" class="hover:text-amber-400 transition-colors whitespace-nowrap">{{ t('nav.dashboard') }}</NuxtLink>
          <span class="text-slate-300 text-sm truncate max-w-[120px] lg:max-w-none">{{ user.displayName }}</span>
          <button
            type="button"
            class="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm whitespace-nowrap"
            @click="logout"
          >
            {{ t('nav.logout') }}
          </button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="hover:text-amber-400 transition-colors whitespace-nowrap">{{ t('nav.login') }}</NuxtLink>
          <NuxtLink
            to="/register"
            class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium transition-colors whitespace-nowrap min-h-[44px] inline-flex items-center justify-center"
          >
            {{ t('nav.register') }}
          </NuxtLink>
        </template>
        <div class="flex items-center gap-1.5 pl-4 ml-2 border-l border-slate-600" role="group" :aria-label="t('nav.language')">
          <select
            :value="locale"
            class="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 min-h-[40px] cursor-pointer"
            @change="setLocale(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="loc in locales" :key="loc.code" :value="loc.code">{{ loc.flagEmoji }} {{ loc.name }}</option>
          </select>
        </div>
      </nav>

      <!-- Mobile: Sprache-Dropdown + Hamburger -->
      <div class="flex md:hidden items-center gap-2">
        <select
          :value="locale"
          class="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-400 min-h-[44px] min-w-[100px] cursor-pointer"
          :aria-label="t('nav.language')"
          @change="setLocale(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="loc in locales" :key="loc.code" :value="loc.code">{{ loc.flagEmoji }} {{ loc.name }}</option>
        </select>
        <button
          type="button"
          class="p-2.5 rounded-lg hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
          :aria-label="mobileMenuOpen ? t('nav.menuClose') : t('nav.menuOpen')"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu (eingeklappt unter Header) -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <nav
        v-show="mobileMenuOpen"
        class="md:hidden border-t border-slate-700 bg-slate-900 overflow-y-auto max-h-[calc(100vh-4rem)]"
        :aria-label="t('nav.mainMenu')"
      >
        <div class="container mx-auto px-4 py-4 flex flex-col gap-1">
          <NuxtLink to="/flugpate" class="py-3 px-4 rounded-lg hover:bg-slate-800 text-white font-medium" @click="closeMobileMenu">{{ t('nav.wissen') }}</NuxtLink>
          <NuxtLink to="/orgs-map" class="py-3 px-4 rounded-lg hover:bg-slate-800 text-white font-medium" @click="closeMobileMenu">{{ t('nav.organisations') }}</NuxtLink>
          <NuxtLink
            to="/map"
            class="py-3 px-4 rounded-lg border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 font-medium text-center mt-1"
            @click="closeMobileMenu"
          >
            {{ t('nav.flugpatenWerden') }}
          </NuxtLink>
          <template v-if="user">
            <NuxtLink v-if="user.role === 'ADMIN'" to="/admin" class="py-3 px-4 rounded-lg hover:bg-slate-800 text-white font-medium" @click="closeMobileMenu">{{ t('nav.admin') }}</NuxtLink>
            <NuxtLink v-if="user.role === 'ORG_USER'" to="/org/dashboard" class="py-3 px-4 rounded-lg hover:bg-slate-800 text-white font-medium" @click="closeMobileMenu">{{ t('nav.dashboard') }}</NuxtLink>
            <NuxtLink v-if="user.role === 'USER'" to="/dashboard" class="py-3 px-4 rounded-lg hover:bg-slate-800 text-white font-medium" @click="closeMobileMenu">{{ t('nav.dashboard') }}</NuxtLink>
            <p class="py-2 px-4 text-slate-400 text-sm">{{ user.displayName }}</p>
            <button type="button" class="py-3 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-left w-full font-medium" @click="logout(); closeMobileMenu()">{{ t('nav.logout') }}</button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="py-3 px-4 rounded-lg hover:bg-slate-800 text-white font-medium" @click="closeMobileMenu">{{ t('nav.login') }}</NuxtLink>
            <NuxtLink to="/register" class="py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-center mt-2" @click="closeMobileMenu">{{ t('nav.register') }}</NuxtLink>
          </template>
        </div>
      </nav>
    </Transition>
  </header>
</template>
