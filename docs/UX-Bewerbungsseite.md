# UX-Analyse: „Als Flugpate bewerben“ (/requests/[id])

**Ziele:** Vertrauen aufbauen, Abbruchrate senken, Formular schnell und klar, mobil & desktop optimiert.

---

## 1. Informationshierarchie & Klarheit

- **Schnellverständnis (<10 Sek.):** Die Seite zeigt zuerst Request-Titel, Tier (Name, Art), Route und Zeitraum – gut. Ein klarer Einleitungssatz direkt über dem Formular fehlt.
- **Empfehlung:** Direkt unter der Überschrift „Als Flugpate bewerben“ einen Satz wie: „Mit dieser Bewerbung nimmst du Kontakt mit der Organisation auf. Nur die mit * markierten Felder sind Pflicht.“

**Quick Win:** Kurzer Hinweistext vor dem Formular (s. oben).

---

## 2. Formular-UX & Conversion

| Thema | Ist | Soll |
|-------|-----|------|
| **Pflicht vs. optional** | Nur vereinzelt * (Vorname, Nachname, E-Mail, Nachricht, Datenschutz). Viele Felder wirken gleich wichtig. | Alle optionalen Felder einheitlich kennzeichnen (z. B. „optional“ im Label). |
| **Feldreihenfolge** | Reiseinfos (Ziel, Flughäfen, Datum) vor Kontaktdaten. | Beibehalten; Kontakt am Ende ist sinnvoll. Zusätzlich: Tiername (z. B. „Luna“) in der Request-Zusammenfassung oben stärker hervorheben. |
| **Labels & Hilfetexte** | Teilweise knapp (z. B. „Reiseziel“). | Bei Reiseziel: „Wohin fliegst du?“; bei Nachricht: „Stell dich kurz vor und nenne dein Reisedatum (falls schon bekannt).“ |
| **Anzahl Felder** | Viele Felder (u. a. zwei Telefonfelder). | Telefon + Handy zu einem Feld „Telefon (optional)“ zusammenfassen. Anzahl reisender Personen nur anzeigen, wenn für die Organisation relevant (oder als optional belassen). |

**Quick Wins:** (1) „optional“ bei allen nicht verpflichtenden Feldern. (2) Hilfetext bei „Ihre Nachricht“ konkretisieren.

---

## 3. Vertrauen & Sicherheit

- **Trust-Elemente:** Organisation verlinkt, Kontaktbox vorhanden. Datenschutz-Checkbox vorhanden.
- **Fehlend:** Kurzer Hinweis zur Seriosität (z. B. „Alle Organisationen sind von uns geprüft“). Link zur Datenschutzerklärung neben der Checkbox.
- **Empfehlung:** Über dem Formular einen Satz: „Deine Angaben gehen ausschließlich an die genannte Organisation und werden DSGVO-konform verarbeitet.“ + Link „Datenschutz“ neben der Checkbox.

**Quick Win:** Datenschutz-Link neben der Checkbox einbauen (z. B. zu /datenschutz).

---

## 4. Call-to-Action

- **Aktuell:** „Bewerbung absenden“ – sachlich, klar.
- **Alternativen:** „Kontakt anfragen“ (weniger formal), „Bewerbung senden“ (gleich).
- **Position:** CTA am Ende des Formulars – gut. Größerer, deutlich sichtbarer Button (z. B. vollbreit auf Mobil) steigert die Sichtbarkeit.

**Quick Win:** Button auf Mobil full-width, etwas größer (py-3), evtl. „Jetzt Bewerbung senden“.

---

## 5. Emotion & Motivation

- **Tier („Luna“):** Der Tiername erscheint nur einmal (request.animal.name). Er könnte in der Überschrift oder in einem kurzen Teaser genutzt werden: „Luna sucht eine Begleitung von MUC nach ZRH.“
- **Mikrotexte:** Nach Absenden: „Danke! Die Organisation meldet sich bei dir.“ – bereits gut. Optional: „Du hilfst damit einem Tier in ein neues Zuhause.“

**Größere Maßnahme:** Dynamische Headline/Untertitel mit Tiername und Route (z. B. „Luna von München nach Zürich begleiten“).

---

## 6. Barrierefreiheit & Verständlichkeit

- **Kontrast:** Slate-Text auf Weiß – ausreichend. Buttons (amber) prüfen (Kontrast zu Weiß).
- **Sprache:** „Bitte füllen Sie…“ – konsistent „Sie“ beibehalten oder auf „Du“ umstellen, je nach Rest der Seite.
- **Fehlermeldungen:** Aktuell nur alert(). Besser: Inline-Fehler unter den Feldern und Zusammenfassung oben.

**Quick Win:** Einheitliche Ansprache (Du/Sie) auf der gesamten Seite prüfen.

---

## 7. Mobile Optimierung

- **Kritisch:** Zwei Spalten (grid-cols-2) können auf kleinen Screens zu eng sein. Abflug/Ankunft, Reise von/bis, Telefon/Handy in einer Spalte auf Mobil stapeln (grid-cols-1 unter z. B. 640px).
- **Touch:** Buttons und Checkboxen groß genug (min-touch-target 44px). File-Upload auf Mobil oft umständlich – Hinweis „Optional“ und max. Dateigröße beibehalten.

**Quick Win:** Unter sm: grid-cols-1 für Formularzeilen mit zwei Feldern.

---

## Übersicht: Quick Wins vs. größere Maßnahmen

| Quick Wins | Größere UX-Maßnahmen |
|------------|----------------------|
| Hinweistext „Pflicht/Optional“ + kurzer Intro-Text | Tiername in Headline/Teaser |
| „optional“ in Labels | Telefon + Handy zu einem Feld |
| Datenschutz-Link neben Checkbox | Inline-Validierung statt alert |
| CTA-Button mobil full-width, etwas größer | Trust-Block „Geprüfte Organisationen“ + DSGVO-Satz |
| Hilfetext für Nachricht konkretisieren | Einheitliche Du-/Sie-Ansprache im Projekt |
| Formular auf Mobil einspaltig (grid) | |

Die unten umgesetzten Änderungen entsprechen ausgewählten Quick Wins.
