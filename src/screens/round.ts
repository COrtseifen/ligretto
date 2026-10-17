// Runde erfassen bzw. die letzte Runde bearbeiten: pro Spieler Rest- und Tischkarten eingeben.
// Beide Bildschirme teilen sich das Eingabeformular (roundForm).
import { colorDot } from '../colors';
import { el } from '../dom';
import { formatInt, formatSigned } from '../format';
import { parseCardCount, removeLastRound } from '../game';
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

type Field = 'tisch' | 'rest';
type RawEntry = { tisch: string; rest: string };

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

interface FormState {
  /** Die vollständige Runde, wenn alle Felder gültig sind, sonst `null`. */
  round: Round | null;
  allEmpty: boolean;
}

/**
 * Eingabeformular: eine Karte pro Spieler mit Rest-/Tischkarten, Live-Punkten und Statuszeile.
 * `baseTotals` = Stand vor dieser Runde (für „Runde +9 → 26").
 */
function roundForm(
  game: Game,
  baseTotals: number[],
  raw: RawEntry[],
  onInput: (state: FormState) => void,
) {
  /** Alle Felder in Eingabereihenfolge (für „Enter → nächstes Feld"). */
  const inputs: HTMLInputElement[] = [];
  /** Felder pro Spieler, zum Markieren ungültiger Werte. */
  const playerInputs: Record<Field, HTMLInputElement>[] = [];
  const pointsOutputs: HTMLElement[] = [];
  const status = el('p', { className: 'muted status' });

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
        onInput(refresh());
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
        el('h2', {}, colorDot(game.colors[p]), el('span', { className: 'name' }, name)),
        el('span', { className: 'muted total' }, `Gesamt: ${formatInt(baseTotals[p])}`),
      ),
      el('div', { className: 'fields' }, ...fields),
      points,
    );
  });

  /** Liest alle Felder, aktualisiert Markierungen, Live-Punkte und Statuszeile. */
  function refresh(): FormState {
    const states = raw.map((r) => ({ tisch: readField(r.tisch, 'tisch'), rest: readField(r.rest, 'rest') }));
    const all = states.flatMap((s) => [s.tisch, s.rest]);
    const openCount = all.filter((f) => f.empty).length;
    const invalidCount = all.filter((f) => !f.empty && f.value === null).length;

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
      out.textContent = `Runde ${formatSigned(pts)} → ${formatInt(baseTotals[p] + pts)}`;
      out.className = `round-points ${pts < 0 ? 'negative' : 'positive'}`;
    });

    status.textContent =
      invalidCount > 0
        ? `${invalidCount} ${invalidCount === 1 ? 'Wert ist' : 'Werte sind'} ungültig`
        : openCount > 0
          ? `Noch ${openCount} ${openCount === 1 ? 'Feld' : 'Felder'} offen`
          : 'Alles erfasst';

    return {
      round: all.every((f) => f.value !== null) ? states.map((s) => ({ tisch: s.tisch.value!, rest: s.rest.value! })) : null,
      allEmpty: all.every((f) => f.empty),
    };
  }

  return { cards: el('div', { className: 'player-cards' }, ...cards), status, refresh };
}

// ---------- Neue Runde erfassen ----------

export interface RoundScreenActions {
  /** Zwischenstand dieser Runde, z. B. nach Neuladen der Seite. */
  draft: RoundDraft | null;
  /** Wird nach jeder Eingabe mit dem aktuellen Feldinhalt aufgerufen. */
  onDraftChange(draft: RoundDraft): void;
  /** Runde vollständig erfasst, nächste Runde beginnen. */
  onContinue(round: Round): void;
  /** Spiel beenden – mit der erfassten Runde oder `null`, wenn die Runde leer blieb. */
  onFinish(round: Round | null): void;
  /** Spielstand (Rangliste, Verlauf, Tabelle) anzeigen. */
  onShowStandings(): void;
  /** Die zuletzt gespeicherte Runde bearbeiten. */
  onEditLast(): void;
}

