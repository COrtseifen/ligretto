// Speichert das laufende Spiel und die angefangene Runde im localStorage des Browsers.
// localStorage kann nur Texte speichern, daher werden die Daten als JSON abgelegt.
import type { Game, RoundDraft } from './types';

export const STORAGE_KEY = 'ligretto.game';
export const DRAFT_KEY = 'ligretto.draft';
/** Bei Änderungen am Datenformat erhöhen und alte Stände beim Laden umwandeln. */
export const STORAGE_VERSION = 1;

/** Der Teil der localStorage-Schnittstelle, den wir brauchen – in Tests durch einen Ersatz austauschbar. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Speichert das Spiel. Gibt `false` zurück, wenn der Browser das Speichern verweigert (z. B. Speicher voll). */
export function saveGame(game: Game, store: KeyValueStore = localStorage): boolean {
  return write(STORAGE_KEY, { version: STORAGE_VERSION, game }, store);
}

/** Lädt das gespeicherte Spiel, oder `null`, wenn keins da ist bzw. die Daten unbrauchbar sind. */
export function loadGame(store: KeyValueStore = localStorage): Game | null {
  const data = read(STORAGE_KEY, store);
  return isGame(data?.game) ? data.game : null;
}

/** Löscht Spiel und angefangene Runde. */
export function clearGame(store: KeyValueStore = localStorage): void {
  remove(STORAGE_KEY, store);
  remove(DRAFT_KEY, store);
}

export function saveDraft(draft: RoundDraft, store: KeyValueStore = localStorage): boolean {
  return write(DRAFT_KEY, { version: STORAGE_VERSION, draft }, store);
}

export function loadDraft(store: KeyValueStore = localStorage): RoundDraft | null {
  const data = read(DRAFT_KEY, store);
  return isDraft(data?.draft) ? data.draft : null;
}

export function clearDraft(store: KeyValueStore = localStorage): void {
  remove(DRAFT_KEY, store);
}

function write(key: string, data: object, store: KeyValueStore): boolean {
  try {
    store.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Liest und parst einen Eintrag; `null` bei fehlenden, kaputten oder fremd-versionierten Daten. */
function read(key: string, store: KeyValueStore): Record<string, unknown> | null {
  try {
    const raw = store.getItem(key);
    if (raw === null) return null;
    const data = JSON.parse(raw);
    return isObject(data) && data.version === STORAGE_VERSION ? data : null;
  } catch {
    return null;
  }
}

function remove(key: string, store: KeyValueStore): void {
  try {
    store.removeItem(key);
  } catch {
    // Nichts zu tun – ohne Zugriff auf den Speicher gibt es auch nichts zu löschen.
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Prüft, ob gelesene Daten wirklich die Form eines Spiels haben (Schutz vor kaputten Ständen). */
function isGame(value: unknown): value is Game {
  if (!isObject(value)) return false;
  const { players, rounds, finished } = value;

  return (
    Array.isArray(players) &&
    players.every((name) => typeof name === 'string') &&
    typeof finished === 'boolean' &&
    Array.isArray(rounds) &&
    rounds.every(
      (round) =>
        Array.isArray(round) &&
        round.length === players.length &&
        round.every((e) => isObject(e) && typeof e.tisch === 'number' && typeof e.rest === 'number'),
    )
  );
}

function isDraft(value: unknown): value is RoundDraft {
  if (!isObject(value)) return false;
  const { round, entries } = value;

  return (
    typeof round === 'number' &&
    Array.isArray(entries) &&
    entries.every((e) => isObject(e) && typeof e.tisch === 'string' && typeof e.rest === 'string')
  );
}
