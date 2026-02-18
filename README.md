# Tierschutz-Flugpaten Portal

Ein Nuxt-3-Portal zur Vermittlung von Tier-Transporten über Flugpaten. Reisende können Transport-Anfragen von Tierschutzorganisationen finden und sich darauf bewerben.

## Tech-Stack

- **Nuxt 3** + TypeScript
- **TailwindCSS** für das UI
- **MapLibre GL JS** + OpenStreetMap Tiles (ohne API-Key)
- **Prisma** + **PostgreSQL** (Supabase)
- **Zod** für Validierung
- **bcrypt** für Passwort-Hashing
- **jose** (JWT) + httpOnly Cookies für Sessions

## Rollen

- **USER**: Flugpate – kann Transport-Anfragen suchen und sich bewerben
- **ORG_USER**: Organisation – kann Organisation anlegen (nach Admin-Freigabe), Locations, Tiere und Transport-Anfragen verwalten
- **ADMIN**: Kann neue Organisationen freigeben (Approve/Reject)

## Setup

### Voraussetzungen

- **Node.js 18+** (Node 21 funktioniert mit eingebautem Patch)
- Supabase-Account (oder PostgreSQL)

### 1. Ordner öffnen

```bash
cd tierschtuz-flugpaten-portal
```

### 2. Supabase-Projekt (oder Docker)

1. Erstelle ein Projekt auf [supabase.com](https://supabase.com)
2. Gehe zu **Project Settings** → **Database** → **Connection string** (URI)
3. Kopiere den **Direct connection** String (Port 5432)

### 3. Umgebungsvariablen

```bash
cp .env.example .env
```

Bearbeite `.env` und setze:

```
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[DEIN_PASSWORT]@db.[PROJECT_REF].supabase.co:5432/postgres"
JWT_SECRET="ein-sicheres-geheimnis-fuer-production"
NUXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Installation

```bash
npm install
```

### 5. Datenbank

**Option A – Supabase:** Trage deine `DATABASE_URL` in `.env` ein (siehe Schritt 3).

**Option B – Lokal mit Docker:**

```bash
docker compose up -d
```

Die `.env` ist bereits für lokale PostgreSQL vorkonfiguriert.

Dann:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 6. Entwicklungsserver starten

```bash
npm run dev
```

Die App läuft unter [http://localhost:3000](http://localhost:3000).

**Hinweis:** Ein Patch für `@vue-macros/common` (Node 21 Kompatibilität) wird bei `npm install` automatisch angewendet.

## Testzugänge (nach Seed)

| E-Mail                  | Passwort   | Rolle    |
|-------------------------|------------|----------|
| admin@tierschutz.de     | password123| ADMIN    |
| user1@example.com       | password123| USER     |
| user2@example.com       | password123| USER     |
| org@tierrettung.de      | password123| ORG_USER |
| org2@tierschutz-hilfe.de| password123| ORG_USER |

## Features

- **Landingpage**: Hero mit CTA „Karte öffnen“
- **Karte** (`/map`): MapLibre-Weltkarte mit Pins (Requests + Org-Standorte), Filter (Datum, Airports, Tierart), Ergebnisliste
- **Org-Landingpage** (`/org/:slug`): Öffentliche Infos, Standorte auf Karte, aktive Anfragen
- **Auth**: Register (USER/ORG_USER), Login, Session via JWT-Cookie
- **Org-Registrierung**: ORG_USER legt Org an → Status PENDING → Admin genehmigt
- **Org-Dashboard** (`/org/dashboard`): Locations, Tiere, Transport-Anfragen erstellen (nur bei genehmigter Org)
- **Admin** (`/admin`): Pending Orgs genehmigen/ablehnen
- **Bewerben**: USER kann auf Request klicken → Details → Nachricht senden (RequestApplication + Conversation)

## Projektstruktur

```
├── prisma/schema.prisma
├── prisma/seed.ts
├── server/
│   ├── utils/auth.ts, prisma.ts
│   ├── middleware/auth.ts
│   └── api/auth/*, org/*, admin/*, map/*, requests/*
├── pages/
│   ├── index.vue (Hero)
│   ├── map.vue
│   ├── login.vue, register.vue
│   ├── dashboard.vue (USER)
│   ├── admin.vue
│   ├── org/[slug].vue, org/dashboard.vue, org/register.vue
│   └── requests/[id].vue
├── components/
│   ├── MapView.vue, FilterBar.vue
│   ├── RequestCard.vue, OrgCard.vue
│   └── LayoutHeader.vue
└── layouts/default.vue
```

## Lizenz

Privat / Projekt-spezifisch.
