-- Supabase Storage: Bucket für Profilbilder
-- In Supabase SQL Editor ausführen: https://supabase.com/dashboard → Project → SQL Editor → New query
--
-- Vorher in .env setzen (Dashboard → Settings → API):
--   SUPABASE_URL=https://<PROJECT_REF>.supabase.co
--   SUPABASE_SERVICE_ROLE_KEY=... („service_role“ Key, NICHT anon)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
