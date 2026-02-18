/**
 * Acquise-Seed: möglichst vollständige Liste aller Flugpaten-Organisationen,
 * Plattformen, Vereine, Netzwerke und Portale (Tiere / Humanitär / Medizin).
 * Ausführen: npx tsx prisma/seed-acquisition.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Row = {
  name: string
  country: string
  continent: string
  websiteLanguage: string
  websiteUrl: string | null
  email: string | null
  contactFormUrl: string | null
  mediationType: 'ANIMALS' | 'HUMANITARIAN' | 'MEDICAL' | 'MIXED'
  mediatesToGermany: 'YES' | 'NO' | 'UNKNOWN'
  mediatesFromGermany: 'YES' | 'NO' | 'UNKNOWN'
}

const contacts: Row[] = [
  // ========== DEUTSCH ==========
  { name: 'Tiervermittlung.de – Flugpaten-Börse', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.tiervermittlung.de/flugpaten_gesucht.shtml', email: null, contactFormUrl: 'https://www.tiervermittlung.de/', mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Flugpate.com', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://flugpate.com/', email: null, contactFormUrl: 'https://flugpate.com/fp_anmeldung.php', mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Flugpate.org', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.flugpate.com/', email: null, contactFormUrl: 'https://www.flugpate.com/faq.php', mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'ZERGportal – Tierschutznetzwerk', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://zergportal.de/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'UNKNOWN' },
  { name: 'Tierschutzstiftungen.de – Flugpate', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://tierschutzstiftungen.de/helfen/flugpate/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Herbert und Maria Welter Tierschutzstiftung', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://tierstiftung.de', email: 'info@tierschutzstiftungen.de', contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Petangel – Flugpate werden', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.petangel.de/weitere-informationen-28', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'UNKNOWN' },
  { name: 'RespekTiere e.V.', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.respektiere.com/', email: 'flugpaten@respektiere.com', contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'SOS-Dalmatinerrettung', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.sos-dalmatinerrettung.de/', email: 'info@sos-dalmatinerrettung.de', contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Cocker-Rettung e.V.', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: null, email: 'ralf@cockerrettung.de', contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Deutsche Schäferhund Nothilfe e.V.', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: null, email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'UNKNOWN' },
  { name: 'Tierschutzverein Hunde aus dem Süden e.V.', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.flugpate.com/partnervereine_gr.php', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Glück auf vier Pfoten – Tierhilfe in Europa e.V.', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: null, email: 'info@tierhilfe-in-europa.de', contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Facebook – Flugpaten (allgemein)', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.facebook.com/flugpaten/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Facebook – Flugpaten Mallorca', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.facebook.com/groups/142683265838254/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Facebook – Herbert und Maria Welter Tierstiftung Flugpaten', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.facebook.com/tierstiftungflugpaten', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Anihelp Tierhilfe – Flugpate', country: 'Schweiz', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://anihelp.ch/flugpate/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'YES' },
  { name: 'Tierrettungsdienst Österreich (TRDÖ)', country: 'Österreich', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'http://trdoe.at/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },
  { name: 'Österreichische Tierrettung (ÖTR)', country: 'Österreich', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.oesterreichische-tierrettung.at/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },

  // ========== ENGLISCH (USA / International) ==========
  { name: 'Animal Rescue Flights (ARF)', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://www.animalrescueflights.org/', email: null, contactFormUrl: 'https://www.animalrescueflights.org/', mediationType: 'ANIMALS', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Pilots N Paws', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://www.pilotsnpaws.org/', email: null, contactFormUrl: 'https://www.pilotsnpaws.org/', mediationType: 'ANIMALS', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Air Care Alliance', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://www.aircarealliance.org/', email: null, contactFormUrl: 'https://www.aircarealliance.org/getting-assistance/animal-rescue/', mediationType: 'ANIMALS', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Volunteer Pilots Network', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://www.volunteerpilots.net/', email: null, contactFormUrl: null, mediationType: 'MIXED', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Global Animal Rescue Network (GARN)', country: 'International', continent: 'Weltweit', websiteLanguage: 'Englisch', websiteUrl: 'https://globalanimalrescuenetwork.org/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },
  { name: 'Flight Angels (Puerto Rico)', country: 'Puerto Rico', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://flightangels.org/', email: null, contactFormUrl: 'https://flightangels.org/', mediationType: 'ANIMALS', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Mutt Mutt Engine – Flight Angel', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://www.muttmuttengine.org/become-a-flight-angel.html', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: "Charlie's Angels Rescue", country: 'USA / Costa Rica', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://www.charlies-angels-rescue.org/flight-angel', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'SWATT – Southwest Animal Transport Team', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://swattransport.org/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Petflight – Rescue Transports', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://www.petflight.com/rescue_transports', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'NO' },
  { name: 'Angel Flight (US)', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://www.angelflight.com/', email: null, contactFormUrl: 'https://www.angelflight.com/locator/', mediationType: 'MEDICAL', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Air Rescue – Angel Flights', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://www.air-rescue.org/angel-flights', email: null, contactFormUrl: null, mediationType: 'MEDICAL', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Invisible Angels (Human Trafficking Survivors)', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://www.invisibleangels.org/', email: null, contactFormUrl: null, mediationType: 'HUMANITARIAN', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Help the Dog Fly', country: 'International', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: 'https://www.helpthedogfly.com/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Soi Dog Foundation – Flight Volunteer', country: 'Thailand', continent: 'Asien', websiteLanguage: 'Englisch', websiteUrl: 'https://www.soidog.org/content/become-flight-volunteer', email: 'logistics@soidog.org', contactFormUrl: 'https://www.soidog.org/content/volunteer-booking-form', mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'NO' },
  { name: 'Aviation Charities – Animal Rescue', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: 'https://aviationcharities.com/animal-rescue', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'NO' },

  // ========== ENGLISCH (UK / Europa) ==========
  { name: 'Angel Flight Europe', country: 'Europa', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: 'https://www.angelflight.eu/', email: null, contactFormUrl: 'https://www.angelflight.eu/where-we-fly', mediationType: 'MEDICAL', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'RACE – Romanian Animal Care Europe', country: 'Rumänien / UK', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: 'https://raceromanian.org/', email: null, contactFormUrl: 'https://raceromanian.org/adoption-process', mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'NO' },
  { name: 'Romanian Rescue Appeal UK (RRAUK) – Romanian Rescue Bus', country: 'UK', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: 'https://rrauk.com/', email: null, contactFormUrl: 'https://rrauk.com/rra-transporting-dogs-safely-from-romania-to-uk/', mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'NO' },
  { name: 'Santerpaws Bulgarian Rescue', country: 'Bulgarien / UK', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: 'https://santerpawsbulgarianrescue.com/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'NO' },
  { name: 'Rescue Dogs for Adoption – Pet Transport Bulgaria', country: 'UK / Bulgarien', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: 'https://www.rescuedogsforadoption.co.uk/', email: null, contactFormUrl: 'https://www.rescuedogsforadoption.co.uk/pet-transport-bulgaria', mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'NO' },
  { name: 'ALStrays – Pet Transporters', country: 'UK', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: 'https://alstrays.com/pet-transporters/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'NO' },
  { name: '101 Pet Express (European Transport)', country: 'UK', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: 'https://101petexpress.com/european-transport/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Air Rescue Channel Islands', country: 'Channel Islands', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: 'https://www.air-rescue.org/', email: null, contactFormUrl: null, mediationType: 'MEDICAL', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'NO' },

  // ========== SPANISCH ==========
  { name: 'Patas y Pilotos', country: 'Spanien', continent: 'Europa', websiteLanguage: 'Spanisch', websiteUrl: 'https://patasypilotos.com/', email: null, contactFormUrl: 'https://patasypilotos.com/', mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },
  { name: 'Fundación Bienestar Animal de España', country: 'Spanien', continent: 'Europa', websiteLanguage: 'Spanisch', websiteUrl: 'https://fundacionbienestaranimaldeespana.es/colabora/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },
  { name: 'Woof Airlines', country: 'Spanien', continent: 'Europa', websiteLanguage: 'Spanisch', websiteUrl: 'https://www.woofairlines.com/es', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },

  // ========== FRANZÖSISCH ==========
  { name: 'Anivetvoyage', country: 'Frankreich', continent: 'Europa', websiteLanguage: 'Französisch', websiteUrl: 'https://www.anivetvoyage.com/', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },
  { name: 'Fondation Droit Animal', country: 'Frankreich', continent: 'Europa', websiteLanguage: 'Französisch', websiteUrl: 'https://www.fondation-droit-animal.org/', email: null, contactFormUrl: 'https://www.fondation-droit-animal.org/informations-juridiques/voyager-avec-ou-sans-son-animal/', mediationType: 'MIXED', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },

  // ========== WEITERE (Italienisch / Mehrsprachig / Sonstige) ==========
  { name: 'Golden Paws Pet Transport', country: 'Spanien / UK', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: null, email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },
  { name: 'Pet Transport Solutions', country: 'UK / Europa', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: null, email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },
  { name: 'Ella\'s Paws Transport', country: 'UK', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: null, email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },
  { name: 'AJT Pet Transport', country: 'Europa', continent: 'Europa', websiteLanguage: 'Englisch', websiteUrl: null, email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'UNKNOWN', mediatesFromGermany: 'UNKNOWN' },
  { name: 'Central Valley Rescue Railroad', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: null, email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Rescue Express', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: null, email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'The Underdog Railroad', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: null, email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Animal Rescue Transport Network', country: 'USA', continent: 'Nordamerika', websiteLanguage: 'Englisch', websiteUrl: null, email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'NO', mediatesFromGermany: 'NO' },
  { name: 'Flugpate.com – Partnervereine Griechenland', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.flugpate.com/partnervereine_gr.php', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Flugpate.com – Partnervereine Portugal', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.flugpate.com/partnervereine_pt.php', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Flugpate.com – Partnervereine Bulgarien', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.flugpate.com/partnervereine_bu.php', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
  { name: 'Flugpate.com – Partnervereine Spanien', country: 'Deutschland', continent: 'Europa', websiteLanguage: 'Deutsch', websiteUrl: 'https://www.flugpate.com/partnervereine_ae.php', email: null, contactFormUrl: null, mediationType: 'ANIMALS', mediatesToGermany: 'YES', mediatesFromGermany: 'YES' },
]

async function main() {
  let created = 0
  for (const c of contacts) {
    const existing = await prisma.acquisitionContact.findFirst({ where: { name: c.name } })
    if (!existing) {
      await prisma.acquisitionContact.create({
        data: {
          name: c.name,
          country: c.country,
          continent: c.continent,
          websiteLanguage: c.websiteLanguage,
          websiteUrl: c.websiteUrl,
          email: c.email,
          contactFormUrl: c.contactFormUrl,
          mediationType: c.mediationType,
          mediatesToGermany: c.mediatesToGermany,
          mediatesFromGermany: c.mediatesFromGermany,
        },
      })
      created++
    }
  }
  console.log('Acquise seed: %d neue Kontakte angelegt (gesamt %d in Liste).', created, contacts.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
