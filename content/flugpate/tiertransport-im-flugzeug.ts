import type { FlugpatePageContent } from './types'

export const tiertransportImFlugzeugContent: FlugpatePageContent = {
  meta: {
    title: 'Tiertransport im Flugzeug – IATA, Kabine & Fracht | PawTransfer',
    description:
      'Tiertransport im Flugzeug: IATA-Richtlinien, Transportboxen, Kabine vs. Frachtraum, Stressreduktion und Unterschiede zwischen Airlines.',
    ogTitle: 'Tiertransport im Flugzeug | PawTransfer',
    ogDescription:
      'Alles zu Transportboxen, Kabinentransport, Fracht und Airline-Bedingungen.',
  },
  sections: [
    {
      id: 'iata',
      title: 'IATA-Richtlinien',
      paragraphs: [
        'Die IATA (International Air Transport Association) gibt Live Animals Regulations heraus, die viele Airlines als Mindeststandard für den Tiertransport anwenden. Sie regeln unter anderem die Größe und Beschaffenheit von Transportbehältern, Belüftung, Bodenfläche und Kennzeichnung.',
        'Flugpaten müssen die jeweiligen Vorgaben ihrer Airline beachten; diese können strenger sein als die IATA-Mindestanforderungen. Die Organisation stellt in der Regel eine zur Airline passende Transportbox bereit oder gibt vor, welche Box verwendet werden muss.',
      ],
    },
    {
      id: 'transportboxen',
      title: 'Transportboxen',
      paragraphs: [
        'Für die Kabine sind weiche oder halbsteife Taschen üblich, die unter dem Vordersitz Platz finden. Maximalmaße und Gewicht (Tier plus Tasche) legt jede Airline fest. Für den Frachtraum sind starre IATA-konforme Boxen aus Kunststoff mit Gitterfront und ausreichender Belüftung vorgeschrieben. Das Tier muss aufrecht stehen, sich drehen und liegen können.',
        'Die Box muss sicher verschlossen und mit „Live Animal“ und „This Way Up“ gekennzeichnet sein. Futter und Wasser können in zugänglichen Behältern an der Box angebracht werden; bei Kurzstreckenflügen reicht oft eine kleine Wassergabe vor dem Flug.',
      ],
    },
    {
      id: 'kabine-vs-fracht',
      title: 'Kabine vs. Frachtraum',
      paragraphs: [
        'In der Kabine reist das Tier in der Regel im Bereich der Füße unter dem Vordersitz. Es ist bei Ihnen, Sie können es beobachten und bei manchen Airlines nach Absprache beruhigen. Erlaubt sind meist nur kleine Hunde und Katzen bis zu einem bestimmten Gewicht (z. B. 8 kg inkl. Box).',
        'Im Frachtraum reisen größere Tiere in speziell klimatisierten Bereichen. Der Flugpate hat während des Flugs keinen Zugang; die Crew ist informiert. Nach der Landung wird das Tier am Sondergepäck ausgehändigt. Viele Airlines schließen Frachttransport bei zu hohen oder zu tiefen Außentemperaturen aus (Embargo).',
      ],
    },
    {
      id: 'stressreduktion',
      title: 'Stressreduktion für Tiere',
      paragraphs: [
        'Gewohnte Decke oder Spielzeug (wenn die Airline es erlaubt), ruhige Ansprache und eine möglichst direkte Anreise zum Flughafen reduzieren Stress. Sedierung wird von den meisten Tierärzten und Airlines abgelehnt, da sie in der Höhe riskant sein kann. Stattdessen: ausreichend Zeit einplanen, laute Geräusche meiden und das Tier erst kurz vor Abflug in die Box setzen.',
        'Die Organisation sollte das Tier an die Box gewöhnt haben. Ein vertrauter Geruch (z. B. Tuch von der Pflegestelle) in der Box kann beruhigend wirken.',
      ],
    },
    {
      id: 'temperatur-embargo',
      title: 'Temperaturregelungen und Embargo',
      paragraphs: [
        'Airlines können den Transport von Tieren im Frachtraum bei Außentemperaturen über etwa 30 °C oder unter 0 °C (je nach Strecke und Flughafen) untersagen. Diese „Embargo“-Zeiten werden saisonal festgelegt. Bei Kabinentransport entfällt das Embargo, da die Kabine klimatisiert ist.',
        'Flugpaten sollten bei Buchung oder spätestens bei der Tieranfrage nach Embargo-Zeiten für Abflug- und Zielflughafen fragen.',
      ],
    },
    {
      id: 'airline-unterschiede',
      title: 'Unterschiede zwischen Airlines',
      paragraphs: [
        'Jede Airline hat eigene Regeln: maximale Anzahl Tiere pro Flug, Gewicht und Maße für Kabine/Fracht, Gebühren, Voranmeldung (z. B. 48 h vor Abflug) und erlaubte Rassen (bei manchen Airlines sind bestimmte Kurzkopf-Rassen im Frachtraum ausgeschlossen).',
        'Die Organisation wählt in der Regel Strecken und Airlines, mit denen sie Erfahrung hat. Als Flugpate sollten Sie Ihre geplante Airline nennen, damit geprüft werden kann, ob ein Transport möglich ist.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Dürfen Tiere in der Kabine mitfliegen?',
      answer:
        'Ja, viele Airlines erlauben kleine Hunde und Katzen in einer Transporttasche in der Kabine, sofern Gewicht und Maße eingehalten werden. Die genauen Bedingungen (Gewicht, Maße, Gebühren) legt jede Airline fest.',
    },
    {
      question: 'Ist der Frachtraum sicher für Tiere?',
      answer:
        'Der Frachtbereich für Tiere ist klimatisiert und wird von den Airlines überwacht. Bei Einhaltung der Vorschriften und bei geeigneten Außentemperaturen ist der Transport dort üblich und von Tierschutzverbänden anerkannt. Embargo-Zeiten bei Hitze oder Kälte schützen die Tiere.',
    },
    {
      question: 'Welche Transportbox brauche ich?',
      answer:
        'Für die Kabine: weiche oder halbsteife Tasche nach Airline-Vorgabe. Für den Frachtraum: starre IATA-konforme Box. Die Organisation stellt in der Regel die passende Box oder gibt die genauen Anforderungen vor.',
    },
  ],
}
