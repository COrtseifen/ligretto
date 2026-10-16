import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { el } from './dom';
import { createGame } from './game';
import { startScreen } from './screens/start';
import { clearGame, loadGame, saveGame } from './storage';
import type { Game } from './types';

// Service Worker registrieren (nur im Produktions-Build aktiv).
// Bei einer neuen Version aktualisiert er sich automatisch.
registerSW({ immediate: true });

const app = document.querySelector<HTMLDivElement>('#app')!;

/** Aktueller Zustand der App. Jede Änderung → speichern und `render()` aufrufen. */
let game: Game | null = loadGame();

/** Zeichnet den passenden Bildschirm für den aktuellen Zustand neu. */
function render() {
  app.replaceChildren(game ? roundPlaceholder(game) : startScreen({ onStart }));
  window.scrollTo(0, 0);
}

function onStart(names: string[]) {
  game = createGame(names);
  saveGame(game);
  render();
}

function onAbort() {
  if (!confirm('Spiel wirklich abbrechen? Der Spielstand wird gelöscht.')) return;
  game = null;
  clearGame();
  render();
}

// Vorläufig, bis „Runde erfassen" (Schritt 5) fertig ist.
function roundPlaceholder(game: Game): HTMLElement {
  const abort = el('button', { type: 'button', className: 'btn secondary' }, 'Spiel abbrechen');
  abort.addEventListener('click', onAbort);
  return el(
    'main',
    { className: 'screen' },
    el('h1', {}, 'Ligretto'),
    el('p', {}, `Runde ${game.rounds.length + 1} – es spielen:`),
    el('ul', {}, ...game.players.map((name) => el('li', {}, name))),
    el('p', { className: 'muted' }, 'Die Rundeneingabe folgt im nächsten Schritt.'),
    el('footer', { className: 'actions' }, abort),
  );
}

render();
