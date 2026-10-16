import { describe, expect, it } from 'vitest';
import { clearGame, loadGame, saveGame, STORAGE_KEY, type KeyValueStore } from './storage';
import type { Game } from './types';

/** Ersatz für localStorage im Test. */
function fakeStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const game: Game = {
  players: ['Anna', 'Ben'],
  rounds: [[{ tisch: 12, rest: 0 }, { tisch: 6, rest: 5 }]],
  finished: false,
};

describe('storage', () => {
  it('liefert null, wenn nichts gespeichert ist', () => {
    expect(loadGame(fakeStore())).toBeNull();
  });

  it('lädt ein gespeichertes Spiel wieder', () => {
    const store = fakeStore();
    expect(saveGame(game, store)).toBe(true);
    expect(loadGame(store)).toEqual(game);
  });

  it('löscht das gespeicherte Spiel', () => {
    const store = fakeStore();
    saveGame(game, store);
    clearGame(store);
    expect(loadGame(store)).toBeNull();
  });

  it('ignoriert kaputtes JSON', () => {
    const store = fakeStore();
    store.setItem(STORAGE_KEY, '{kaputt');
    expect(loadGame(store)).toBeNull();
  });

  it('ignoriert unbekannte Versionen', () => {
    const store = fakeStore();
    store.setItem(STORAGE_KEY, JSON.stringify({ version: 99, game }));
    expect(loadGame(store)).toBeNull();
  });

  it('ignoriert Daten mit falscher Form', () => {
    const store = fakeStore();
    const broken = { ...game, rounds: [[{ tisch: 12, rest: 0 }]] }; // ein Eintrag fehlt
    store.setItem(STORAGE_KEY, JSON.stringify({ version: 1, game: broken }));
    expect(loadGame(store)).toBeNull();
  });

  it('meldet false, wenn der Speicher voll ist', () => {
    const store: KeyValueStore = {
      ...fakeStore(),
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(saveGame(game, store)).toBe(false);
  });
});
