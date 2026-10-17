/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages liefert die App unter https://cortseifen.github.io/ligretto/ aus – also im
  // Unterordner /ligretto/. Vite setzt diesen Pfad vor alle Dateiverweise im Build.
  base: '/ligretto/',
  plugins: [
    // Erzeugt beim Build das Web-App-Manifest und einen Service Worker,
    // der alle App-Dateien cached – dadurch läuft die App offline.
    VitePWA({
      registerType: 'autoUpdate',
      // Dateien aus public/, die zusätzlich offline verfügbar sein sollen.
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ligretto-Punktezähler',
        short_name: 'Ligretto',
        description: 'Punkte zählen beim Kartenspiel Ligretto',
        lang: 'de',
        display: 'standalone',
        start_url: '.',
        theme_color: '#f2f2f7',
        background_color: '#f2f2f7',
        // PNGs erzeugt scripts/render-icons.ps1 aus public/icon.svg. Android braucht 192/512 px,
        // „maskable" ist das Motiv mit Rand, damit runde oder tropfenförmige Zuschnitte nichts abschneiden.
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
