# Übersetzungen

- **Quellsprache:** Deutsch (`locales/de.json`) – alle Texte der App stehen hier.
- **Zielsprachen:** Englisch, Französisch, Spanisch, Italienisch, Polnisch (`locales/en.json`, `fr.json`, `es.json`, `it.json`, `pl.json`).

## Ablauf: Deutsch anpassen → alle Sprachen aktualisieren

1. Texte in **`locales/de.json`** bearbeiten (Deutsch ist die Quelle).
2. Im Projektordner ausführen:
   ```bash
   npm run translate
   ```
3. Das Script übersetzt alle Einträge aus `de.json` in die anderen Sprachen und schreibt die Dateien in `locales/` neu.

**Hinweis:** Es wird die kostenlose MyMemory-API genutzt (kein API-Key nötig). Optional kann für bessere Qualität `LIBRETRANSLATE_API_KEY` in der `.env` gesetzt werden; dann wird zuerst LibreTranslate verwendet.

## API (optional)

- **POST `/api/translate`** – Einzeltext übersetzen (Body: `{ "text": "...", "targetLang": "en" }`). Für eigene Tools oder Admin-Oberflächen.

## Sprachen im Frontend

Im Header gibt es ein **Sprach-Dropdown** (Deutsch, English, Français, Español, Italiano, Polski). Die Auswahl wird im Cookie gespeichert.
