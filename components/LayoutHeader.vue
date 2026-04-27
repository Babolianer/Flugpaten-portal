<script setup lang="ts">
import logoImg from '~/assets/images/logo.png'
import logoImgHover from '~/assets/images/logo_2.png'

const { user, fetchUser, logout } = useAuth()
const { locale, locales, t, setLocale } = useI18n()
const { topics } = useFlugpateContent()
const mobileMenuOpen = ref(false)
const unreadMessagesCount = ref(0)
const logoHover = ref(false)
const langDropdownOpen = ref(false)
const langDropdownDesktopRef = ref<HTMLElement | null>(null)
const langDropdownMobileRef = ref<HTMLElement | null>(null)

const currentLocale = computed(() => locales.find((l) => l.code === locale.value) ?? locales[0])
const hasKnowledgeTopics = computed(() => topics.value.length > 0)

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function closeLangDropdown() {
  langDropdownOpen.value = false
}

async function selectLocale(code: string) {
  await setLocale(code)
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

async function loadUnreadCount() {
  if (user.value?.role === 'USER') {
    try {
      const res = await $fetch<{ unreadCount: number }>('/api/user/conversations/unread-count')
      unreadMessagesCount.value = res.unreadCount
    } catch {
      unreadMessagesCount.value = 0
    }
    return
  }
  if (user.value?.role === 'ORG_USER') {
    try {
      const res = await $fetch<{ unreadCount: number }>('/api/org/dashboard/conversations/unread-count')
      unreadMessagesCount.value = res.unreadCount
    } catch {
      unreadMessagesCount.value = 0
    }
    return
  }
  unreadMessagesCount.value = 0
}

const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)

function startUnreadPolling() {
  if (pollingInterval.value) return
  pollingInterval.value = setInterval(() => {
    if (document.hidden) return
    if (user.value?.role === 'USER' || user.value?.role === 'ORG_USER') {
      loadUnreadCount()
    }
  }, 10000)
}

