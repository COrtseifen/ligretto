import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { addRound, createGame, draftMatches, finishGame } from './game';
import { overviewScreen } from './screens/overview';
import { roundScreen } from './screens/round';
import { startScreen } from './screens/start';
import { clearDraft, clearGame, loadDraft, loadGame, saveDraft, saveGame } from './storage';
import type { Game, Round } from './types';

// Service Worker registrieren (nur im Produktions-Build aktiv).
// Bei einer neuen Version aktualisiert er sich automatisch.
registerSW({ immediate: true });

const app = document.querySelector<HTMLDivElement>('#app')!;

/** Aktueller Zustand der App. Änderungen laufen über `update()`. */
let game: Game | null = loadGame();
/** Während eines laufenden Spiels: Rundeneingabe oder Spielstand anzeigen (wird nicht gespeichert). */
let view: 'round' | 'standings' = 'round';

/** Zeichnet den passenden Bildschirm für den aktuellen Zustand neu. */
function render() {
  let screen: HTMLElement;
  if (!game) {
    screen = startScreen({ onStart: (names, colors) => update(createGame(names, colors)) });
  } else if (game.finished || view === 'standings') {
    screen = overviewScreen(game, { onBack: () => show('round'), onNewGame: () => update(null) });
  } else {
    const draft = loadDraft();
    screen = roundScreen(game, {
      draft: draftMatches(game, draft) ? draft : null,
      onDraftChange: saveDraft,
      onContinue,
      onFinish,
      onShowStandings: () => show('standings'),
    });
  }

  app.replaceChildren(screen);
  window.scrollTo(0, 0);
}

function show(next: typeof view) {
  view = next;
  render();
}

/** Neuen Zustand übernehmen, speichern und neu zeichnen. Ein angefangener Zwischenstand ist damit erledigt. */
function update(next: Game | null) {
  game = next;
  view = 'round';
  if (game) {
    saveGame(game);
    clearDraft();
  } else {
    clearGame();
  }
  render();
}

function onContinue(round: Round) {
  update(addRound(game!, round));
}

function onFinish(round: Round | null) {
  update(finishGame(round ? addRound(game!, round) : game!));
}

render();
