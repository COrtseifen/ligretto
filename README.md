# ligretto
Punktezähler für Ligretto – eine kleine, offline-fähige Web-App (PWA) fürs Handy.

**App öffnen:** https://cortseifen.github.io/ligretto/

Auf dem Handy über das Browser-Menü „Zum Startbildschirm hinzufügen" bzw. „App installieren".
Nach dem ersten Öffnen funktioniert sie auch ohne Internet; die Spielstände bleiben nur auf dem Gerät.

## Befehle

```sh
npm install        # Abhängigkeiten installieren
npm run dev        # Entwicklungsserver (http://localhost:5173/ligretto/)
npm run build      # Typprüfung + Produktions-Build nach dist/
npm run preview    # Produktions-Build lokal ansehen (http://localhost:4173/ligretto/, inkl. Service Worker)
npm test           # Tests ausführen
```

## Veröffentlichung

Jeder Push auf `main` baut und testet die App per GitHub Actions
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) und veröffentlicht sie auf GitHub Pages.
