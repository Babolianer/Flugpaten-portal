import type { FlugpatePageContent } from './types'

export const euRegelungenContent: FlugpatePageContent = {
  meta: {
    title: 'EU-Regelungen zur Flugpatenschaft – Heimtierverordnung & mehr | PawBridge',
    description:
      'EU-Heimtierverordnung, Länderunterschiede, Sonderfälle und Einreise aus Nicht-EU-Ländern. Rechtssicher als Flugpate unterwegs.',
    ogTitle: 'EU-Regelungen Flugpatenschaft | PawBridge',
    ogDescription:
      'EU-Vorgaben für die private Mitnahme von Hunden und Katzen – für Flugpaten.',
  },
  sections: [
    {
      id: 'heimtierverordnung',
      title: 'EU-Heimtierverordnung',
      paragraphs: [
        'Die Verordnung (EU) Nr. 576/2013 regelt die nicht gewerbliche Verbringung von Hunden, Katzen und Frettchen in die EU und innerhalb der EU. Sie gilt für die private Mitnahme von bis zu fünf Tieren pro Reise (unter bestimmten Bedingungen auch mehr, z. B. bei Welpen unter 6 Monaten). Flugpaten, die kein Entgelt für den Transport erhalten, fallen in der Regel unter diese „nicht gewerbliche Verbringung“.',
        'Kernanforderungen: Kennzeichnung durch Mikrochip (ISO 11784/11785), gültige Tollwutimpfung (nach dem Setzen des Chips), EU-Heimtierausweis. Bei Einreise aus gelisteten Drittländern können zusätzliche Bedingungen gelten (z. B. Antikörpertest, Wartezeit).',
      ],
    },
    {
      id: 'laenderunterschiede',
      title: 'Länderunterschiede innerhalb der EU',
      paragraphs: [
        'Innerhalb der EU sind die Mindestanforderungen harmonisiert. Einige Mitgliedstaaten verlangen jedoch zusätzliche Maßnahmen: z. B. Behandlung gegen Echinococcus (Bandwurm) für Hunde vor Einreise in Finnland, Irland, Malta oder Großbritannien. Auch Tollwut-Antikörpertests können in einzelnen Ländern verlangt werden.',
        'Als Flugpate sollten Sie das Zielland der Reise kennen. Die Organisation, die das Tier aufnimmt, ist in der Regel mit den nationalen Zusatzanforderungen vertraut und bereitet die Papiere entsprechend vor.',
      ],
    },
    {
      id: 'sonderfaelle',
      title: 'Sonderfälle',
      paragraphs: [
        'Jungtiere: Welpen und Kitten dürfen erst nach der ersten Tollwutimpfung und nach Ablauf der Wartezeit (oft 21 Tage) verbracht werden; vorher nur in Ausnahmen (z. B. mit Muttertier). Assistenzhunde unterliegen teils erleichterten Regelungen.',
        'Rückreise: Wenn Sie aus einem Drittland in die EU einreisen, gelten die Drittlandsvorschriften (Gesundheitszeugnis, TRACES). Bei Reisen nur innerhalb der EU reicht der EU-Heimtierausweis mit Mikrochip und gültiger Tollwutimpfung.',
      ],
    },
    {
      id: 'nicht-eu-einreise',
      title: 'Einreise aus Nicht-EU-Ländern',
      paragraphs: [
        'Bei Einreise aus Drittländern in die EU sind in der Regel erforderlich: amtstierärztliches Gesundheitszeugnis, gültige Tollwutimpfung (ggf. Antikörpertest und Wartezeit), oft TRACES-Bescheinigung. Die genauen Anforderungen hängen vom Herkunftsland ab (gelistete vs. nicht gelistete Drittländer).',
        'Die Organisation im Herkunftsland bzw. ein Amtstierarzt erstellt die Dokumente; der Flugpate führt sie mit und legt sie bei der Einreisekontrolle vor. Ohne vollständige Papiere ist die Einreise nicht erlaubt.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Gilt die EU-Heimtierverordnung auch für Flugpaten?',
      answer:
        'Ja. Flugpaten verbringen das Tier nicht gewerblich (kein Entgelt für den Transport). Sie müssen die gleichen Anforderungen erfüllen: Mikrochip, Tollwutimpfung, EU-Heimtierausweis bzw. bei Drittlandseinfuhr die dort vorgeschriebenen Dokumente.',
    },
    {
      question: 'Was ist bei Flügen nach Großbritannien zu beachten?',
      answer:
        'Großbritannien hat nach dem EU-Austritt eigene Einreisevorschriften für Hunde und Katzen (u. a. Behandlung gegen Echinococcus, Zeckenbehandlung). Die Organisation muss die Papiere entsprechend vorbereiten; der Flugpate führt sie mit.',
    },
    {
      question: 'Brauche ich TRACES bei Reisen nur innerhalb der EU?',
      answer:
        'Bei Reisen innerhalb der EU (Tier aus EU-Land, Ziel EU-Land) reicht in der Regel der EU-Heimtierausweis. TRACES ist vor allem für die Einreise aus Drittländern in die EU vorgesehen. Die Organisation klärt die Anforderungen für Ihre konkrete Strecke.',
    },
  ],
}
