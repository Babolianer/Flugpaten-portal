import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12)
  const adminPasswordHash = await bcrypt.hash('b2bsellers', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tierschutz.de' },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: 'admin@tierschutz.de',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      displayName: 'Admin User',
      phone: null,
    },
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      passwordHash,
      role: 'USER',
      displayName: 'Max Mustermann',
      phone: null,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      passwordHash,
      role: 'USER',
      displayName: 'Anna Schmidt',
      phone: null,
    },
  })

  const orgUser = await prisma.user.upsert({
    where: { email: 'org@tierrettung.de' },
    update: {},
    create: {
      email: 'org@tierrettung.de',
      passwordHash,
      role: 'ORG_USER',
      displayName: 'Tierrettung e.V.',
      phone: null,
    },
  })

  const orgUser2 = await prisma.user.upsert({
    where: { email: 'org2@tierschutz-hilfe.de' },
    update: {},
    create: {
      email: 'org2@tierschutz-hilfe.de',
      passwordHash,
      role: 'ORG_USER',
      displayName: 'Tierschutz-Hilfe gGmbH',
      phone: null,
    },
  })

  const org1 = await prisma.organization.upsert({
    where: { slug: 'tierrettung-ev' },
    update: {},
    create: {
      name: 'Tierrettung e.V.',
      slug: 'tierrettung-ev',
      description: 'Wir retten und vermitteln Tiere in Not.',
      website: 'https://tierrettung.de',
      contactEmail: 'kontakt@tierrettung.de',
      status: 'APPROVED',
      logoUrl: null,
      createdByUserId: orgUser.id,
    },
  })

  const org2 = await prisma.organization.upsert({
    where: { slug: 'tierschutz-hilfe' },
    update: {},
    create: {
      name: 'Tierschutz-Hilfe gGmbH',
      slug: 'tierschutz-hilfe',
      description: 'Internationaler Tierschutz und Tiervermittlung.',
      website: 'https://tierschutz-hilfe.de',
      contactEmail: 'info@tierschutz-hilfe.de',
      status: 'APPROVED',
      logoUrl: null,
      createdByUserId: orgUser2.id,
    },
  })

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId: org1.id, userId: orgUser.id },
    },
    update: {},
    create: {
      organizationId: org1.id,
      userId: orgUser.id,
      memberRole: 'OWNER',
    },
  })

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId: org2.id, userId: orgUser2.id },
    },
    update: {},
    create: {
      organizationId: org2.id,
      userId: orgUser2.id,
      memberRole: 'OWNER',
    },
  })

  const loc1 = await prisma.orgLocation.create({
    data: {
      organizationId: org1.id,
      title: 'Auffangstation Berlin',
      countryCode: 'DE',
      city: 'Berlin',
      address: 'Musterstraße 1',
      lat: 52.52,
      lng: 13.405,
    },
  })

  const loc2 = await prisma.orgLocation.create({
    data: {
      organizationId: org1.id,
      title: 'Zweigstelle Hamburg',
      countryCode: 'DE',
      city: 'Hamburg',
      address: 'Beispielweg 5',
      lat: 53.5511,
      lng: 9.9937,
    },
  })

  const loc3 = await prisma.orgLocation.create({
    data: {
      organizationId: org2.id,
      title: 'Zentrale München',
      countryCode: 'DE',
      city: 'München',
      address: 'Testallee 10',
      lat: 48.1351,
      lng: 11.582,
    },
  })

  const animal1 = await prisma.animal.create({
    data: {
      organizationId: org1.id,
      name: 'Luna',
      species: 'cat',
      sex: 'female',
      sizeClass: 'medium',
      birthdate: new Date('2022-03-15'),
      notes: 'Freundlich, verträgt sich mit Hunden',
      isActive: true,
    },
  })

  const animal2 = await prisma.animal.create({
    data: {
      organizationId: org1.id,
      name: 'Bello',
      species: 'dog',
      sex: 'male',
      sizeClass: 'large',
      birthdate: new Date('2020-07-20'),
      notes: null,
      isActive: true,
    },
  })

  const animal3 = await prisma.animal.create({
    data: {
      organizationId: org2.id,
      name: 'Mimi',
      species: 'cat',
      sex: 'female',
      sizeClass: 'small',
      birthdate: new Date('2023-01-10'),
      notes: null,
      isActive: true,
    },
  })

  const req1 = await prisma.transportRequest.create({
    data: {
      organizationId: org1.id,
      animalId: animal1.id,
      title: 'Luna nach Amsterdam',
      details: 'Transport einer 2-jährigen Katze von Berlin nach Amsterdam.',
      status: 'OPEN',
      earliestDate: new Date('2025-03-01'),
      latestDate: new Date('2025-03-15'),
      originAirport: 'TXL',
      destAirport: 'AMS',
      originLat: 52.5597,
      originLng: 13.2877,
      destLat: 52.3105,
      destLng: 4.7683,
    },
  })

  const req2 = await prisma.transportRequest.create({
    data: {
      organizationId: org1.id,
      animalId: animal2.id,
      title: 'Bello nach Wien',
      details: 'Großer Hund, Transport von Hamburg nach Wien.',
      status: 'OPEN',
      earliestDate: new Date('2025-04-01'),
      latestDate: new Date('2025-04-30'),
      originAirport: 'HAM',
      destAirport: 'VIE',
      originLat: 53.5511,
      originLng: 9.9937,
      destLat: 48.1103,
      destLng: 16.5697,
    },
  })

  const req3 = await prisma.transportRequest.create({
    data: {
      organizationId: org2.id,
      animalId: animal3.id,
      title: 'Mimi nach Zürich',
      details: 'Kleine Katze, Transport München-Zürich.',
      status: 'OPEN',
      earliestDate: new Date('2025-03-10'),
      latestDate: new Date('2025-03-20'),
      originAirport: 'MUC',
      destAirport: 'ZRH',
      originLat: 48.1351,
      originLng: 11.582,
      destLat: 47.4647,
      destLng: 8.5492,
    },
  })

  await prisma.transportRequest.create({
    data: {
      organizationId: org2.id,
      animalId: null,
      title: 'Dringender Transport nach Barcelona',
      details: 'Kurzfristiger Transport benötigt.',
      status: 'OPEN',
      earliestDate: new Date('2025-05-01'),
      latestDate: new Date('2025-05-15'),
      originAirport: 'MUC',
      destAirport: 'BCN',
      originLat: 48.1351,
      originLng: 11.582,
      destLat: 41.2971,
      destLng: 2.0785,
    },
  })

  console.log('Seed completed:')
  console.log('- Users:', admin.email, user1.email, user2.email, orgUser.email, orgUser2.email)
  console.log('- Orgs:', org1.slug, org2.slug)
  console.log('- Locations:', loc1.title, loc2.title, loc3.title)
  console.log('- Animals:', animal1.name, animal2.name, animal3.name)
  console.log('- Requests: 4 created')
  console.log('Admin-Login (Wartungsseite): admin@tierschutz.de / b2bsellers')
  console.log('Default password for other seed users: password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
