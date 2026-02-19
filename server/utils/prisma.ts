import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// Immer cachen – wichtig für Vercel/Serverless, damit keine neuen Connections pro Request entstehen
globalForPrisma.prisma = prisma

// Tipp: Für Supabase Pooler (PgBouncer) DATABASE_URL muss pgbouncer=true enthalten:
// postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
