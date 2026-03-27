import type { FlugpatePageContent } from './types'

export const fuerFlugpatenContent: FlugpatePageContent = {
  meta: {
    title: 'Flugpaten – Voraussetzungen, Aufwand & Verantwortung | PawTransfer',
    description:
      'Alles für angehende Flugpaten: Voraussetzungen, Zeitaufwand, Verantwortung, Risiken, Vorteile und Motivation. Sachlich und praxisnah.',
    ogTitle: 'Für Flugpaten | PawTransfer',
    ogDescription:
      'Voraussetzungen und Tipps für alle, die als Flugpate ein Tier begleiten möchten.',
  },
  sections: [
    {
      id: 'voraussetzungen',
      title: 'Voraussetzungen',
      paragraphs: [
        'Sie sollten volljährig sein, eine gültige Reiseidentität haben und die geplante Strecke (Abflug- und Zielflughafen) sowie das Reisedatum zuverlässig angeben können. Wichtig sind Zuverlässigkeit und die Bereitschaft, die Dokumente mitzuführen und das Tier tierschutzgerecht zu transportieren.',
        'Keine besondere Ausbildung ist nötig; die Organisation erklärt den Ablauf und stellt die nötigen Unterlagen bereit. Erfahrung im Umgang mit Hunden oder Katzen ist hilfreich, aber nicht zwingend – viele Tiere sind ruhig in der Box und werden nur bei Übergabe kurz berührt.',
      ],
    },
    {
      id: 'zeitaufwand',
      title: 'Zeitaufwand',
      paragraphs: [
        'Der zusätzliche Zeitaufwand beschränkt sich im Wesentlichen auf die Übergabe am Abflug- und Zielflughafen (je nach Absprache 15–30 Minuten) und die Mitnahme der Box und Papiere. Die Anreise zum Flughafen und der Check-in dauern ohnehin; mit Tier sollten Sie etwas mehr Puffer einplanen.',
        'Vor der Reise: Anmeldung, kurzer Austausch mit der Organisation, ggf. Vorabprüfung der Dokumente. Insgesamt handelt es sich um einen überschaubaren Mehraufwand, der sich für viele durch das gute Gefühl, einem Tier zu helfen, lohnt.',
      ],
    },
    {
      id: 'verantwortung',
      title: 'Verantwortung',
      paragraphs: [
        'Vom Zeitpunkt der Übernahme bis zur Übergabe am Ziel tragen Sie die Obhut über das Tier. Dazu gehört: Box und Papiere sicher mitführen, die Vorgaben der Airline einhalten, das Tier nicht unnötig stressen und bei Auffälligkeiten (z. B. gesundheitliche Probleme) die Organisation informieren.',
        'Sie sind nicht für die Erstellung der Papiere verantwortlich, aber für deren Mitführung und Vorlage bei Kontrollen. Eine sorgfältige Prüfung vor Abreise reduziert Risiken für alle.',
      ],
    },
    {
      id: 'risiken',
      title: 'Risiken',
      paragraphs: [
        'Mögliche Risiken: Das Tier wird krank oder verletzt sich; die Papiere werden beanstandet; die Airline verweigert die Mitnahme (z. B. bei Embargo). Durch klare Absprachen mit der Organisation, vollständige Dokumente und Einhaltung der Airline-Regeln lassen sich die meisten Risiken minimieren.',
        'Rechtlich können Schadensersatzansprüche entstehen, wenn Sie Ihre Sorgfaltspflicht verletzen. Eine schriftliche Vereinbarung mit der Organisation sollte klären, wer in welchen Fällen haftet und ob eine Vereinsversicherung greift.',
      ],
    },
    {
      id: 'vorteile',
      title: 'Vorteile',
      paragraphs: [
        'Sie nutzen Ihre ohnehin geplante Reise für ein konkretes Tierschutzprojekt, ohne zusätzliche Reisekosten. Sie erleben unmittelbar, dass Ihr Flug einem Tier hilft, und entlasten die Organisation. Viele Flugpaten schätzen den klaren, begrenzten Rahmen: eine Strecke, ein Tier, klare Übergabepunkte.',
        'Zudem lernen Sie oft die Arbeit der Tierschutzvereine näher kennen und können sich bei weiteren Reisen erneut engagieren.',
      ],
    },
    {
      id: 'motivation',
      title: 'Emotionale Motivation',
      paragraphs: [
        'Viele Flugpaten sind tierlieb und wollen aktiv helfen, ohne selbst ein Tier adoptieren zu können. Die Flugpatenschaft verbindet das Nützliche mit dem Machbaren: Sie reisen sowieso, und mit wenig Zusatzaufwand ermöglichen Sie einem Tier den Weg in ein neues Leben. Das schafft Sinn und wird von vielen als bereichernd empfunden.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Brauche ich Erfahrung mit Hunden oder Katzen?',
      answer:
        'Nicht zwingend. Die Organisation wählt in der Regel Tiere, die transporttauglich sind. Sie müssen das Tier nicht trainieren oder pflegen – nur sicher von A nach B bringen. Erfahrung kann bei unsicheren oder ängstlichen Tieren helfen, ist aber keine Voraussetzung.',
    },
    {
      question: 'Kann ich als Flugpate abgelehnt werden?',
      answer:
        'Organisationen können aus Kapazitäts- oder Sicherheitsgründen ablehnen (z. B. wenn kein passendes Tier für Ihre Strecke vorhanden ist oder die Airline den Transport nicht erlaubt). Eine pauschale „Ablehnung“ ohne Begründung ist unüblich bei seriösen Vereinen.',
    },
    {
      question: 'Was, wenn ich meinen Flug stornieren muss?',
      answer:
        'Melden Sie sich sofort bei der Organisation. Sie kann ggf. ein Ersatz-Tier oder einen Ersatz-Flugpaten suchen. Eine kurzfristige Stornierung belastet die Planung; je früher Sie Bescheid geben, desto besser.',
    },
  ],
}
