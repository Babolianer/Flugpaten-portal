import { FLUGPATE_TOPICS } from '~/content/flugpate/types'
import type { FlugpatePageContent } from '~/content/flugpate/types'

function allKnowledgeSlugsClient(): string[] {
  return FLUGPATE_TOPICS.map((t) => t.slug)
}

export async function fetchKnowledgePagesSettings() {
  return $fetch<{ disabledSlugs: string[] }>('/api/site/knowledge-pages', {
    headers: { 'Cache-Control': 'no-cache' },
  }).catch(() => ({ disabledSlugs: allKnowledgeSlugsClient() }))
}

const KNOWLEDGE_PAGES_ASYNC_KEY = 'knowledge-pages-settings'

const knowledgePagesAsyncOptions = {
  default: () => ({ disabledSlugs: [] as string[] }),
  getCachedData: () => undefined as undefined,
}

const DE_SLUG_LOADERS: Record<string, () => Promise<FlugpatePageContent>> = {
  'was-ist-ein-flugpate': async () => {
    const m = await import('~/content/flugpate/was-ist-ein-flugpate')
    return m.wasIstEinFlugpateContent
  },
  'ablauf-einer-flugpatenschaft': async () => {
    const m = await import('~/content/flugpate/ablauf-einer-flugpatenschaft')
    return m.ablaufFlugpatenschaftContent
  },
  'rechtliche-hinweise': async () => {
    const m = await import('~/content/flugpate/rechtliche-hinweise')
    return m.rechtlicheHinweiseContent
  },
  'tiertransport-im-flugzeug': async () => {
    const m = await import('~/content/flugpate/tiertransport-im-flugzeug')
    return m.tiertransportImFlugzeugContent
  },
  'haeufige-fragen': async () => {
    const m = await import('~/content/flugpate/haeufige-fragen')
    return m.haeufigeFragenContent
  },
  'fuer-organisationen': async () => {
    const m = await import('~/content/flugpate/fuer-organisationen')
    return m.fuerOrganisationenContent
  },
  'fuer-flugpaten': async () => {
    const m = await import('~/content/flugpate/fuer-flugpaten')
    return m.fuerFlugpatenContent
  },
  'risiken-und-sicherheit': async () => {
    const m = await import('~/content/flugpate/risiken-und-sicherheit')
    return m.risikenUndSicherheitContent
  },
  checkliste: async () => {
    const m = await import('~/content/flugpate/checkliste')
    return m.checklisteContent
  },
  'eu-regelungen': async () => {
    const m = await import('~/content/flugpate/eu-regelungen')
    return m.euRegelungenContent
  },
}

async function loadDePage(slug: string): Promise<FlugpatePageContent | null> {
  const loader = DE_SLUG_LOADERS[slug]
  if (!loader) return null
  return loader()
}

async function loadNonDePage(
  slug: string,
  loc: 'en' | 'es' | 'fr' | 'it' | 'pl'
): Promise<FlugpatePageContent | null> {
  const mod = await import(`~/content/flugpate-pages/${loc}.json`)
  const pages = mod.default as Record<string, FlugpatePageContent>
  const fromJson = pages[slug]
  if (fromJson) return fromJson
  return loadDePage(slug)
}

export function useFlugpateContent() {
  const { locale, t } = useI18n()
  const route = useRoute()
  const { data: knowledgePagesSettings } = useAsyncData(
    KNOWLEDGE_PAGES_ASYNC_KEY,
    () => fetchKnowledgePagesSettings(),
    knowledgePagesAsyncOptions,
  )

  watch(() => route.fullPath, () => refreshNuxtData(KNOWLEDGE_PAGES_ASYNC_KEY))

  const disabledSlugs = computed(() => new Set(knowledgePagesSettings.value?.disabledSlugs ?? []))

  const topics = computed(() =>
    FLUGPATE_TOPICS.filter((topic) => !disabledSlugs.value.has(topic.slug)).map((topic) => ({
      ...topic,
      title: t(`flugpate.topics.${topic.slug}.title`),
      shortDescription: t(`flugpate.topics.${topic.slug}.shortDescription`),
    })),
  )

  /**
   * Lädt den Seiteninhalt nur nach Admin-Freigabe (nicht in disabledSlugs) und nur on-demand
   * (eigene Chunks pro Sprache/Slug).
   */
  async function loadPageContent(slug: string): Promise<FlugpatePageContent | null> {
    await useAsyncData(KNOWLEDGE_PAGES_ASYNC_KEY, () => fetchKnowledgePagesSettings(), knowledgePagesAsyncOptions)
    if (disabledSlugs.value.has(slug)) return null

    const loc = (locale.value || 'de') as 'de' | 'en' | 'es' | 'fr' | 'it' | 'pl'
    if (loc === 'de') return loadDePage(slug)
    return loadNonDePage(slug, loc)
  }

  return { topics, loadPageContent }
}
