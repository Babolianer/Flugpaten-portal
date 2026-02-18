export interface FlugpateTopicMeta {
  slug: string
  title: string
  shortDescription: string
  order: number
}

export interface FlugpatePageMeta {
  title: string
  description: string
  ogTitle?: string
  ogDescription?: string
}

export interface FlugpateSection {
  id: string
  title: string
  subs?: Array<{
    title: string
    paragraphs: string[]
  }>
  paragraphs?: string[]
}

export interface FlugpateFaq {
  question: string
  answer: string
}

export interface FlugpatePageContent {
  meta: FlugpatePageMeta
  sections: FlugpateSection[]
  faqs?: FlugpateFaq[]
}

export const FLUGPATE_TOPICS: FlugpateTopicMeta[] = [
  { slug: 'was-ist-ein-flugpate', title: 'Was ist ein Flugpate?', shortDescription: 'Definition, Bedeutung und Abgrenzung zur gewerblichen Beförderung.', order: 1 },
  { slug: 'ablauf-einer-flugpatenschaft', title: 'Ablauf einer Flugpatenschaft', shortDescription: 'Von der Kontaktaufnahme bis zur Übergabe im Zielland.', order: 2 },
  { slug: 'rechtliche-hinweise', title: 'Rechtliche Hinweise', shortDescription: 'Verantwortung, Haftung, TRACES, Einfuhr und Impfungen.', order: 3 },
  { slug: 'tiertransport-im-flugzeug', title: 'Tiertransport im Flugzeug', shortDescription: 'IATA, Transportboxen, Kabine vs. Frachtraum.', order: 4 },
  { slug: 'haeufige-fragen', title: 'Häufige Fragen', shortDescription: 'Antworten auf die wichtigsten Fragen zur Flugpatenschaft.', order: 5 },
  { slug: 'fuer-organisationen', title: 'Für Organisationen', shortDescription: 'Vorteile, Prozesse und Vertrauen mit Flugpaten.', order: 6 },
  { slug: 'fuer-flugpaten', title: 'Für Flugpaten', shortDescription: 'Voraussetzungen, Aufwand und Verantwortung.', order: 7 },
  { slug: 'risiken-und-sicherheit', title: 'Risiken und Sicherheit', shortDescription: 'Seriös bleiben und Missbrauch vermeiden.', order: 8 },
  { slug: 'checkliste', title: 'Checkliste', shortDescription: 'Vor dem Flug, am Flughafen und nach der Ankunft.', order: 9 },
  { slug: 'eu-regelungen', title: 'EU-Regelungen', shortDescription: 'Heimtierverordnung, Länder und Sonderfälle.', order: 10 },
]
