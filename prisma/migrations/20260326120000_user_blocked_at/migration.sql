-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "blocked_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_blocked_at_idx" ON "User"("blocked_at");
