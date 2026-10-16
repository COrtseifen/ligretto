// Spielverwaltung ohne Bezug zur Oberfläche: Spieler, Spiel anlegen, Runden hinzufügen.
import type { Game, Round, RoundDraft } from './types';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const DEFAULT_PLAYER_COUNT = 4;

/** Wird über die versteckte Geste auf dem Startbildschirm eingetragen. */
export const PRESET_PLAYERS = ['Christian', 'Sarah', 'Timo', 'Steffi'];

/** Entfernt Leerzeichen am Rand; leere Namen werden zu „Spieler 1", „Spieler 2", … */
export function normalizeNames(names: string[]): string[] {
  return names.map((name, i) => name.trim() || `Spieler ${i + 1}`);
}

/** Indizes aller Namen, die mehrfach vorkommen (Groß-/Kleinschreibung egal). */
export function duplicateIndices(names: string[]): number[] {
  const keys = names.map((name) => name.trim().toLocaleLowerCase('de'));
  return keys.flatMap((key, i) => (keys.indexOf(key) !== keys.lastIndexOf(key) ? [i] : []));
}

export function createGame(names: string[]): Game {
  return { players: normalizeNames(names), rounds: [], finished: false };
}

/** Hängt eine Runde an. Gibt ein neues Spielobjekt zurück, das alte bleibt unverändert. */
export function addRound(game: Game, round: Round): Game {
  if (round.length !== game.players.length) {
    throw new Error(`Runde hat ${round.length} Einträge, erwartet ${game.players.length}`);
  }
  return { ...game, rounds: [...game.rounds, round] };
}

export function finishGame(game: Game): Game {
  return { ...game, finished: true };
}

/** Gehört der Zwischenstand zur aktuell laufenden Runde dieses Spiels? */
export function draftMatches(game: Game, draft: RoundDraft | null): draft is RoundDraft {
  return (
    draft !== null &&
    !game.finished &&
    draft.round === game.rounds.length + 1 &&
    draft.entries.length === game.players.length
  );
}

/**
 * Liest eine Kartenanzahl aus einem Eingabefeld.
 * `null` = Feld ist leer; `NaN` = keine ganze Zahl (z. B. „3,5" oder „abc").
 * Ob die Zahl im erlaubten Bereich liegt, prüft `scoring.ts`.
 */
export function parseCardCount(raw: string): number | null {
  const text = raw.trim();
  if (text === '') return null;
  return /^\d+$/.test(text) ? Number(text) : NaN;
}
