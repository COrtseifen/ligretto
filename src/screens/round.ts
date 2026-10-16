// Runde erfassen: pro Spieler Rest- und Tischkarten eingeben, dann weiterspielen oder beenden.
import { el } from '../dom';
import { parseCardCount } from '../game';
import {
  isValidRestkarten,
  isValidTischkarten,
  REST_MAX,
  REST_MIN,
  roundPoints,
  TISCH_MAX,
  TISCH_MIN,
  totals,
} from '../scoring';
import type { Game, Round, RoundDraft } from '../types';

export interface RoundScreenActions {
  /** Zwischenstand dieser Runde, z. B. nach Neuladen der Seite. */
  draft: RoundDraft | null;
  /** Wird nach jeder Eingabe mit dem aktuellen Feldinhalt aufgerufen. */
  onDraftChange(draft: RoundDraft): void;
  /** Runde vollständig erfasst, nächste Runde beginnen. */
  onContinue(round: Round): void;
  /** Spiel beenden – mit der erfassten Runde oder `null`, wenn die Runde leer blieb. */
  onFinish(round: Round | null): void;
}

type Field = 'tisch' | 'rest';

/** Eingabereihenfolge: Restkarten stehen nach Rundenende sofort fest, Tischkarten müssen erst sortiert werden. */
const FIELD_ORDER: readonly Field[] = ['rest', 'tisch'];

const FIELDS: Record<Field, { label: string; hint: string; isValid(n: number): boolean }> = {
  tisch: { label: 'Tischkarten', hint: `${TISCH_MIN} bis ${TISCH_MAX} · je +1`, isValid: isValidTischkarten },
  rest: { label: 'Restkarten', hint: `${REST_MIN} bis ${REST_MAX} · je −2`, isValid: isValidRestkarten },
};

/** Zustand eines Feldes: leer, ungültig oder gültige Zahl. */
function readField(raw: string, field: Field): { empty: boolean; value: number | null } {
  const n = parseCardCount(raw);
  if (n === null) return { empty: true, value: null };
  return { empty: false, value: FIELDS[field].isValid(n) ? n : null };
}

function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0';
}

export function roundScreen(
  game: Game,
  { draft, onDraftChange, onContinue, onFinish }: RoundScreenActions,
): HTMLElement {
  const roundNumber = game.rounds.length + 1;
  const currentTotals = totals(game);
  const raw = draft ? draft.entries.map((e) => ({ ...e })) : game.players.map(() => ({ tisch: '', rest: '' }));

  /** Alle Felder in Eingabereihenfolge (für „Enter → nächstes Feld"). */
  const inputs: HTMLInputElement[] = [];
  /** Felder pro Spieler, zum Markieren ungültiger Werte. */
  const playerInputs: Record<Field, HTMLInputElement>[] = [];
  const pointsOutputs: HTMLElement[] = [];

  const cards = game.players.map((name, p) => {
    const byField = {} as Record<Field, HTMLInputElement>;
    playerInputs.push(byField);

    const fields = FIELD_ORDER.map((field) => {
      const { label, hint } = FIELDS[field];
      const input = el('input', {
        className: 'input number-input',
        type: 'text', // statt "number": verhält sich in allen Browsern gleich, Prüfung machen wir selbst
        inputMode: 'numeric', // Zifferntastatur auf dem Handy
        autocomplete: 'off',
        enterKeyHint: 'next',
        value: raw[p][field],
        'aria-label': `${label} ${name}`,
        'aria-invalid': 'false',
      });
      byField[field] = input;
      const index = inputs.push(input) - 1;

      input.addEventListener('input', () => {
        raw[p][field] = input.value;
        onDraftChange({ round: roundNumber, entries: raw });
        update();
      });
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const next = inputs[index + 1];
        if (next) next.focus();
        else input.blur();
      });
      // Beim Antippen vorhandenen Inhalt markieren, damit man ihn direkt überschreiben kann.
      input.addEventListener('focus', () => input.select());

      return el(
        'label',
        { className: 'field' },
        el('span', { className: 'field-label' }, label),
        input,
        el('span', { className: 'field-hint' }, hint),
      );
    });

    const points = el('output', { className: 'round-points' });
    pointsOutputs.push(points);

    return el(
      'section',
      { className: 'player-card' },
      el(
        'header',
        {},
        el('h2', {}, name),
        el('span', { className: 'muted' }, `Gesamt: ${currentTotals[p]}`),
      ),
      el('div', { className: 'fields' }, ...fields),
      points,
    );
  });

  const status = el('p', { className: 'muted status' });
  const continueButton = el('button', { type: 'button', className: 'btn primary' }, 'Weiterspielen');
  const finishButton = el('button', { type: 'button', className: 'btn secondary' }, 'Spiel beenden');

  /** Liest alle Felder; liefert die Runde, wenn alles gültig ist. */
  function collect() {
    const states = raw.map((r) => ({ tisch: readField(r.tisch, 'tisch'), rest: readField(r.rest, 'rest') }));
    const all = states.flatMap((s) => [s.tisch, s.rest]);
    const round: Round | null = all.every((f) => f.value !== null)
      ? states.map((s) => ({ tisch: s.tisch.value!, rest: s.rest.value! }))
      : null;
    return {
      states,
      round,
      allEmpty: all.every((f) => f.empty),
      openCount: all.filter((f) => f.empty).length,
      invalidCount: all.filter((f) => !f.empty && f.value === null).length,
    };
  }

  /** Aktualisiert Markierungen, Live-Punkte und Buttons nach jeder Eingabe. */
  function update() {
    const { states, round, openCount, invalidCount } = collect();

    states.forEach((s, p) => {
      for (const field of FIELD_ORDER) {
        const f = s[field];
        playerInputs[p][field].setAttribute('aria-invalid', String(!f.empty && f.value === null));
      }

      const out = pointsOutputs[p];
      if (s.tisch.value === null || s.rest.value === null) {
        out.textContent = '';
        out.className = 'round-points';
        return;
      }
      const pts = roundPoints(s.tisch.value, s.rest.value);
      out.textContent = `Runde ${formatSigned(pts)} → ${currentTotals[p] + pts}`;
      out.className = `round-points ${pts < 0 ? 'negative' : 'positive'}`;
    });

    continueButton.disabled = round === null;
    status.textContent =
      invalidCount > 0
        ? `${invalidCount} ${invalidCount === 1 ? 'Wert ist' : 'Werte sind'} ungültig`
        : openCount > 0
          ? `Noch ${openCount} ${openCount === 1 ? 'Feld' : 'Felder'} offen`
          : 'Alles erfasst';
  }

  continueButton.addEventListener('click', () => {
    const { round } = collect();
    if (round) onContinue(round);
  });

  finishButton.addEventListener('click', () => {
    const { round, allEmpty } = collect();
    if (round) {
      if (confirm(`Runde ${roundNumber} speichern und Spiel beenden?`)) onFinish(round);
    } else if (allEmpty) {
      if (confirm(`Spiel beenden? Runde ${roundNumber} wird nicht gewertet.`)) onFinish(null);
    } else {
      alert('Bitte alle Werte dieser Runde eintragen – oder alle Felder leeren, um ohne diese Runde zu beenden.');
    }
  });

  update();

  return el(
    'main',
    { className: 'screen' },
    el('h1', {}, `Runde ${roundNumber}`),
    el('div', { className: 'player-cards' }, ...cards),
    el('footer', { className: 'actions' }, status, el('div', { className: 'button-row' }, finishButton, continueButton)),
  );
}
