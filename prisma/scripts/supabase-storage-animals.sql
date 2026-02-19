-- Supabase Storage: Bucket für Tierbilder
-- In Supabase SQL Editor ausführen: https://supabase.com/dashboard → SQL Editor → New query
--
-- Danach in .env und Vercel setzen:
--   SUPABASE_URL=https://<PROJECT_REF>.supabase.co
--   SUPABASE_SERVICE_ROLE_KEY=... (Dashboard → API → service_role)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'animals',
  'animals',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
