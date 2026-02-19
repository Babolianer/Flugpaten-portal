import { FLUGPATE_TOPICS } from '~/content/flugpate/types'
import type { FlugpatePageContent } from '~/content/flugpate/types'
import { wasIstEinFlugpateContent } from '~/content/flugpate/was-ist-ein-flugpate'
import { ablaufFlugpatenschaftContent } from '~/content/flugpate/ablauf-einer-flugpatenschaft'
import { rechtlicheHinweiseContent } from '~/content/flugpate/rechtliche-hinweise'
import { tiertransportImFlugzeugContent } from '~/content/flugpate/tiertransport-im-flugzeug'
import { haeufigeFragenContent } from '~/content/flugpate/haeufige-fragen'
import { fuerOrganisationenContent } from '~/content/flugpate/fuer-organisationen'
import { fuerFlugpatenContent } from '~/content/flugpate/fuer-flugpaten'
import { risikenUndSicherheitContent } from '~/content/flugpate/risiken-und-sicherheit'
import { checklisteContent } from '~/content/flugpate/checkliste'
import { euRegelungenContent } from '~/content/flugpate/eu-regelungen'
import enPages from '~/content/flugpate-pages/en.json'
import esPages from '~/content/flugpate-pages/es.json'
import frPages from '~/content/flugpate-pages/fr.json'

const CONTENT_MAP: Record<string, FlugpatePageContent> = {
  'was-ist-ein-flugpate': wasIstEinFlugpateContent,
  'ablauf-einer-flugpatenschaft': ablaufFlugpatenschaftContent,
  'rechtliche-hinweise': rechtlicheHinweiseContent,
  'tiertransport-im-flugzeug': tiertransportImFlugzeugContent,
  'haeufige-fragen': haeufigeFragenContent,
  'fuer-organisationen': fuerOrganisationenContent,
  'fuer-flugpaten': fuerFlugpatenContent,
  'risiken-und-sicherheit': risikenUndSicherheitContent,
  checkliste: checklisteContent,
  'eu-regelungen': euRegelungenContent,
}

const LOCALE_PAGES: Record<string, Record<string, FlugpatePageContent>> = {
  de: {},
  en: enPages as Record<string, FlugpatePageContent>,
  es: esPages as Record<string, FlugpatePageContent>,
  fr: frPages as Record<string, FlugpatePageContent>,
}

export function useFlugpateContent() {
  const { locale, t } = useI18n()

  const topics = computed(() =>
    FLUGPATE_TOPICS.map((topic) => ({
      ...topic,
      title: t(`flugpate.topics.${topic.slug}.title`),
      shortDescription: t(`flugpate.topics.${topic.slug}.shortDescription`),
    }))
  )

  function getPageContent(slug: string): FlugpatePageContent | null {
    const loc = (locale.value || 'de') as 'de' | 'en' | 'es' | 'fr'
    if (loc === 'de') {
      return CONTENT_MAP[slug] ?? null
    }
    const pages = LOCALE_PAGES[loc]
    return pages?.[slug] ?? CONTENT_MAP[slug] ?? null
  }

  return { topics, getPageContent }
}