function stopUnreadPolling() {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

watch(user, (u) => {
  if (u?.role === 'USER' || u?.role === 'ORG_USER') {
    loadUnreadCount()
    startUnreadPolling()
  } else {
    unreadMessagesCount.value = 0
    stopUnreadPolling()
  }
}, { immediate: true })

const route = useRoute()
watch(() => route.path, () => {
  if (user.value?.role === 'USER' || user.value?.role === 'ORG_USER') loadUnreadCount()
})

/** Desktop: Textlinks in der Kopfzeile */
const navTextClass = 'text-white/95 hover:text-amber-400 transition-colors whitespace-nowrap border-b-2 border-transparent pb-0.5'
const navTextActiveClass = '!text-amber-400 font-semibold border-amber-400'

/** Desktop: Posteingang (Hintergrund-Hover) */
const navInboxClass = 'relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-transparent hover:bg-slate-800 transition-colors whitespace-nowrap'
const navInboxActiveClass = '!bg-slate-800 border-amber-400/80 text-amber-100'

/** Desktop: Profil-Avatar */
const navProfileClass = 'flex items-center justify-center w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 hover:bg-slate-600 hover:border-slate-500 transition-colors shrink-0'
const navProfileActiveClass = '!border-amber-400 ring-2 ring-amber-400/50'

/** Desktop: CTA „Flugpaten werden“ */
const navMapCtaClass = 'px-4 py-2 rounded-lg border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 font-medium transition-colors whitespace-nowrap min-h-[44px] inline-flex items-center justify-center'
const navMapCtaActiveClass = '!bg-amber-400 !text-slate-900'

/** Desktop: Registrieren */
const navRegisterClass = 'px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium transition-colors whitespace-nowrap min-h-[44px] inline-flex items-center justify-center'
const navRegisterActiveClass = '!ring-2 !ring-amber-300 !ring-offset-2 !ring-offset-slate-900'

/** Mobil: Menüzeilen */
const navMobileRowClass = 'py-3 px-4 rounded-lg border-l-4 border-transparent hover:bg-slate-800 text-white font-medium transition-colors'
const navMobileRowActiveClass = '!bg-slate-800 !text-amber-300 !border-amber-400'

const navMobileMapCtaClass = 'inline-flex px-3 py-2 rounded-lg border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 font-medium text-sm transition-colors whitespace-nowrap min-h-[40px] items-center justify-center'
const navMobileMapCtaActiveClass = '!bg-amber-400 !text-slate-900'

const navMobileRegisterClass = 'py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-center mt-2 transition-colors'
const navMobileRegisterActiveClass = '!ring-2 !ring-amber-300 !ring-inset'

onMounted(async () => {
  await fetchUser()
  if (user.value?.role === 'USER' || user.value?.role === 'ORG_USER') {
    loadUnreadCount()
    startUnreadPolling()
  }
})

onUnmounted(() => {
  stopUnreadPolling()
})
</script>

<template>
  <header class="bg-slate-900 text-white shadow-lg sticky top-0 z-40">
    <div class="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 sm:gap-3 text-base sm:text-xl font-bold tracking-tight hover:text-amber-400 transition-colors min-w-0 shrink-0 cursor-pointer rounded-lg"
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
          <span class="text-xs sm:text-sm font-normal text-slate-300">{{ t('app.tagline') }}</span>
        </div>
      </NuxtLink>

      <!-- Desktop nav (ab md): Wissen + Flugpaten werden (Button) -->
      <nav class="hidden md:flex items-center gap-4 lg:gap-6 shrink-0" :aria-label="t('nav.mainMenu')">
        <NuxtLink
          v-if="hasKnowledgeTopics"
          to="/flugpate"
          :class="navTextClass"
          :active-class="navTextActiveClass"
        >{{ t('nav.wissen') }}</NuxtLink>
        <NuxtLink
          to="/orgs-map"
          :class="navTextClass"
          :active-class="navTextActiveClass"
        >{{ t('nav.organisations') }}</NuxtLink>
        <NuxtLink
          to="/map"
          :class="navMapCtaClass"
          :active-class="navMapCtaActiveClass"
        >
          {{ t('nav.flugpatenWerden') }}
        </NuxtLink>
        <template v-if="user">
          <NuxtLink
            v-if="user.role === 'ADMIN'"
            to="/admin"
            :class="navTextClass"
            :active-class="navTextActiveClass"
          >{{ t('nav.admin') }}</NuxtLink>
          <NuxtLink
            v-if="user.role === 'ORG_USER'"
            to="/org/dashboard"
            :class="navTextClass"
            :active-class="navTextActiveClass"
          >{{ t('nav.dashboard') }}</NuxtLink>
          <NuxtLink
            v-if="user.role === 'USER'"
            to="/dashboard"
            :class="navTextClass"
            :active-class="navTextActiveClass"
          >{{ t('nav.dashboard') }}</NuxtLink>
          <NuxtLink
            v-if="user.role === 'ORG_USER'"
            to="/inbox"
            :class="navInboxClass"
            :active-class="navInboxActiveClass"
          >
            <span>{{ t('nav.inbox') }}</span>
            <span
              v-if="unreadMessagesCount > 0"
              class="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-slate-900 text-xs font-bold"
            >
              {{ unreadMessagesCount > 99 ? '99+' : unreadMessagesCount }}
            </span>
          </NuxtLink>
          <NuxtLink
            v-if="user.role === 'USER'"
            to="/inbox"
            :class="navInboxClass"
            :active-class="navInboxActiveClass"
          >
            <span>{{ t('nav.inbox') }}</span>
            <span
              v-if="unreadMessagesCount > 0"
              class="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-slate-900 text-xs font-bold"
            >
              {{ unreadMessagesCount > 99 ? '99+' : unreadMessagesCount }}
            </span>
          </NuxtLink>
          <NuxtLink
            v-if="user.role === 'USER' && user.id"
            :to="`/user/${user.id}`"
            :class="navProfileClass"
            :active-class="navProfileActiveClass"
            :title="t('profile.viewFullProfile')"
            :aria-label="t('profile.viewFullProfile')"
          >
            <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </NuxtLink>
          <span v-else class="text-slate-300 text-sm truncate max-w-[120px] lg:max-w-none">{{ user.displayName }}</span>
          <button
            type="button"
            class="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm whitespace-nowrap"
            @click="logout"
          >
            {{ t('nav.logout') }}
          </button>
        </template>
        <template v-else>
          <NuxtLink
            to="/login"
            :class="navTextClass"
            :active-class="navTextActiveClass"
          >{{ t('nav.login') }}</NuxtLink>
          <NuxtLink
            to="/register"
            :class="navRegisterClass"
            :active-class="navRegisterActiveClass"
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

      <!-- Mobile: Flugpaten werden + Flaggen-Sprachauswahl + Hamburger -->
      <div class="flex md:hidden items-center gap-2 shrink-0">
        <NuxtLink
          to="/map"
          :class="navMobileMapCtaClass"
          :active-class="navMobileMapCtaActiveClass"
          @click="closeMobileMenu"
        >
          {{ t('nav.flugpatenWerden') }}
        </NuxtLink>
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
          <!-- 1. Nachrichten -->
          <NuxtLink
            v-if="user && (user.role === 'ORG_USER')"
            to="/inbox"
            :class="[navMobileRowClass, 'flex items-center justify-between']"
            :active-class="navMobileRowActiveClass"
            @click="closeMobileMenu"
          >
            <span>{{ t('nav.inbox') }}</span>
            <span
              v-if="unreadMessagesCount > 0"
              class="flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-amber-500 text-slate-900 text-sm font-bold"
            >
              {{ unreadMessagesCount > 99 ? '99+' : unreadMessagesCount }}
            </span>
          </NuxtLink>
          <NuxtLink
            v-if="user && user.role === 'USER'"
            to="/inbox"
            :class="[navMobileRowClass, 'flex items-center justify-between']"
            :active-class="navMobileRowActiveClass"
            @click="closeMobileMenu"
          >
            <span>{{ t('nav.inbox') }}</span>
            <span
              v-if="unreadMessagesCount > 0"
              class="flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-amber-500 text-slate-900 text-sm font-bold"
            >
              {{ unreadMessagesCount > 99 ? '99+' : unreadMessagesCount }}
            </span>
          </NuxtLink>
          <!-- 2. Dashboard -->
          <NuxtLink
            v-if="user?.role === 'ADMIN'"
            to="/admin"
            :class="navMobileRowClass"
            :active-class="navMobileRowActiveClass"
            @click="closeMobileMenu"
          >{{ t('nav.admin') }}</NuxtLink>
          <NuxtLink
            v-if="user?.role === 'ORG_USER'"
            to="/org/dashboard"
            :class="navMobileRowClass"
            :active-class="navMobileRowActiveClass"
            @click="closeMobileMenu"
          >{{ t('nav.dashboard') }}</NuxtLink>
          <NuxtLink
            v-if="user?.role === 'USER'"
            to="/dashboard"
            :class="navMobileRowClass"
            :active-class="navMobileRowActiveClass"
            @click="closeMobileMenu"
          >{{ t('nav.dashboard') }}</NuxtLink>
          <!-- 3. Profil -->
          <NuxtLink
            v-if="user?.role === 'USER' && user?.id"
            :to="`/user/${user.id}`"
            :class="[navMobileRowClass, 'flex items-center gap-3']"
            :active-class="navMobileRowActiveClass"
            :aria-label="t('profile.viewFullProfile')"
            @click="closeMobileMenu"
          >
            <span class="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700 border border-slate-600 shrink-0">
              <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            {{ t('profile.viewFullProfile') }}
          </NuxtLink>
          <p v-else-if="user" class="py-2 px-4 text-slate-400 text-sm">{{ user.displayName }}</p>
          <!-- 4. Organisationen -->
          <NuxtLink
            to="/orgs-map"
            :class="navMobileRowClass"
            :active-class="navMobileRowActiveClass"
            @click="closeMobileMenu"
          >{{ t('nav.organisations') }}</NuxtLink>
          <!-- 5. Wissen -->
          <NuxtLink
            v-if="hasKnowledgeTopics"
            to="/flugpate"
            :class="navMobileRowClass"
            :active-class="navMobileRowActiveClass"
            @click="closeMobileMenu"
          >{{ t('nav.wissen') }}</NuxtLink>
          <template v-if="user">
            <button type="button" class="py-3 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-left w-full font-medium mt-2" @click="logout(); closeMobileMenu()">{{ t('nav.logout') }}</button>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              :class="[navMobileRowClass, 'mt-2']"
              :active-class="navMobileRowActiveClass"
              @click="closeMobileMenu"
            >{{ t('nav.login') }}</NuxtLink>
            <NuxtLink
              to="/register"
              :class="navMobileRegisterClass"
              :active-class="navMobileRegisterActiveClass"
              @click="closeMobileMenu"
            >{{ t('nav.register') }}</NuxtLink>
          </template>
        </div>
      </nav>
    </Transition>
  </header>
</template>
