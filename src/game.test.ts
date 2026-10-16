import { describe, expect, it } from 'vitest';
import {
  addRound,
  createGame,
  draftMatches,
  duplicateIndices,
  finishGame,
  normalizeNames,
  parseCardCount,
} from './game';

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

describe('addRound', () => {
  const round = [
    { tisch: 12, rest: 0 },
    { tisch: 6, rest: 5 },
  ];

  it('hängt die Runde an, ohne das alte Spiel zu verändern', () => {
    const game = createGame(['Anna', 'Ben']);
    const next = addRound(game, round);
    expect(next.rounds).toEqual([round]);
    expect(game.rounds).toEqual([]);
  });

  it('lehnt Runden mit falscher Spielerzahl ab', () => {
    const game = createGame(['Anna', 'Ben', 'Cleo']);
    expect(() => addRound(game, round)).toThrow();
  });
});

describe('finishGame', () => {
  it('markiert das Spiel als beendet', () => {
    expect(finishGame(createGame(['Anna', 'Ben'])).finished).toBe(true);
  });
});

describe('draftMatches', () => {
  const game = createGame(['Anna', 'Ben']);
  const entries = [
    { tisch: '5', rest: '' },
    { tisch: '', rest: '' },
  ];

  it('passt zur laufenden Runde', () => {
    expect(draftMatches(game, { round: 1, entries })).toBe(true);
  });

  it('passt nicht zu einer anderen Runde oder Spielerzahl', () => {
    expect(draftMatches(game, null)).toBe(false);
    expect(draftMatches(game, { round: 2, entries })).toBe(false);
    expect(draftMatches(game, { round: 1, entries: entries.slice(1) })).toBe(false);
  });

  it('passt nicht zu einem beendeten Spiel', () => {
    expect(draftMatches(finishGame(game), { round: 1, entries })).toBe(false);
  });
});

describe('parseCardCount', () => {
  it('liest ganze Zahlen', () => {
    expect(parseCardCount('0')).toBe(0);
    expect(parseCardCount(' 17 ')).toBe(17);
  });

  it('liefert null für leere Felder', () => {
    expect(parseCardCount('')).toBeNull();
    expect(parseCardCount('  ')).toBeNull();
  });

  it('liefert NaN für alles andere', () => {
    expect(parseCardCount('3,5')).toBeNaN();
    expect(parseCardCount('-2')).toBeNaN();
    expect(parseCardCount('abc')).toBeNaN();
  });
});
