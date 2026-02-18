<script setup lang="ts">
import logoImg from '~/assets/images/logo.png'

const { t } = useI18n()

const year = new Date().getFullYear()
const copyright = computed(() => t('footer.copyright').replace('{year}', String(year)))

const linkGroups = computed(() => [
  {
    label: null,
    links: [
      { to: '/org/register', label: t('footer.forOrgs') },
      { to: '/register', label: t('footer.becomePatron') },
      { to: '/flugpate', label: t('home.heroCtaSecondary') },
    ],
  },
  {
    label: null,
    links: [
      { to: '/kontakt', label: t('footer.contact') },
      { to: '/impressum', label: t('footer.impressum') },
      { to: '/datenschutz', label: t('footer.datenschutz') },
    ],
  },
])
</script>

<template>
  <footer class="bg-slate-900 text-slate-300 mt-auto">
    <div class="container mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-14">
      <!-- Oben: Logo + Link-Spalten -->
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-12">
        <div class="flex flex-col gap-4">
          <NuxtLink
            to="/"
            class="flex items-center gap-2 font-semibold text-white hover:text-amber-400 transition-colors w-fit"
          >
            <img :src="logoImg" alt="" class="h-10 w-10 object-contain" width="40" height="40" />
            {{ t('app.name') }} – {{ t('app.tagline') }}
          </NuxtLink>
        </div>
        <nav
          class="flex flex-wrap gap-x-12 gap-y-8 sm:gap-y-6"
          aria-label="Footer"
        >
          <div v-for="(group, gi) in linkGroups" :key="gi" class="flex flex-col gap-3">
            <div class="flex flex-col gap-2">
              <NuxtLink
                v-for="link in group.links"
                :key="link.to"
                :to="link.to"
                class="text-sm text-slate-300 hover:text-amber-400 transition-colors w-fit"
              >
                {{ link.label }}
              </NuxtLink>
            </div>
          </div>
        </nav>
      </div>
      <!-- Unten: Copyright -->
      <div class="mt-10 pt-8 border-t border-slate-700/60">
        <p class="text-sm text-slate-500">
          {{ copyright }}
        </p>
      </div>
    </div>
  </footer>
</template>
