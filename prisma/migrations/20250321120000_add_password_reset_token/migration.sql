-- AlterTable
ALTER TABLE "User" ADD COLUMN "password_reset_token" TEXT,
ADD COLUMN "password_reset_token_expires" TIMESTAMP(3);
