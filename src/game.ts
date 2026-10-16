// Spielverwaltung ohne Bezug zur Oberfläche: Spieler, neues Spiel anlegen.
import type { Game } from './types';

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
