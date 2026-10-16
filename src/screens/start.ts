// Startbildschirm: Spielernamen eingeben und ein neues Spiel starten.
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

export interface StartScreenActions {
  onStart(names: string[]): void;
}

export function startScreen({ onStart }: StartScreenActions): HTMLElement {
  let names: string[] = Array(DEFAULT_PLAYER_COUNT).fill('');
  let invalid: number[] = [];

  // Versteckte Geste: 5× schnell auf die Überschrift tippen trägt die Stammspieler ein.
  const isSecretTap = createTapDetector(5, 2000);
  const title = el('h1', { className: 'title-tap' }, 'Ligretto');
  title.addEventListener('click', () => {
    if (!isSecretTap(performance.now())) return;
    names = [...PRESET_PLAYERS];
    invalid = [];
    navigator.vibrate?.(50); // kurzes Feedback auf Handys, die das unterstützen
    renderList();
  });

  const list = el('ol', { className: 'player-list' });
  const addButton = el('button', { type: 'button', className: 'btn secondary' }, '+ Spieler hinzufügen');
  const error = el('p', { className: 'error', hidden: true }, 'Jeder Name darf nur einmal vorkommen.');

  addButton.addEventListener('click', () => {
    names.push('');
    renderList();
    list.querySelector<HTMLInputElement>('li:last-child input')?.focus();
  });

  function renderList() {
    // Für die Prüfung zählen leere Felder bereits mit ihrem Ersatznamen („Spieler 2").
    const placeholders = normalizeNames(names.map(() => ''));
    list.replaceChildren(
      ...names.map((name, i) => {
        const input = el('input', {
          className: 'input',
          type: 'text',
          value: name,
          placeholder: placeholders[i],
          maxLength: 20,
          autocomplete: 'off',
          enterKeyHint: i < names.length - 1 ? 'next' : 'done',
          'aria-label': `Name Spieler ${i + 1}`,
          'aria-invalid': String(invalid.includes(i)),
        });
        input.addEventListener('input', () => {
          names[i] = input.value;
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

        const remove = el(
          'button',
          {
            type: 'button',
            className: 'icon-btn',
            disabled: names.length <= MIN_PLAYERS,
            'aria-label': `Spieler ${i + 1} entfernen`,
          },
          '✕',
        );
        remove.addEventListener('click', () => {
          names.splice(i, 1);
          invalid = [];
          error.hidden = true;
          renderList();
        });

        return el('li', {}, input, remove);
      }),
    );
    addButton.hidden = names.length >= MAX_PLAYERS;
  }

  const startButton = el('button', { type: 'button', className: 'btn primary' }, 'Spiel starten');
  startButton.addEventListener('click', () => {
    const finalNames = normalizeNames(names);
    invalid = duplicateIndices(finalNames);
    error.hidden = invalid.length === 0;
    if (invalid.length > 0) {
      renderList();
      return;
    }
    onStart(finalNames);
  });

  renderList();

  return el(
    'main',
    { className: 'screen' },
    title,
    el('p', { className: 'muted' }, 'Wer spielt mit?'),
    list,
    addButton,
    el('footer', { className: 'actions' }, error, startButton),
  );
}
