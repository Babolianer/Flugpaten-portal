import type { FlugpatePageContent } from './types'

export const ablaufFlugpatenschaftContent: FlugpatePageContent = {
  meta: {
    title: 'Ablauf einer Flugpatenschaft – Schritt für Schritt | PawBridge',
    description:
      'So läuft eine Flugpatenschaft ab: von der Kontaktaufnahme über Check-in und Flug bis zur Übergabe im Zielland. Transparent und praxisnah erklärt.',
    ogTitle: 'Ablauf einer Flugpatenschaft | PawBridge',
    ogDescription:
      'Kontaktaufnahme, Dokumentenprüfung, Übergabe am Flughafen, Transport und Ankunft – der komplette Ablauf einer Flugpatenschaft.',
  },
  sections: [
    {
      id: 'kontaktaufnahme',
      title: 'Kontaktaufnahme',
      paragraphs: [
        'Die Flugpatenschaft beginnt mit der Kontaktaufnahme zwischen Reisendem und Tierschutzorganisation. Viele Vereine veröffentlichen geplante Flugdaten und Reiserouten (z. B. Mallorca – München) auf ihrer Website oder in sozialen Medien. Interessierte melden sich mit Reisedatum, Abflug- und Zielflughafen sowie der Anzahl der mitreisenden Personen.',
        'Die Organisation prüft, ob ein passendes Tier für diese Strecke vorgesehen ist und ob die Kapazität des Flugpaten ausreicht (z. B. ein Tier pro Person bei Kabinentransport). Anschließend werden die Details schriftlich festgehalten: Welches Tier, welche Dokumente, wo und wann Übergabe am Abflugort und am Zielort.',
      ],
    },
    {
      id: 'dokumentenpruefung',
      title: 'Dokumentenprüfung',
      paragraphs: [
        'Vor der verbindlichen Zusage prüft die Organisation, ob alle Einreise- und Fluganforderungen erfüllt sind. Dazu gehören: EU-Heimtierausweis mit gültiger Tollwutimpfung und Mikrochip, bei Einreise aus Drittländern oft ein amtstierärztliches Gesundheitszeugnis und TRACES-Eintrag. Die Organisation stellt die Dokumente bereit und übergibt sie dem Flugpaten vor oder bei der Übergabe des Tieres.',
        'Der Flugpate sollte die Unterlagen vor Abreise selbst prüfen und bei Unklarheiten die Organisation oder einen Tierarzt kontaktieren. Fehlende oder fehlerhafte Papiere können zur Zurückweisung an der Grenze oder durch die Airline führen.',
      ],
    },
    {
      id: 'uebergabe-abflug',
      title: 'Übergabe am Abflughafen',
      paragraphs: [
        'Die Übergabe des Tieres erfolgt in der Regel am Abflughafen, oft am Tag des Flugs oder am Vorabend. Ein Vertreter der Organisation oder eine Pflegestelle übergibt das Tier in der vorgesehenen Transportbox zusammen mit den Dokumenten. Der Flugpate kontrolliert die Box, die Befestigung und die Papiere und bestätigt die Übernahme.',
        'Ein kurzer schriftlicher Übernahmezettel oder eine Bestätigung per E-Mail schützt beide Seiten und dokumentiert den Zeitpunkt der Übergabe. So ist klar, ab wann der Flugpate für das Tier verantwortlich ist.',
      ],
    },
    {
      id: 'check-in',
      title: 'Ablauf am Check-In',
      paragraphs: [
        'Am Schalter zeigt der Flugpate sein Gepäck, die Flugtickets und die Tierdokumente. Die Airline prüft Buchung (Kabine oder Fracht), Gewicht und Transportbox. Bei Kabinentransport wird die Tasche/Box oft gewogen und als Handgepäck oder Zusatzgepäck verbucht. Bei Frachttransport wird das Tier separat angemeldet und zum Frachtbereich gebracht.',
        'Wichtig: Ausreichend Zeit einplanen. Manche Airlines verlangen eine Voranmeldung (z. B. 48 Stunden vor Abflug). Die genauen Bedingungen stehen in den Beförderungsbedingungen der jeweiligen Airline.',
      ],
    },
    {
      id: 'transport-flugzeug',
      title: 'Transport im Frachtraum oder in der Kabine',
      paragraphs: [
        'Kleine Hunde und die meisten Katzen reisen in einer zugelassenen Transporttasche in der Kabine unter dem Sitz. Größere Tiere reisen im klimatisierten Frachtraum in einer IATA-gerechten Transportbox. Während des Flugs hat der Flugpate keine Möglichkeit, das Tier im Frachtraum zu betreuen; die Crew ist über den tierischen Passagier informiert.',
        'Nach der Landung wird das Tier entweder mit dem Gepäck ausgegeben (Kabine) oder am Sondergepäckbereich abgeholt (Fracht). Die Organisation oder die Abholperson am Zielflughafen wird in der Regel vor Ankunft informiert.',
      ],
    },
    {
      id: 'uebergabe-ziel',
      title: 'Übergabe im Zielland',
      paragraphs: [
        'Am Zielflughafen übernimmt ein Vertreter der aufnehmenden Organisation oder die zukünftige Pflegestelle/Adoptivfamilie das Tier. Der Flugpate übergibt Tier, Box und Dokumente und erhält oft eine kurze Bestätigung. Damit endet seine Verantwortung.',
        'Seriöse Vereine bestätigen die Ankunft schriftlich und geben auf Wunsch später eine Rückmeldung zur Vermittlung des Tieres. So erlebt der Flugpate den Abschluss der Kette und kann sich über den erfolgreichen Transport freuen.',
      ],
    },
    {
      id: 'nachbereitung',
      title: 'Nachbereitung',
      paragraphs: [
        'Nach der Übergabe hat der Flugpate keine weiteren Pflichten. Viele Organisationen bedanken sich per E-Mail oder in sozialen Medien und bleiben für künftige Flüge ansprechbar. Wer erneut als Flugpate tätig werden möchte, kann sich bei derselben oder einer anderen Organisation mit seiner nächsten Reiseroute melden.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Wie lange vor dem Flug muss ich mich als Flugpate melden?',
      answer:
        'Je früher, desto besser. Viele Organisationen brauchen mindestens 1–2 Wochen, um ein passendes Tier zu finden und die Papiere vorzubereiten. Bei manchen Strecken reicht auch eine kurzfristige Meldung, wenn gerade ein Tier wartet.',
    },
    {
      question: 'Wo genau findet die Übergabe am Zielflughafen statt?',
      answer:
        'Die Organisation vereinbart mit Ihnen einen konkreten Treffpunkt, z. B. am Ankunftsbereich, am Parkplatz oder am Sondergepäck. Oft wird die Abholperson mit Schild oder Kontakt per Handy koordiniert.',
    },
    {
      question: 'Bin ich während des Flugs für das Tier verantwortlich?',
      answer:
        'Ja. Vom Zeitpunkt der Übernahme bis zur Übergabe am Ziel tragen Sie die Verantwortung für das Tier. Dazu gehört die Einhaltung der Beförderungsvorschriften und der Umgang mit dem Tier am Flughafen.',
    },
  ],
}
