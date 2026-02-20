-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verify_token" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verify_token_expires" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;

-- Set email_verified = true for existing users (backward compatibility)
UPDATE "User" SET "email_verified" = true WHERE "email_verified" = false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "avatar_url" TEXT,
    "city" TEXT,
    "country_code" TEXT,
    "about_me" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_routes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "frequent_airports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "reviewer_user_id" TEXT NOT NULL,
    "reviewee_user_id" TEXT,
    "reviewee_org_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_user_id_key" ON "UserProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Review_request_id_reviewer_user_id_reviewee_user_id_reviewee_org_id_key" ON "Review"("request_id", "reviewer_user_id", "reviewee_user_id", "reviewee_org_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Review_request_id_idx" ON "Review"("request_id");
CREATE INDEX IF NOT EXISTS "Review_reviewee_user_id_idx" ON "Review"("reviewee_user_id");
CREATE INDEX IF NOT EXISTS "Review_reviewee_org_id_idx" ON "Review"("reviewee_org_id");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "TransportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewee_user_id_fkey" FOREIGN KEY ("reviewee_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewee_org_id_fkey" FOREIGN KEY ("reviewee_org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
