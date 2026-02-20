-- AlterTable
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "org_response" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "org_response_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReviewReport" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReviewReport_review_id_idx" ON "ReviewReport"("review_id");

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
