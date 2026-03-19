-- Add waiting list toggle per transport request
ALTER TABLE "TransportRequest"
ADD COLUMN IF NOT EXISTS "waiting_list_enabled" BOOLEAN NOT NULL DEFAULT false;

