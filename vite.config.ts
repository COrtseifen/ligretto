/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    // Erzeugt beim Build das Web-App-Manifest und einen Service Worker,
    // der alle App-Dateien cached – dadurch läuft die App offline.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Ligretto-Punktezähler',
        short_name: 'Ligretto',
        description: 'Punkte zählen beim Kartenspiel Ligretto',
        lang: 'de',
        display: 'standalone',
        start_url: '.',
        theme_color: '#c62828',
        background_color: '#ffffff',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
