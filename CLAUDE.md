# Ligretto-Punktezähler

Eine kleine PWA, um beim Kartenspiel Ligretto die Punkte zu zählen – als Ersatz für Block und Stift.
Wird auf dem Handy am Spieltisch benutzt, muss also offline funktionieren und mit einer Hand bedienbar sein.

## Spielregeln (Punktewertung)

Pro Runde wird für jeden Spieler erfasst:
- **Tischkarten**: Karten, die noch auf dem Ligretto-Stapel liegen → je **-2 Punkte**
- **Abgelegte Karten**: Karten, die der Spieler in die Mitte gelegt hat → je **+1 Punkt**

Rundenpunkte = abgelegte Karten − 2 × Tischkarten
Der Gesamtstand ist die Summe aller Runden.

## Funktionen (erste Version)

- Neues Spiel starten, Spielernamen eingeben (Standard: 4 Spieler, 2–6 möglich)
- Neue Runde erfassen: pro Spieler Tischkarten und abgelegte Karten eingeben
  - Große Eingabefelder bzw. +/−-Buttons, gut am Handy bedienbar
  - Rundenpunkte werden sofort angezeigt, bevor die Runde gespeichert wird
- Übersicht: Gesamtstand pro Spieler, sortiert nach Platzierung
- Rundenverlauf als Tabelle (wie auf dem Block)
- Letzte Runde bearbeiten oder löschen (Tippfehler korrigieren)
- Spielstand wird automatisch gespeichert (localStorage) und überlebt Neuladen/Schließen
- Optional: Zielpunktzahl festlegen, Gewinner wird angezeigt, sobald sie erreicht ist

Noch nicht geplant: Accounts, Server, Synchronisierung zwischen Geräten.

## Technik

- Vite + TypeScript, ohne UI-Framework (Vanilla), damit es klein und verständlich bleibt
- vite-plugin-pwa für Manifest und Service Worker (offline-fähig, installierbar)
- Daten nur lokal im Browser (localStorage)
- Mobile-first, funktioniert im Hoch- und Querformat, heller und dunkler Modus

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
- `npm run build` – Produktions-Build nach `dist/`
- `npm test` – Tests ausführen
