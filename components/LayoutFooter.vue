<script setup lang="ts">
import logoImg from '~/assets/images/logo.png'

const { t } = useI18n()
const { user } = useAuth()
const { openSettings } = useCookieConsent()
const { topics } = useFlugpateContent()

const year = new Date().getFullYear()
const copyright = computed(() => t('footer.copyright').replace('{year}', String(year)))

const linkGroups = computed(() => {
  const hasKnowledgeTopics = topics.value.length > 0
  const mitmachen = [
    ...(user.value ? [] : [
      { to: '/org/register', label: t('footer.forOrgs') },
      { to: '/register', label: t('footer.becomePatron') },
    ]),
    ...(hasKnowledgeTopics ? [{ to: '/flugpate', label: t('home.heroCtaSecondary') }] : []),
  ]
  return [
    { label: t('footer.mitmachen'), links: mitmachen },
    { label: t('footer.rechtliches'), links: [
      { to: '/kontakt', label: t('footer.contact') },
      { to: '/impressum', label: t('footer.impressum') },
      { to: '/datenschutz', label: t('footer.datenschutz') },
      { to: '/nutzungsbedingungen', label: t('footer.nutzungsbedingungen') },
      { isAction: true, label: t('footer.cookieSettings'), action: 'openCookieSettings' },
    ]},
  ]
})
</script>

<template>
  <footer class="bg-slate-900 text-slate-300 mt-auto">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 md:py-16">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 lg:gap-16">
        <!-- Logo + Brand -->
        <div class="flex flex-col gap-4 max-w-xs">
          <NuxtLink
            to="/"
            class="flex items-start gap-3 font-semibold text-white hover:text-amber-400 transition-colors w-full max-w-xs min-w-0 group"
          >
            <img :src="logoImg" alt="" class="h-11 w-11 shrink-0 object-contain group-hover:opacity-90 transition-opacity" width="44" height="44" />
            <span class="min-w-0 break-words text-left leading-snug">{{ t('app.name') }} – {{ t('app.tagline') }}</span>
          </NuxtLink>
          <p class="text-sm text-slate-500 leading-relaxed">
            {{ t('footer.tagline') }}
          </p>
        </div>
        <!-- Link-Spalten -->
        <nav class="flex flex-wrap gap-x-12 gap-y-8 sm:gap-x-16" aria-label="Footer">
          <div v-for="(group, gi) in linkGroups" :key="gi" class="flex flex-col gap-4">
            <span v-if="group.label" class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ group.label }}
            </span>
            <div class="flex flex-col gap-3">
              <template v-for="link in group.links" :key="'to' in link ? link.to : link.label">
                <NuxtLink
                  v-if="!('isAction' in link && link.isAction)"
                  :to="(link as { to: string }).to"
                  class="text-sm text-slate-400 hover:text-amber-400 transition-colors w-fit"
                >
                  {{ link.label }}
                </NuxtLink>
                <button
                  v-else
                  type="button"
                  class="text-sm text-slate-400 hover:text-amber-400 transition-colors w-fit text-left"
                  @click="openSettings"
                >
                  {{ link.label }}
                </button>
              </template>
            </div>
          </div>
        </nav>
      </div>
      <!-- Copyright -->
      <div class="mt-12 pt-8 border-t border-slate-800">
        <p class="text-sm text-slate-500">
          {{ copyright }}
        </p>
      </div>
    </div>
  </footer>
</template>
