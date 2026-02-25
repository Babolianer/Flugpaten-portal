-- Add first_name and last_name to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "first_name" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_name" TEXT;
