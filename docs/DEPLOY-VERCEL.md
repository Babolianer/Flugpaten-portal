# Deployment auf Vercel

Kurzanleitung für das Flugpaten-Portal mit Supabase (PostgreSQL) + Prisma.

---

## 1. Voraussetzungen

- GitHub-Repository mit gepushtem Code
- Supabase-Projekt mit PostgreSQL
- Vercel-Account

---

## 2. Projekt auf Vercel verbinden

1. **Vercel Dashboard** → **Add New** → **Project**
2. GitHub-Repository verbinden und auswählen
3. Framework Preset: **Nuxt** (wird meist automatisch erkannt)
4. Root Directory: leer lassen

---

## 3. Umgebungsvariablen

Unter **Settings** → **Environment Variables** setzen:

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `DATABASE_URL` | **Supabase Pooler** (Port 6543), mit `?pgbouncer=true&connection_limit=1&sslmode=require` | siehe unten |
| `SUPABASE_URL` | Supabase Projekt-URL (für Storage) | `https://<PROJECT_REF>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-Role-Key (für Storage-Uploads) | Dashboard → API → service_role |
| `JWT_SECRET` | Geheimer Schlüssel (min. 32 Zeichen) | z. B. `openssl rand -base64 32` |
| `NUXT_PUBLIC_APP_URL` | Öffentliche URL | `https://flugpaten-portal.vercel.app` |

### DATABASE_URL für Serverless

**Wichtig:** Supabase **Transaction Pooler** verwenden (nicht Direct) **und** `pgbouncer=true` setzen:

```
postgresql://postgres.[PROJECT_REF]:[PASS]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
```

- `[PROJECT_REF]` durch deine Supabase-Project-ID ersetzen
- `[PASS]` durch dein DB-Passwort; Sonderzeichen URL-encodieren (z. B. `!` → `%21`)
- `pgbouncer=true` – **Pflicht** für Supabase Pooler, deaktiviert Prepared Statements (sonst Fehler „prepared statement already exists“)
- `connection_limit=1` reduziert Verbindungen pro Serverless-Instanz

---

## 4. Deploy

- **Deploy** starten
- Nach Erfolg: URL z. B. `https://flugpaten-portal-xxx.vercel.app`
- `NUXT_PUBLIC_APP_URL` ggf. auf die finale URL anpassen und redeployen

---

## 5. Troubleshooting

### 500 Internal Server Error / „prepared statement already exists“

- **DATABASE_URL** muss `pgbouncer=true` enthalten (sonst Fehler 42P05)
- Pooler-URL (6543), `connection_limit=1`, `sslmode=require`
- Passwort in der URL encodieren (`!` → `%21`, `@` → `%40`, etc.)
- Supabase-Projekt nicht pausiert (Free Tier)

### Tierbilder / Supabase Storage

Tierbilder werden in Supabase Storage hochgeladen. Dafür brauchst du:

1. **Bucket erstellen:** SQL in Supabase SQL Editor ausführen (`prisma/scripts/supabase-storage-animals.sql`)
2. **Env-Variablen:** `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` in Vercel setzen (siehe Tabelle oben)

### Prisma-Client-Verhalten

Der Prisma-Client wird für Serverless gecacht (`server/utils/prisma.ts`), damit keine unnötigen DB-Verbindungen entstehen.
