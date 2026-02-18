# Deployment auf Render.com

Anleitung vom Repository-Setup bis zur live gehosteten Seite inkl. Wartungsmodus.

---

## 1. Projekt vorbereiten (lokal)

### 1.1 Migration & Seed (falls noch nicht geschehen)

```bash
# Abhängigkeiten
npm install

# Prisma Client erzeugen
npx prisma generate

# Migrationen anwenden (braucht DATABASE_URL – siehe unten)
npx prisma migrate deploy

# Optional: Seed (legt u. a. Admin an: admin@tierschutz.de / b2bsellers)
npx prisma db seed
```

### 1.2 Git-Repository (z. B. GitHub)

- Projekt in ein Git-Repository committen.
- Repository auf GitHub (oder GitLab) pushen.
- Dieses Repository später in Render verbinden.

---

## 2. Datenbank auf Render anlegen

1. **Render Dashboard** → **New** → **PostgreSQL**.
2. **Name** z. B. `tierschutz-flugpaten-db`.
3. **Region** wählen (z. B. Frankfurt).
4. **Create Database**.
5. Nach dem Erstellen:
   - Unter **Connections** die **Internal Database URL** kopieren (für Render-Services).
   - Diese URL ist dein `DATABASE_URL` (beginnt mit `postgresql://`).

---

## 3. Web Service auf Render erstellen

1. **Render Dashboard** → **New** → **Web Service**.
2. **Repository** verbinden (GitHub/GitLab) und das Projekt-Repo auswählen.
3. **Name** z. B. `tierschutz-flugpaten-portal`.
4. **Region** wie bei der DB (z. B. Frankfurt).
5. **Branch** z. B. `main`.

### Build & Start

| Einstellung      | Wert |
|------------------|------|
| **Runtime**      | Node |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` oder `node .output/server/index.mjs` |

### Umgebungsvariablen (Environment)

Unter **Environment** folgende Variablen setzen:

| Variable | Beschreibung | Beispiel / Hinweis |
|----------|--------------|--------------------|
| `DATABASE_URL` | PostgreSQL-URL von der Render-Datenbank | `postgresql://user:pass@host/db?sslmode=require` (Internal URL aus Schritt 2) |
| `JWT_SECRET` | Geheimer Schlüssel für Sessions (min. 32 Zeichen) | Zufälliger String, z. B. mit `openssl rand -base64 32` erzeugen |
| `NODE_ENV` | Laufumgebung | `production` |
| `NUXT_PUBLIC_APP_URL` | Öffentliche URL der App | `https://dein-service-name.onrender.com` (nach erstem Deploy anpassen) |

Optional (für E-Mails, Übersetzung etc.):

- `RESEND_API_KEY` – Resend API Key
- `MAIL_FROM` – Absenderadresse für E-Mails
- `LIBRETRANSLATE_API_KEY` – falls Übersetzung genutzt wird

**Hinweis:** Render setzt `PORT` automatisch; die Nuxt/Nitro-App nutzt diese Variable.

### Erster Deploy

- **Create Web Service** klicken.
- Render führt Build und Start aus. Beim ersten Mal kann das einige Minuten dauern.
- Nach Erfolg: URL z. B. `https://tierschutz-flugpaten-portal.onrender.com`.

---

## 4. Datenbank-Migrationen nach dem ersten Deploy

Wenn die DB neu ist und noch keine Tabellen hat:

**Option A – Automatisch beim Build (bereits im Build Command):**

- `prisma generate` läuft im Build.
- Migrationen müssen einmalig laufen. Dafür kannst du einen **Background Worker** oder ein **Shell Script** als separaten One-Off-Job nutzen, oder:

**Option B – Lokal gegen Render-DB:**

1. `DATABASE_URL` temporär auf die Render-**Internal Database URL** setzen (in `.env` oder Export).
2. Einmalig ausführen:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
3. Danach `DATABASE_URL` wieder auf deine lokale DB zurücksetzen.

**Option C – Render Shell:**

1. Im Render-Dashboard beim Web Service → **Shell** (falls angeboten).
2. Dort:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

Nach einer dieser Optionen sind Tabellen und Seed-Daten (inkl. Admin) vorhanden.

---

## 5. Wartungsmodus

### Standard nach Deploy

- Die App startet mit **Wartungsmodus aktiv**.
- Alle Besucher werden auf die Wartungsseite umgeleitet.
- **Nur Admins** können sich anmelden und die restliche Seite nutzen.

### Admin-Login (Wartungsseite)

- URL: `https://dein-service.onrender.com/maintenance`
- **E-Mail:** `admin@tierschutz.de`
- **Passwort:** `b2bsellers`

(nach `prisma db seed`; falls du den Admin anders angelegt hast, diese Zugangsdaten verwenden.)

### Wartungsmodus ein/aus

1. Mit obigen Zugangsdaten auf der Wartungsseite anmelden.
2. Du wirst ins **Admin-Panel** weitergeleitet.
3. Im Tab **Übersicht** findest du die Box **Wartungsmodus**.
4. Schalter auf **Aus** stellen → Seite ist für alle erreichbar.
5. Schalter auf **An** stellen → wieder nur Wartungsseite + Admin-Login.

---

## 6. Checkliste vor Go-Live

- [ ] `DATABASE_URL` zeigt auf die Render-PostgreSQL-DB.
- [ ] `JWT_SECRET` ist ein sicherer, langer Zufallsstring.
- [ ] `NUXT_PUBLIC_APP_URL` ist die finale Render-URL (mit `https://`).
- [ ] Migrationen wurden ausgeführt (`prisma migrate deploy`).
- [ ] Seed wurde ausgeführt (`prisma db seed`) oder Admin manuell angelegt.
- [ ] Einmal mit Admin auf der Wartungsseite eingeloggt und Wartungsmodus bei Bedarf ausgestellt.

---

## 7. Kurzreferenz Render

| Schritt | Aktion |
|--------|--------|
| 1 | PostgreSQL-Datenbank auf Render anlegen, **Internal Database URL** kopieren |
| 2 | Web Service erstellen, Repo verbinden |
| 3 | Build: `npm install && npx prisma generate && npm run build` |
| 4 | Start: `node .output/server/index.mjs` |
| 5 | Env: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `NUXT_PUBLIC_APP_URL` |
| 6 | Einmalig Migration + Seed (lokal gegen Render-DB oder per Render Shell) |
| 7 | Wartungsseite öffnen, als Admin einloggen, Wartungsmodus ggf. ausschalten |

Bei Fragen oder Fehlern: Logs im Render-Dashboard unter dem Web Service prüfen.
