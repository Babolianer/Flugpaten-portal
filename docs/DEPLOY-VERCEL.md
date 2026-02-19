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
| `DATABASE_URL` | **Supabase Pooler** (Port 6543), mit `?connection_limit=1&sslmode=require` | siehe unten |
| `JWT_SECRET` | Geheimer Schlüssel (min. 32 Zeichen) | z. B. `openssl rand -base64 32` |
| `NUXT_PUBLIC_APP_URL` | Öffentliche URL | `https://flugpaten-portal.vercel.app` |

### DATABASE_URL für Serverless

**Wichtig:** Supabase **Transaction Pooler** verwenden (nicht Direct):

```
postgresql://postgres.[PROJECT_REF]:[PASS]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&connection_limit=1
```

- `[PROJECT_REF]` durch deine Supabase-Project-ID ersetzen
- `[PASS]` durch dein DB-Passwort; Sonderzeichen URL-encodieren (z. B. `!` → `%21`)
- `connection_limit=1` reduziert Verbindungen pro Serverless-Instanz

---

## 4. Deploy

- **Deploy** starten
- Nach Erfolg: URL z. B. `https://flugpaten-portal-xxx.vercel.app`
- `NUXT_PUBLIC_APP_URL` ggf. auf die finale URL anpassen und redeployen

---

## 5. Troubleshooting

### 500 Internal Server Error / keine Pins / Login funktioniert nicht

- **DATABASE_URL** mit Pooler-URL (6543) und `connection_limit=1` prüfen
- Passwort in der URL encodieren (`!` → `%21`, `@` → `%40`, etc.)
- Supabase-Projekt nicht pausiert (Free Tier)

### Prisma-Client-Verhalten

Der Prisma-Client wird für Serverless gecacht (`server/utils/prisma.ts`), damit keine unnötigen DB-Verbindungen entstehen.
