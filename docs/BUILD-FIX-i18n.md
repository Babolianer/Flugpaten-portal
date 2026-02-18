# Build-Fehler: oxc-parser / i18n unter Windows

## Fehlermeldung
`Cannot find module '@oxc-parser/binding-win32-x64-msvc'` bzw. `./parser.win32-x64-msvc.node`

## Ursache
@nuxtjs/i18n nutzt zur Build-Zeit den Parser „oxc“. Dessen Windows-Native-Binding wird als optionale Dependency installiert – unter Windows passiert das oft fehlerhaft (npm-Bug mit optionalen Abhängigkeiten).

## Schritte (der Reihe nach versuchen)

### 1. Node-Version prüfen
Projekt unterstützt **Node >= 20** (siehe `package.json` → engines).

- Node-Version anzeigen: `node -v`
- Empfohlen: **Node 20 LTS** oder **Node 22** (nicht 21).

### 2. Saubere Neuinstallation
In PowerShell im Projektordner:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

Danach: `npm run build` erneut ausführen.

### 3. Optionale Dependencies erzwingen
Falls der Fehler bleibt:

```powershell
npm install --include=optional
npm run build
```

### 4. Wenn es weiterhin scheitert
Dann auf die **leichtgewichtige i18n-Alternative** umstellen (ohne @nuxtjs/i18n), siehe Anleitung im Projekt – dann wird oxc-parser nicht mehr benötigt und der Build läuft ohne Native-Module.
