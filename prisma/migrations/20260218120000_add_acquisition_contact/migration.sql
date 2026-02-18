-- CreateEnum
CREATE TYPE "MediationType" AS ENUM ('ANIMALS', 'HUMANITARIAN', 'MEDICAL', 'MIXED');

-- CreateEnum
CREATE TYPE "MediatesGermany" AS ENUM ('YES', 'NO', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AcquisitionStatus" AS ENUM ('OPEN', 'CONTACTED', 'REPLIED', 'REGISTERED', 'REJECTED');

-- CreateTable
CREATE TABLE "AcquisitionContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "website_language" TEXT NOT NULL,
    "website_url" TEXT,
    "email" TEXT,
    "contact_form_url" TEXT,
    "mediation_type" "MediationType" NOT NULL,
    "mediates_to_germany" "MediatesGermany" NOT NULL,
    "mediates_from_germany" "MediatesGermany" NOT NULL,
    "notes" TEXT,
    "noted" BOOLEAN NOT NULL DEFAULT false,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "status" "AcquisitionStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcquisitionContact_pkey" PRIMARY KEY ("id")
);
