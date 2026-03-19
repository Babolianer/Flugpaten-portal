import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    // Adds the missing Postgres enum value used by the waiting list feature.
    await prisma.$executeRawUnsafe('ALTER TYPE "ApplicationStatus" ADD VALUE \'WAITING_LIST\'')
    console.log('WAITING_LIST enum value added.')
  } catch (e) {
    const msg = String(e?.message ?? e)
    // Duplicate enum value is safe to ignore.
    if (msg.includes('already exists') || msg.includes('duplicate key') || msg.includes('WAITING_LIST')) {
      console.log('WAITING_LIST enum value already present (or handled).')
    } else {
      console.error('Failed to ensure WAITING_LIST enum value:', msg)
      process.exitCode = 1
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()

