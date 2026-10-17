import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { addRound, createGame, draftMatches, finishGame, removeLastRound, replaceLastRound } from './game';
import { overviewScreen } from './screens/overview';
import { editRoundScreen, roundScreen } from './screens/round';
import { startScreen } from './screens/start';
import { clearDraft, clearGame, loadDraft, loadGame, saveDraft, saveGame } from './storage';
import { hideToast, showToast } from './toast';
import type { Game, Round } from './types';

// Service Worker registrieren (nur im Produktions-Build aktiv).
// Bei einer neuen Version aktualisiert er sich automatisch.
registerSW({ immediate: true });

const app = document.querySelector<HTMLDivElement>('#app')!;

type View = 'round' | 'standings' | 'edit';

/** Aktueller Zustand der App. Änderungen laufen über `update()`. */
let game: Game | null = loadGame();
/** Welcher Bildschirm zum Spiel gezeigt wird (wird nicht gespeichert). Ein beendetes Spiel zeigt immer die Übersicht. */
let view: View = 'round';
/** Wohin „Abbrechen"/„Speichern" beim Bearbeiten zurückführt. */
let editReturn: Exclude<View, 'edit'> = 'round';

/** Zeichnet den passenden Bildschirm für den aktuellen Zustand neu. */
function render() {
  let screen: HTMLElement;
  if (!game) {
    screen = startScreen({ onStart: (names, colors) => update(createGame(names, colors)) });
  } else if (view === 'edit' && game.rounds.length > 0) {
    screen = editRoundScreen(game, {
      onSave: (round) => update(replaceLastRound(game!, round), { view: editReturn, keepDraft: true }),
      onCancel: () => show(editReturn),
      onDelete: deleteLastRound,
    });
  } else if (game.finished || view === 'standings') {
    screen = overviewScreen(game, {
      onBack: () => show('round'),
      onNewGame: () => update(null),
      onEditLast: editLastRound,
      onDeleteLast: deleteLastRound,
    });
  } else {
    const draft = loadDraft();
    screen = roundScreen(game, {
      draft: draftMatches(game, draft) ? draft : null,
      onDraftChange: saveDraft,
      onContinue,
      onFinish,
      onShowStandings: () => show('standings'),
      onEditLast: editLastRound,
    });
  }

  app.replaceChildren(screen);
  window.scrollTo(0, 0);
}

function show(next: View) {
  view = next;
  render();
}

/**
 * Neuen Zustand übernehmen, speichern und neu zeichnen.
 * Standardmäßig ist ein angefangener Zwischenstand damit erledigt; beim Bearbeiten der
 * letzten Runde bleibt er erhalten (`keepDraft`), weil sich die Rundennummer nicht ändert.
 */
function update(next: Game | null, { view: nextView = 'round', keepDraft = false }: { view?: View; keepDraft?: boolean } = {}) {
  hideToast(); // ein „Rückgängig" bezieht sich nur auf den Stand direkt nach dem Löschen
  game = next;
  view = nextView;
  if (game) {
    saveGame(game);
    if (!keepDraft) clearDraft();
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

function editLastRound() {
  editReturn = view === 'standings' ? 'standings' : 'round';
  show('edit');
}

/** Löscht die letzte Runde sofort und bietet einige Sekunden lang „Rückgängig" an. */
function deleteLastRound() {
  const before = game!;
  const draftBefore = loadDraft();
  const number = before.rounds.length;
  const back = view === 'edit' ? editReturn : view;

  update(removeLastRound(before), { view: back });
  showToast({
    message: `Runde ${number} gelöscht`,
    actionLabel: 'Rückgängig',
    onAction: () => {
      if (draftBefore) saveDraft(draftBefore);
      update(before, { view, keepDraft: true });
    },
  });
}

render();
