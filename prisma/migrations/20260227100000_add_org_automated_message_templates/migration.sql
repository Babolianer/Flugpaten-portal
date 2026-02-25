-- AlterTable
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "automated_message_template_1" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "automated_message_template_2" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "automated_message_template_3" TEXT;
