import { describe, expect, it } from 'vitest';
import { createGame, duplicateIndices, normalizeNames } from './game';

describe('normalizeNames', () => {
  it('entfernt Leerzeichen am Rand', () => {
    expect(normalizeNames(['  Anna ', 'Ben'])).toEqual(['Anna', 'Ben']);
  });

  it('füllt leere Namen mit „Spieler n" auf', () => {
    expect(normalizeNames(['Anna', '', '   '])).toEqual(['Anna', 'Spieler 2', 'Spieler 3']);
  });
});

describe('duplicateIndices', () => {
  it('ist leer, wenn alle Namen verschieden sind', () => {
    expect(duplicateIndices(['Anna', 'Ben', 'Cleo'])).toEqual([]);
  });

  it('findet alle Vorkommen doppelter Namen', () => {
    expect(duplicateIndices(['Anna', 'Ben', 'Anna', 'Cleo'])).toEqual([0, 2]);
  });

  it('ignoriert Groß-/Kleinschreibung und Leerzeichen am Rand', () => {
    expect(duplicateIndices(['anna', ' Anna '])).toEqual([0, 1]);
  });
});

describe('createGame', () => {
  it('legt ein leeres, laufendes Spiel an', () => {
    expect(createGame(['Anna', ''])).toEqual({
      players: ['Anna', 'Spieler 2'],
      rounds: [],
      finished: false,
    });
  });
});
