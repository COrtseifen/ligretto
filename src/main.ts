import './style.css';
import { registerSW } from 'virtual:pwa-register';

// Service Worker registrieren (nur im Produktions-Build aktiv).
// Bei einer neuen Version aktualisiert er sich automatisch.
registerSW({ immediate: true });

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="screen">
    <h1>Ligretto</h1>
    <p class="muted">Hier entsteht der Punktezähler.</p>
  </main>
`;