export function roundScreen(
  game: Game,
  { draft, onDraftChange, onContinue, onFinish, onShowStandings, onEditLast }: RoundScreenActions,
): HTMLElement {
  const roundNumber = game.rounds.length + 1;
  const raw = draft ? draft.entries.map((e) => ({ ...e })) : game.players.map(() => ({ tisch: '', rest: '' }));

  const continueButton = el('button', { type: 'button', className: 'btn primary' }, 'Weiterspielen');
  const finishButton = el('button', { type: 'button', className: 'btn secondary' }, 'Spiel beenden');

  const form = roundForm(game, totals(game), raw, (state) => {
    onDraftChange({ round: roundNumber, entries: raw });
    continueButton.disabled = state.round === null;
  });
  continueButton.disabled = form.refresh().round === null;

  continueButton.addEventListener('click', () => {
    const { round } = form.refresh();
    if (round) onContinue(round);
  });

  finishButton.addEventListener('click', () => {
    const { round, allEmpty } = form.refresh();
    if (round) {
      if (confirm(`Runde ${roundNumber} speichern und Spiel beenden?`)) onFinish(round);
    } else if (allEmpty) {
      if (confirm(`Spiel beenden? Runde ${roundNumber} wird nicht gewertet.`)) onFinish(null);
    } else {
      alert('Bitte alle Werte dieser Runde eintragen – oder alle Felder leeren, um ohne diese Runde zu beenden.');
    }
  });

  // „Stand" oben rechts, wie ein Navigationsknopf in iOS – erst sinnvoll, wenn es schon Runden gibt.
  const hasRounds = game.rounds.length > 0;
  const standingsButton = el('button', { type: 'button', className: 'nav-btn', hidden: !hasRounds }, 'Stand');
  standingsButton.addEventListener('click', onShowStandings);

  // Direkt nach „Weiterspielen" fällt ein Tippfehler meist auf – daher hier ein schneller Weg zurück.
  const editLink = el('button', { type: 'button', className: 'link-btn' }, 'Bearbeiten');
  editLink.addEventListener('click', onEditLast);
  const lastRound = el(
    'p',
    { className: 'last-round muted', hidden: !hasRounds },
    `Runde ${game.rounds.length} gespeichert · `,
    editLink,
  );

  return el(
    'main',
    { className: 'screen' },
    el(
      'div',
      { className: 'content' },
      el('div', { className: 'title-row' }, el('h1', {}, `Runde ${roundNumber}`), standingsButton),
      lastRound,
      form.cards,
    ),
    el('footer', { className: 'actions' }, form.status, el('div', { className: 'button-row' }, finishButton, continueButton)),
  );
}

// ---------- Letzte Runde bearbeiten ----------

export interface EditRoundActions {
  onSave(round: Round): void;
  onCancel(): void;
  onDelete(): void;
}

export function editRoundScreen(game: Game, { onSave, onCancel, onDelete }: EditRoundActions): HTMLElement {
  const roundNumber = game.rounds.length;
  const last = game.rounds[roundNumber - 1];
  const raw = last.map((e) => ({ tisch: String(e.tisch), rest: String(e.rest) }));

  const saveButton = el('button', { type: 'button', className: 'btn primary' }, 'Speichern');
  const deleteButton = el('button', { type: 'button', className: 'btn secondary destructive' }, 'Runde löschen');

  // Stand vor der bearbeiteten Runde, damit „→" den richtigen neuen Gesamtstand zeigt.
  const form = roundForm(game, totals(removeLastRound(game)), raw, (state) => {
    saveButton.disabled = state.round === null;
  });
  saveButton.disabled = form.refresh().round === null;

  saveButton.addEventListener('click', () => {
    const { round } = form.refresh();
    if (round) onSave(round);
  });
  deleteButton.addEventListener('click', onDelete);

  const cancelButton = el('button', { type: 'button', className: 'nav-btn' }, 'Abbrechen');
  cancelButton.addEventListener('click', onCancel);

  return el(
    'main',
    { className: 'screen' },
    el(
      'div',
      { className: 'content' },
      el('div', { className: 'title-row' }, el('h1', {}, `Runde ${roundNumber} bearbeiten`), cancelButton),
      form.cards,
    ),
    el('footer', { className: 'actions' }, form.status, el('div', { className: 'button-row' }, deleteButton, saveButton)),
  );
}
