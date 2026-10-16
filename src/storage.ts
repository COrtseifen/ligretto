// Speichert das laufende Spiel im localStorage des Browsers.
// localStorage kann nur Texte speichern, daher wird das Spiel als JSON abgelegt.
import type { Game } from './types';

export const STORAGE_KEY = 'ligretto.game';
/** Bei Änderungen am Datenformat erhöhen und alte Stände in `loadGame` umwandeln. */
export const STORAGE_VERSION = 1;

/** Der Teil der localStorage-Schnittstelle, den wir brauchen – in Tests durch einen Ersatz austauschbar. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface StoredData {
  version: number;
  game: Game;
}

/** Speichert das Spiel. Gibt `false` zurück, wenn der Browser das Speichern verweigert (z. B. Speicher voll). */
export function saveGame(game: Game, store: KeyValueStore = localStorage): boolean {
  const data: StoredData = { version: STORAGE_VERSION, game };
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Lädt das gespeicherte Spiel, oder `null`, wenn keins da ist bzw. die Daten unbrauchbar sind. */
export function loadGame(store: KeyValueStore = localStorage): Game | null {
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const data = JSON.parse(raw) as Partial<StoredData>;
    if (data.version !== STORAGE_VERSION || !isGame(data.game)) return null;
    return data.game;
  } catch {
    return null;
  }
}

export function clearGame(store: KeyValueStore = localStorage): void {
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // Nichts zu tun – ohne Zugriff auf den Speicher gibt es auch nichts zu löschen.
  }
}

/** Prüft, ob gelesene Daten wirklich die Form eines Spiels haben (Schutz vor kaputten Ständen). */
function isGame(value: unknown): value is Game {
  if (typeof value !== 'object' || value === null) return false;
  const g = value as Record<string, unknown>;

  return (
    Array.isArray(g.players) &&
    g.players.every((name) => typeof name === 'string') &&
    typeof g.finished === 'boolean' &&
    Array.isArray(g.rounds) &&
    g.rounds.every(
      (round) =>
        Array.isArray(round) &&
        round.length === (g.players as unknown[]).length &&
        round.every(
          (entry) =>
            typeof entry === 'object' &&
            entry !== null &&
            typeof entry.tisch === 'number' &&
            typeof entry.rest === 'number',
        ),
    )
  );
}
