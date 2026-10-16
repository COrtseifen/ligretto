import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { el } from './dom';
import { addRound, createGame, draftMatches, finishGame } from './game';
import { roundScreen } from './screens/round';
import { startScreen } from './screens/start';
import { ranking } from './scoring';
import { clearDraft, clearGame, loadDraft, loadGame, saveDraft, saveGame } from './storage';
import type { Game, Round } from './types';

// Service Worker registrieren (nur im Produktions-Build aktiv).
// Bei einer neuen Version aktualisiert er sich automatisch.
registerSW({ immediate: true });

const app = document.querySelector<HTMLDivElement>('#app')!;

/** Aktueller Zustand der App. Änderungen laufen über `update()`. */
let game: Game | null = loadGame();

/** Zeichnet den passenden Bildschirm für den aktuellen Zustand neu. */
function render() {
  let screen: HTMLElement;
  if (!game) screen = startScreen({ onStart: (names) => update(createGame(names)) });
  else if (game.finished) screen = endPlaceholder(game);
  else {
    const draft = loadDraft();
    screen = roundScreen(game, {
      draft: draftMatches(game, draft) ? draft : null,
      onDraftChange: saveDraft,
      onContinue,
      onFinish,
    });
  }

  app.replaceChildren(screen);
  window.scrollTo(0, 0);
}

/** Neuen Zustand übernehmen, speichern und neu zeichnen. Ein angefangener Zwischenstand ist damit erledigt. */
function update(next: Game | null) {
  game = next;
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

// Vorläufig, bis die Endübersicht (Schritt 6) fertig ist.
function endPlaceholder(game: Game): HTMLElement {
  const newGame = el('button', { type: 'button', className: 'btn primary' }, 'Neues Spiel');
  newGame.addEventListener('click', () => update(null));
  return el(
    'main',
    { className: 'screen' },
    el('h1', {}, 'Spielende'),
    el('p', { className: 'muted' }, `${game.rounds.length} Runden gespielt`),
    el('ol', {}, ...ranking(game).map((s) => el('li', {}, `${s.place}. ${s.name}: ${s.total}`))),
    el('footer', { className: 'actions' }, newGame),
  );
}

render();
