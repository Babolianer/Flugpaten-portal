import type { FlugpatePageContent } from './types'

export const checklisteContent: FlugpatePageContent = {
  meta: {
    title: 'Checkliste Flugpatenschaft – Vor dem Flug, am Flughafen, danach | PawTransfer',
    description:
      'Checkliste für Flugpaten: Vor dem Flug, am Flughafen und nach der Ankunft. Nichts vergessen – sicher und entspannt reisen.',
    ogTitle: 'Checkliste Flugpatenschaft | PawTransfer',
    ogDescription:
      'Praktische Checkliste für Flugpaten: Vorbereitung, Flughafen, Ankunft.',
  },
  sections: [
    {
      id: 'vor-dem-flug',
      title: 'Vor dem Flug',
      subs: [
        {
          title: 'Anmeldung und Absprache',
          paragraphs: [
            'Reisedatum, Abflug- und Zielflughafen sowie Airline der Organisation mitteilen.',
            'Schriftliche Bestätigung von der Organisation einholen: welches Tier, wann und wo Übergabe Abflug/Ziel.',
            'Kontaktdaten der Ansprechpartner (Abflug und Ziel) im Handy speichern.',
          ],
        },
        {
          title: 'Dokumente',
          paragraphs: [
            'EU-Heimtierausweis (bzw. amtstierärztliches Gesundheitszeugnis bei Drittlandseinfuhr) prüfen: Mikrochip-Nummer, gültige Tollwutimpfung, ggf. TRACES-Bescheinigung.',
            'Alle Papiere in einer wasserfesten Hülle griffbereit mitführen (Handgepäck).',
            'Bei Unklarheiten vor Abreise die Organisation oder einen Tierarzt fragen.',
          ],
        },
        {
          title: 'Transportbox',
          paragraphs: [
            'Box/Tasche von der Organisation erhalten oder Anforderungen prüfen (IATA-konform bei Fracht, Airline-Maße bei Kabine).',
            'Sicher verschlossen, Kennzeichnung „Live Animal“ / „This Way Up“ bei Frachtbox.',
          ],
        },
        {
          title: 'Airline',
          paragraphs: [
            'Voranmeldung des Tieres bei der Airline (Frist einhalten, z. B. 48 h vor Abflug).',
            'Gebühren und maximale Anzahl Tiere pro Flug kennen.',
            'Embargo-Zeiten (Hitze/Kälte) für Abflug- und Zielflughafen prüfen, falls Frachttransport.',
          ],
        },
      ],
    },
    {
      id: 'am-flughafen',
      title: 'Am Flughafen',
      subs: [
        {
          title: 'Übergabe Abflug',
          paragraphs: [
            'Treffpunkt mit der Organisation einhalten.',
            'Tier, Box und Dokumente übernehmen und prüfen (Box geschlossen, Papiere vollständig).',
            'Kurze Bestätigung der Übernahme (z. B. Unterschrift oder E-Mail) vereinbaren.',
          ],
        },
        {
          title: 'Check-in',
          paragraphs: [
            'Ausreichend Zeit einplanen (mind. wie für normalen Check-in, plus Puffer für Tier).',
            'Papiere und ggf. Buchungsbestätigung für das Tier bereithalten.',
            'Bei Fracht: Tier zur angegebenen Stelle bringen, Quittung/Abholschein für Ziel aufbewahren.',
          ],
        },
        {
          title: 'Nach der Landung',
          paragraphs: [
            'Tier am Gepäckband (Kabine) oder am Sondergepäck (Fracht) abholen.',
            'Abholperson der Organisation kontaktieren und Übergabepunkt aufsuchen.',
            'Tier, Box und Dokumente übergeben und Übergabe bestätigen lassen.',
          ],
        },
      ],
    },
    {
      id: 'nach-ankunft',
      title: 'Nach der Ankunft',
      paragraphs: [
        'Ihre Verantwortung endet mit der Übergabe. Optional: kurze Rückmeldung an die Organisation („Tier sicher übergeben“).',
        'Auf Wunsch können Sie sich für die nächste Reise wieder als Flugpate melden.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Was muss ich unbedingt dabeihaben?',
      answer:
        'Alle tierärztlichen Dokumente (EU-Ausweis, ggf. TRACES, Gesundheitszeugnis), die Transportbox mit Tier, Kontaktdaten der Organisation für Abflug und Ziel sowie Ihre eigene Reisedokumentation (Ticket, Ausweis).',
    },
    {
      question: 'Wie viel früher soll ich am Flughafen sein?',
      answer:
        'Mindestens so früh wie für einen normalen Flug; bei Frachttier oft etwas mehr Zeit einplanen, da die Anmeldung separat erfolgen kann. Die Organisation oder die Airline gibt in der Regel eine Empfehlung.',
    },
    {
      question: 'Was tun, wenn die Abholperson am Ziel nicht da ist?',
      answer:
        'Die Organisation sollte eine Notfallnummer hinterlassen. Rufen Sie den Ansprechpartner an und warten Sie an einem vereinbarten Ort. Das Tier sollte nicht unbeaufsichtigt bleiben, bis die Übergabe erfolgt ist.',
    },
  ],
}
