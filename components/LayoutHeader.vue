<script setup lang="ts">
import logoImg from '~/assets/images/logo.png'
import logoImgHover from '~/assets/images/logo_2.png'

const { user, fetchUser, logout } = useAuth()
const { locale, locales, t, setLocale } = useI18n()
const mobileMenuOpen = ref(false)
const logoHover = ref(false)
const langDropdownOpen = ref(false)
const langDropdownDesktopRef = ref<HTMLElement | null>(null)
const langDropdownMobileRef = ref<HTMLElement | null>(null)

const currentLocale = computed(() => locales.find((l) => l.code === locale.value) ?? locales[0])

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function closeLangDropdown() {
  langDropdownOpen.value = false
}

function selectLocale(code: string) {
  setLocale(code)
  closeLangDropdown()
}

watch(langDropdownOpen, (isOpen) => {
  if (!import.meta.client || !isOpen) return
  const handler = (e: MouseEvent) => {
    const target = e.target as Node
    const inDesktop = langDropdownDesktopRef.value?.contains(target)
    const inMobile = langDropdownMobileRef.value?.contains(target)
    if (!inDesktop && !inMobile) {
      langDropdownOpen.value = false
      document.removeEventListener('click', handler)
    }
  }
  setTimeout(() => document.addEventListener('click', handler), 0)
})

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
        <div ref="langDropdownDesktopRef" class="relative flex items-center pl-4 ml-2 border-l border-slate-600" role="group" :aria-label="t('nav.language')">
          <button
            type="button"
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700 focus:ring-2 focus:ring-amber-400 cursor-pointer overflow-hidden"
            :aria-expanded="langDropdownOpen"
            :aria-haspopup="true"
            @click.stop="langDropdownOpen = !langDropdownOpen"
          >
            <img
              :src="`https://flagcdn.com/w40/${currentLocale.flagCountry}.png`"
              :alt="currentLocale.name"
              class="w-7 h-5 object-cover rounded-sm"
              loading="eager"
              width="28"
              height="20"
            />
          </button>
          <Transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-show="langDropdownOpen"
              class="absolute right-0 top-full mt-1 py-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[160px]"
            >
              <button
                v-for="loc in locales"
                :key="loc.code"
                type="button"
                class="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors"
                :class="{ 'bg-slate-700': locale === loc.code }"
                @click="selectLocale(loc.code)"
              >
                <img
                  :src="`https://flagcdn.com/w40/${loc.flagCountry}.png`"
                  :alt="loc.name"
                  class="w-7 h-5 object-cover rounded-sm shrink-0"
                  loading="lazy"
                  width="28"
                  height="20"
                />
                {{ loc.name }}
              </button>
            </div>
          </Transition>
        </div>
      </nav>

      <!-- Mobile: Flaggen-Sprachauswahl + Hamburger -->
      <div class="flex md:hidden items-center gap-2">
        <div ref="langDropdownMobileRef" class="relative" role="group" :aria-label="t('nav.language')">
          <button
            type="button"
            class="flex items-center justify-center w-11 h-11 rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700 focus:ring-2 focus:ring-amber-400 cursor-pointer min-h-[44px] min-w-[44px] overflow-hidden"
            :aria-expanded="langDropdownOpen"
            :aria-haspopup="true"
            @click.stop="langDropdownOpen = !langDropdownOpen"
          >
            <img
              :src="`https://flagcdn.com/w40/${currentLocale.flagCountry}.png`"
              :alt="currentLocale.name"
              class="w-8 h-6 object-cover rounded-sm"
              loading="eager"
              width="32"
              height="24"
            />
          </button>
          <Transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-show="langDropdownOpen"
              class="absolute right-0 top-full mt-1 py-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[160px]"
            >
              <button
                v-for="loc in locales"
                :key="loc.code"
                type="button"
                class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-slate-700 transition-colors"
                :class="{ 'bg-slate-700': locale === loc.code }"
                @click="selectLocale(loc.code)"
              >
                <img
                  :src="`https://flagcdn.com/w40/${loc.flagCountry}.png`"
                  :alt="loc.name"
                  class="w-7 h-5 object-cover rounded-sm shrink-0"
                  loading="lazy"
                  width="28"
                  height="20"
                />
                {{ loc.name }}
              </button>
            </div>
          </Transition>
        </div>
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
