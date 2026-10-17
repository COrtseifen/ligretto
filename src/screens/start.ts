// Startbildschirm: Spieler mit Namen und Kartenfarbe eintragen und ein neues Spiel starten.
import { colorName, nextFreeColor, withColor } from '../colors';
import { el } from '../dom';
import {
  DEFAULT_PLAYER_COUNT,
  duplicateIndices,
  MAX_PLAYERS,
  MIN_PLAYERS,
  normalizeNames,
  PRESET_PLAYERS,
} from '../game';
import { createTapDetector } from '../tap';
import { openColorPicker } from './colorPicker';

export interface StartScreenActions {
  onStart(names: string[], colors: string[]): void;
}

interface PlayerInput {
  name: string;
  color: string;
}

/** Neuer Spieler mit der nächsten freien Farbe. */
function newPlayer(existing: PlayerInput[]): PlayerInput {
  return { name: '', color: nextFreeColor(existing.map((p) => p.color))! };
}

export function startScreen({ onStart }: StartScreenActions): HTMLElement {
  let players: PlayerInput[] = [];
  for (let i = 0; i < DEFAULT_PLAYER_COUNT; i++) players.push(newPlayer(players));
  let invalid: number[] = [];

  // Versteckte Geste: 5× schnell auf die Überschrift tippen trägt die Stammspieler ein.
  const isSecretTap = createTapDetector(5, 2000);
  const title = el('h1', { className: 'title-tap' }, 'Ligretto');
  title.addEventListener('click', () => {
    if (!isSecretTap(performance.now())) return;
    players = PRESET_PLAYERS.map((p) => ({ ...p }));
    invalid = [];
    navigator.vibrate?.(50); // kurzes Feedback auf Handys, die das unterstützen
    renderList();
  });

  const list = el('ol', { className: 'player-list' });
  const addButton = el('button', { type: 'button', className: 'list-action' }, '+ Spieler hinzufügen');
  const error = el('p', { className: 'error', hidden: true }, 'Jeder Name darf nur einmal vorkommen.');

  addButton.addEventListener('click', () => {
    players.push(newPlayer(players));
    renderList();
    list.querySelector<HTMLInputElement>('li:last-child input')?.focus();
  });

  function renderList() {
    // Für die Prüfung zählen leere Felder bereits mit ihrem Ersatznamen („Spieler 2").
    const placeholders = normalizeNames(players.map(() => ''));
    list.replaceChildren(
      ...players.map((player, i) => {
        const displayName = () => player.name.trim() || placeholders[i];

        // Farbkreis links: öffnet die Farbauswahl. Vergebene Farben sind dort gesperrt.
        const colorButton = withColor(
          el('button', {
            type: 'button',
            className: 'color-btn',
            'aria-label': `Farbe von ${displayName()}: ${colorName(player.color)}. Ändern`,
          }),
          player.color,
        );
        colorButton.addEventListener('click', () => {
          const takenBy = new Map(
            players.flatMap((other, j) => (j === i ? [] : [[other.color, other.name.trim() || placeholders[j]]])),
          );
          openColorPicker({
            playerName: displayName(),
            current: player.color,
            takenBy,
            onSelect: (hex) => {
              player.color = hex;
              renderList();
            },
          });
        });

        const input = el('input', {
          className: 'list-input',
          type: 'text',
          value: player.name,
          placeholder: placeholders[i],
          maxLength: 20,
          autocomplete: 'off',
          enterKeyHint: i < players.length - 1 ? 'next' : 'done',
          'aria-label': `Name Spieler ${i + 1}`,
          'aria-invalid': String(invalid.includes(i)),
        });
        input.addEventListener('input', () => {
          player.name = input.value;
          if (invalid.length > 0) {
            invalid = [];
            error.hidden = true;
            list.querySelectorAll('input').forEach((x) => x.setAttribute('aria-invalid', 'false'));
          }
        });
        input.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter') return;
          const next = list.querySelectorAll('input')[i + 1];
          if (next) next.focus();
          else input.blur(); // schließt die Tastatur
        });

        const remove = el('button', {
          type: 'button',
          className: 'icon-btn',
          disabled: players.length <= MIN_PLAYERS,
          'aria-label': `Spieler ${i + 1} entfernen`, // das ✕ zeichnet das CSS
        });
        remove.addEventListener('click', () => {
          players.splice(i, 1);
          invalid = [];
          error.hidden = true;
          renderList();
        });

        return el('li', {}, colorButton, input, remove);
      }),
    );
    addButton.hidden = players.length >= MAX_PLAYERS;
  }

  const startButton = el('button', { type: 'button', className: 'btn primary' }, 'Spiel starten');
  startButton.addEventListener('click', () => {
    const finalNames = normalizeNames(players.map((p) => p.name));
    invalid = duplicateIndices(finalNames);
    error.hidden = invalid.length === 0;
    if (invalid.length > 0) {
      renderList();
      return;
    }
    onStart(
      finalNames,
      players.map((p) => p.color),
    );
  });

  renderList();

  return el(
    'main',
    { className: 'screen' },
    title,
    el('p', { className: 'section-header' }, 'Wer spielt mit? Tippe auf den Kreis, um die Kartenfarbe zu wählen.'),
    el('div', { className: 'group' }, list, addButton),
    el('footer', { className: 'actions' }, error, startButton),
  );
}
