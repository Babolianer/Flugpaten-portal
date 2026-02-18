import type { FlugpatePageContent } from './types'

export const rechtlicheHinweiseContent: FlugpatePageContent = {
  meta: {
    title: 'Rechtliche Hinweise zur Flugpatenschaft | PawBridge',
    description:
      'Verantwortung, Haftung, Einfuhrbestimmungen, TRACES, EU-Heimtierverordnung, Impfpflicht und Mikrochip – was Flugpaten rechtlich beachten müssen.',
    ogTitle: 'Rechtliche Hinweise Flugpatenschaft | PawBridge',
    ogDescription:
      'Rechtliche Pflichten des Flugpaten: Haftung, Einfuhr, TRACES, Impfungen und Zoll.',
  },
  sections: [
    {
      id: 'verantwortung',
      title: 'Verantwortung des Flugpaten',
      paragraphs: [
        'Als Flugpate übernehmen Sie für die Dauer des Transports die faktische Obhut über das Tier. Sie sind verpflichtet, die geltenden Einreise- und Tierseuchenbestimmungen einzuhalten und das Tier tierschutzgerecht zu befördern. Dazu gehören die Verwendung einer geeigneten Transportbox, die Mitnahme der vollständigen Dokumente und die Einhaltung der Vorgaben der Fluggesellschaft.',
        'Die Organisation ist ihrerseits verpflichtet, Ihnen alle nötigen Papiere rechtzeitig und korrekt zur Verfügung zu stellen. Eine klare schriftliche Vereinbarung zwischen Organisation und Flugpate empfiehlt sich, um Verantwortungsbereiche und Kosten zu regeln.',
      ],
    },
    {
      id: 'haftung',
      title: 'Haftung',
      paragraphs: [
        'Wer ein Tier befördert, haftet für Schäden, die durch das Tier oder durch Fehler bei der Beförderung entstehen – etwa wenn Dokumente fehlen und das Tier zurückgewiesen wird oder das Tier zu Schaden kommt. Die genaue Haftungsverteilung zwischen Organisation und Flugpate sollte im Vorfeld geklärt werden.',
        'Viele Vereine schließen mit dem Flugpaten eine Vereinbarung, die die Übernahme von Kosten bei dokumentenbedingten Problemen oder die Mitwirkung bei der Beschaffung von Ersatzdokumenten regelt. Eine private Haftpflichtversicherung deckt in der Regel keine gewerblichen oder vereinsbezogenen Tätigkeiten; für Schäden am Tier oder an Dritten sollte mit der Organisation besprochen werden, ob eine Vereinsversicherung greift.',
      ],
    },
    {
      id: 'einfuhr-tracer',
      title: 'Einfuhrbestimmungen und TRACES',
      paragraphs: [
        'Die Einreise von Hunden und Katzen in die EU unterliegt der EU-Heimtierverordnung bzw. den Drittlandsregelungen. Für die Einreise aus Drittländern in die EU ist in vielen Fällen eine Anmeldung im TRACES-System (TRAde Control and Expert System) erforderlich. Die zuständige Behörde im Herkunftsland oder die Organisation erstellt die TRACES-Bescheinigung; der Flugpate führt sie mit und übergibt sie bei der Einreisekontrolle.',
        'Ohne gültige TRACES-Bescheinigung und die vorgeschriebenen tierärztlichen Dokumente kann das Tier an der Grenze zurückgewiesen oder unter Quarantäne gestellt werden. Der Flugpate trägt die Mitführungspflicht; die inhaltliche Erstellung obliegt in der Regel der Organisation oder einem Amtstierarzt.',
      ],
    },
    {
      id: 'eu-heimtierverordnung',
      title: 'EU-Heimtierverordnung',
      paragraphs: [
        'Innerhalb der EU gelten einheitliche Mindestanforderungen: Mikrochip (ISO 11784/11785), gültige Tollwutimpfung, EU-Heimtierausweis. Bei Reisen aus Drittländern können zusätzlich amtstierärztliche Gesundheitszeugnisse und Behandlungen gegen Echinococcus (Bandwurm) verlangt werden. Die genauen Anforderungen hängen vom Herkunftsland ab.',
        'Die EU-Heimtierverordnung betrifft nicht gewerbliche Beförderung, sondern die private Mitnahme von maximal fünf Tieren pro Reise (sofern nicht mit Welpen/Jungtieren). Flugpaten fallen in der Regel unter diese „nicht gewerbliche Beförderung“, sofern sie kein Entgelt für den Transport erhalten.',
      ],
    },
    {
      id: 'impfpflicht-mikrochip',
      title: 'Impfpflicht, Mikrochip und Tollwut',
      paragraphs: [
        'Tollwutimpfung ist für die Einreise in die EU und innerhalb der EU für Hunde und Katzen vorgeschrieben. Die Impfung muss nach dem Mikrochip erfolgen und je nach Land und Impfstoff mindestens 21 Tage vor der Einreise liegen. Der EU-Heimtierausweis dokumentiert Mikrochip-Nummer und Impfungen.',
        'Der Mikrochip muss vor der Tollwutimpfung gesetzt sein und den ISO-Standards entsprechen. Ohne lesbaren Mikrochip und ohne gültige Tollwutimpfung ist die legale Einreise nicht möglich.',
      ],
    },
    {
      id: 'zoll',
      title: 'Zoll',
      paragraphs: [
        'Beim Grenzübertritt können Zoll- oder Veterinärbeamte die Papiere und ggf. das Tier kontrollieren. Der Flugpate muss die Dokumente auf Verlangen vorlegen. Bei Verdacht auf Verstöße (z. B. fehlende Papiere, Verdacht auf illegalen Handel) können Beschlagnahme oder Rückweisung erfolgen. Eine sorgfältige Vorbereitung durch die Organisation und die Mitnahme aller Unterlagen durch den Flugpaten minimieren das Risiko.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Brauche ich als Flugpate eine besondere Genehmigung?',
      answer:
        'Für die private Mitnahme eines Tieres im Rahmen einer Flugpatenschaft ist keine gewerberechtliche Genehmigung nötig. Sie müssen aber die tierseuchen- und einfuhrrechtlichen Vorgaben einhalten (Dokumente, TRACES bei Drittlandseinfuhr).',
    },
    {
      question: 'Wer haftet, wenn das Tier am Flughafen zurückgewiesen wird?',
      answer:
        'Das hängt von der Vereinbarung mit der Organisation und der Ursache ab. Fehlende oder fehlerhafte Dokumente liegen oft in der Verantwortung der Organisation. Der Flugpate sollte vor Abreise die Papiere prüfen und bei Zweifeln nachfragen.',
    },
    {
      question: 'Was ist TRACES und wer erstellt es?',
      answer:
        'TRACES ist das EU-System für die Anmeldung von Tieren bei Einreise aus Drittländern. Die Bescheinigung wird von der zuständigen Behörde oder einem Amtstierarzt im Herkunftsland erstellt. Die Organisation kümmert sich in der Regel darum; der Flugpate führt die Bescheinigung mit.',
    },
  ],
}
