-- Add approval flag for maintenance-mode registrations.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "is_approved" BOOLEAN NOT NULL DEFAULT true;
