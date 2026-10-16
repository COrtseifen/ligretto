# Ligretto-Punktezähler

Eine kleine PWA, um beim Kartenspiel Ligretto die Punkte zu zählen – als Ersatz für Block und Stift.
Wird auf dem Handy am Spieltisch benutzt, muss also offline funktionieren und mit einer Hand bedienbar sein.

## Spielregeln (Punktewertung)

Pro Runde wird für jeden Spieler erfasst:
- **Tischkarten**: Karten, die der Spieler in die Mitte abgelegt hat → je **+1 Punkt** (erlaubt 0–40)
- **Restkarten**: Karten, die noch auf dem Ligretto-Stapel liegen → je **−2 Punkte** (erlaubt 0–10)

Rundenpunkte = Tischkarten − 2 × Restkarten
Der Gesamtstand ist die Summe aller Runden. Es gibt keine Zielpunktzahl: gespielt wird, bis man aufhört.

## Funktionen (erste Version)

- Neues Spiel starten, Spielernamen eingeben (Standard: 4 Spieler, 2–6 möglich)
  - Verstecktes Vorbelegen: 5× schnell auf die Überschrift tippen → „Christian", „Sarah", „Timo", „Steffi" (kein sichtbarer Button)
- Runde erfassen: pro Spieler Tischkarten und Restkarten als große Zahlenfelder (Zifferntastatur, min/max geprüft)
  - Rundenpunkte werden sofort angezeigt, bevor die Runde gespeichert wird
  - Danach „Weiterspielen" (nur wenn alle Werte gültig → neue Runde) oder „Spiel beenden" (→ Endübersicht)
- Übersicht: Gesamtstand pro Spieler, sortiert nach Platzierung
- Rundenverlauf als Tabelle (wie auf dem Block) und als Liniendiagramm (eigenes SVG, eine Farbe pro Spieler)
- Endübersicht mit Statistik pro Spieler: höchstes Rundenplus, meiste Tischkarten in einer Runde,
  größte Minuspunkte, Anzahl beendeter Runden (Restkarten = 0), Ø Tischkarten, Ø Restkarten
- Letzte Runde bearbeiten oder löschen (Tippfehler korrigieren)
- Spielstand wird automatisch gespeichert (localStorage) und überlebt Neuladen/Schließen

Noch nicht geplant: Accounts, Server, Synchronisierung zwischen Geräten.

## Technik

- Vite + TypeScript, ohne UI-Framework (Vanilla), damit es klein und verständlich bleibt
- vite-plugin-pwa für Manifest und Service Worker (offline-fähig, installierbar)
- Daten nur lokal im Browser (localStorage)
- Mobile-first und responsive (Smartphone hoch/quer bis Desktop)
- Darkmode folgt der Systemeinstellung (`prefers-color-scheme`), Farben als CSS-Variablen in `src/style.css`
- Struktur: `src/main.ts` (Oberfläche), `src/types.ts` (Datentypen), `src/scoring.ts` (Rechenlogik) + `*.test.ts` daneben

## Arbeitsweise

- Ich bin Programmierer, aber neu im Web-/PWA-Bereich: erkläre neue Konzepte kurz, wenn du sie einführst
- Kleine Schritte: lieber ein Feature fertig und lauffähig als viele halb
- Vor größeren Änderungen erst einen kurzen Plan vorschlagen
- Rechenlogik (Punkte) in eigener Datei, getrennt von der Oberfläche, mit Unit-Tests (Vitest)
- Keine zusätzlichen Abhängigkeiten ohne Rückfrage
- Halte diese CLAUDE.md aktuell: Wenn wir eine wichtige Entscheidung treffen
  (Technik, Struktur, Konventionen, geänderte Anforderungen) oder einen neuen
  Befehl einführen, schlag mir vor, sie hier einzutragen.
- Halte die Datei kurz und übersichtlich: nur dauerhaft gültige Infos, keine
  Protokolle oder erledigten Aufgaben.

## Befehle

- `npm install` – Abhängigkeiten installieren
- `npm run dev` – Entwicklungsserver starten
- `npm run build` – Typprüfung + Produktions-Build nach `dist/`
- `npm run preview` – Produktions-Build lokal ansehen (mit Service Worker, zum Offline-Testen)
- `npm test` – Tests einmal ausführen
- `npm run test:watch` – Tests bei jeder Änderung neu ausführen
