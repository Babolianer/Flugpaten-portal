import type { FlugpatePageContent } from './types'

export const risikenUndSicherheitContent: FlugpatePageContent = {
  meta: {
    title: 'Risiken und Sicherheit – Seriöse Flugpatenschaft | PawTransfer',
    description:
      'Missbrauch verhindern, seriöse Organisationen erkennen, Dokumente prüfen. So schützen Sie sich und die Tiere bei der Flugpatenschaft.',
    ogTitle: 'Risiken und Sicherheit | PawTransfer',
    ogDescription:
      'Sicher und seriös als Flugpate: Warnzeichen und Vertrauensmerkmale.',
  },
  sections: [
    {
      id: 'missbrauch-verhindern',
      title: 'Missbrauch verhindern',
      paragraphs: [
        'Die Flugpatenschaft basiert auf Vertrauen. Leider gibt es Fälle, in denen das Modell ausgenutzt wird: etwa für illegale Einfuhren, nicht deklarierte Welpenverkäufe oder Tiere ohne ordnungsgemäße Papiere. Sie können sich schützen, indem Sie nur mit transparenten Organisationen zusammenarbeiten, alle Dokumente vor Abreise prüfen und bei Verdacht nachfragen oder ablehnen.',
        'Seriöse Vereine verlangen keine Vorkasse von Ihnen für das Tier, stellen alle Papiere bereit und nennen klare Ansprechpartner. Sie erklären den Ablauf und stehen für Rückfragen zur Verfügung.',
      ],
    },
    {
      id: 'serioese-organisationen',
      title: 'Seriöse Organisationen erkennen',
      paragraphs: [
        'Anzeichen für Seriosität: eingetragener Verein (e. V.) mit Impressum und Satzung, klare Darstellung der Abläufe auf der Website, feste Ansprechpartner mit Namen oder Funktion, keine Aufforderung zur Zahlung von „Gebühren“ oder „Kaution“ an private Konten ohne Vereinbezug.',
        'Vorsicht bei: unklaren Absendern, Druck („nur heute möglich“), Zahlungsaufforderungen an Sie für das Mitnehmen des Tieres, fehlenden oder vagen Dokumentenangaben. Im Zweifel bei einem etablierten Dachverband oder einer anderen Organisation nachfragen.',
      ],
    },
    {
      id: 'dokumente-pruefen',
      title: 'Dokumente prüfen',
      paragraphs: [
        'Vor Übernahme des Tieres sollten Sie den EU-Heimtierausweis (oder das amtliche Gesundheitszeugnis) durchsehen: Ist die Mikrochip-Nummer eingetragen? Ist die Tollwutimpfung gültig (Datum, Wiederholung)? Stimmt die Tierbeschreibung (Rasse, Alter, Fell)? Bei Einreise aus Drittländern: Ist eine TRACES-Bescheinigung vorhanden?',
        'Wenn etwas unklar oder widersprüchlich ist, fragen Sie die Organisation. Fehlende oder fehlerhafte Papiere können zur Zurückweisung an der Grenze führen – und im schlimmsten Fall zum Verdacht auf illegalen Handel.',
      ],
    },
    {
      id: 'keine-illegalen-transporte',
      title: 'Keine illegalen Transporte',
      paragraphs: [
        'Legale Flugpatenschaft bedeutet: Das Tier erfüllt die Einreisebestimmungen, die Papiere sind vollständig und echt, und die Übergabe erfolgt an eine nachvollziehbare Organisation oder Pflegestelle. Sie sollten nie ein Tier mitnehmen, wenn Sie den Eindruck haben, dass Papiere gefälscht sind, das Tier nicht dem Ausweis entspricht oder die „Organisation“ nicht greifbar ist.',
        'Bei Verdacht auf illegale Einfuhr oder Handel können Sie sich an die zuständige Veterinärbehörde oder den Zoll wenden. Als Flugpate tragen Sie Mitverantwortung für die Einhaltung des Rechts.',
      ],
    },
    {
      id: 'warnzeichen',
      title: 'Warnzeichen',
      paragraphs: [
        'Vorsicht ist geboten bei: Druck, sofortige Zahlung zu verlangen; Weigerung, Papiere vor Übergabe zu zeigen; unklare oder wechselnde Ansprechpartner; Tiere, die offensichtlich krank oder nicht transporttauglich wirken; Aufforderung, bei der Grenze „nichts zu sagen“ oder Angaben zu verschweigen.',
        'In solchen Fällen sollten Sie die Mitnahme ablehnen und ggf. eine Meldung in Erwägung ziehen. Seriöse Organisationen haben nichts zu verbergen und unterstützen Ihre Sorgfalt.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Muss ich eine Organisation prüfen, bevor ich mitmache?',
      answer:
        'Ja. Prüfen Sie Impressum, Vereinsstatus und Bewertungen. Fragen Sie nach dem genauen Ablauf und den Dokumenten. Seriöse Vereine antworten transparent und verlangen keine Zahlung von Ihnen für das Tier.',
    },
    {
      question: 'Was tun, wenn die Papiere mir merkwürdig vorkommen?',
      answer:
        'Vor Abreise die Organisation darauf ansprechen und um Klärung bitten. Im Zweifel die Mitnahme absagen. Besser eine abgesagte Flugpatenschaft als ein Tier an der Grenze abgeben zu müssen oder in einen Rechtsfall zu geraten.',
    },
    {
      question: 'Kann ich als Flugpate strafrechtlich belangt werden?',
      answer:
        'Wenn Sie wissentlich an illegalen Einfuhren oder am Tierhandel mitwirken, können straf- und ordnungsrechtliche Konsequenzen drohen. Bei Einhaltung der Vorschriften und Zusammenarbeit mit seriösen Organisationen ist das Risiko minimiert.',
    },
  ],
}
