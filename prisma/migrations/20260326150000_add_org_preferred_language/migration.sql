ALTER TABLE "Organization"
ADD COLUMN "preferred_language" TEXT NOT NULL DEFAULT 'de';
In Render/Vercel/etc. müssen die Variablen im Environment gesetzt sein.